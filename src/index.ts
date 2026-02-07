import * as core from '@actions/core';
import { getInputs } from './config';
import { readContent, isRepoRootUrl, constructChangelogUrl } from './path-handler';
import {
  parseChangelog,
  validateChangelog,
  findVersionEntry,
  loadConfig,
  findConfigFile,
} from './parser';
import { ActionConfig } from './types';

export async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    let path = inputs.path;
    let repoUrl = inputs.repoUrl;
    let ref = inputs.ref;
    let repoType = inputs.repoType;
    const token = inputs.token;
    const version = inputs.version;
    const validationLevel = inputs.validationLevel;
    const validationDepth = inputs.validationDepth;
    const configFileInput = inputs.configFile;
    const debug = inputs.debugEnabled;
    const ignoreCertErrors = inputs.skipCertificateCheck;

    // Debug logging helper (uses core.debug which respects ACTIONS_STEP_DEBUG)
    const debugLog = (message: string) => {
      if (debug) {
        core.debug(message);
      }
    };

    debugLog('=== Changelog Parser Action Debug Mode ===');
    debugLog(`Inputs received:`);
    debugLog(`  path: ${path || '(empty)'}`);
    debugLog(`  repoUrl: ${repoUrl || '(empty)'}`);
    debugLog(`  ref: ${ref}`);
    debugLog(`  repoType: ${repoType}`);
    debugLog(`  version: ${version || '(empty)'}`);
    debugLog(`  validationLevel: ${validationLevel}`);
    debugLog(`  validationDepth: ${validationDepth}`);
    debugLog(`  configFile: ${configFileInput || '(empty)'}`);
    debugLog(`  token: ${token ? '***' : '(empty)'}`);

    // Load configuration if provided
    let config: ActionConfig = {
      validation_level: validationLevel,
      validation_depth: validationDepth,
    };

    if (configFileInput) {
      debugLog(`Loading config from: ${configFileInput}`);
      const fileConfig = await loadConfig(configFileInput);
      config = { ...config, ...fileConfig };
      debugLog(`Config loaded: ${JSON.stringify(fileConfig, null, 2)}`);
    } else {
      // Try to find config file automatically
      const foundConfigFile = await findConfigFile();
      if (foundConfigFile) {
        debugLog(`Auto-detected config file: ${foundConfigFile}`);
        const fileConfig = await loadConfig(foundConfigFile);
        config = { ...config, ...fileConfig };
        debugLog(`Config loaded: ${JSON.stringify(fileConfig, null, 2)}`);
      } else {
        debugLog('No config file found');
      }
    }

    // Override inputs from config if not explicitly provided
    if (config.path && !inputs.hasPathInput) {
      path = config.path;
    }
    if (config.repo_url && !inputs.hasRepoUrlInput) {
      repoUrl = config.repo_url;
    }
    if (config.ref && !inputs.hasRefInput) {
      ref = config.ref;
    }
    if (config.repo_type && !inputs.hasRepoTypeInput) {
      repoType = config.repo_type;
    }

    // Determine the final path/URL to use
    let finalPath: string;
    
    debugLog('=== Determining final path/URL ===');
    // If repoUrl is provided, it takes precedence (even if path has a default value)
    if (repoUrl) {
      debugLog(`Using repoUrl (takes precedence): ${repoUrl}`);
      debugLog(`  ref: ${ref}`);
      debugLog(`  repoType: ${repoType}`);
      finalPath = constructChangelogUrl(repoUrl, ref, repoType);
      core.info(`Constructed CHANGELOG.md URL from repoUrl: ${finalPath}`);
      debugLog(`  Constructed URL: ${finalPath}`);
    }
    // Check if path is a repository root URL
    else if (path && isRepoRootUrl(path)) {
      debugLog(`Path is a repository root URL: ${path}`);
      debugLog(`  ref: ${ref}`);
      debugLog(`  repoType: ${repoType}`);
      finalPath = constructChangelogUrl(path, ref, repoType);
      core.info(`Detected repo root URL, constructed CHANGELOG.md URL: ${finalPath}`);
      debugLog(`  Constructed URL: ${finalPath}`);
    }
    // Use path as-is (default behavior)
    else {
      finalPath = path || './CHANGELOG.md';
      debugLog(`Using path as-is: ${finalPath}`);
    }

    // Validation settings are already set from config above

    core.info(`Reading changelog from: ${finalPath}`);
    debugLog(`Attempting to read content from: ${finalPath}`);
    debugLog(`  Is URL: ${finalPath.startsWith('http://') || finalPath.startsWith('https://')}`);
    if (token) {
      debugLog(`  Token provided: ${token.substring(0, 4)}...`);
    } else {
      debugLog(`  No token provided`);
    }
    if (ignoreCertErrors) {
      debugLog(`  Skipping TLS certificate verification`);
      core.warning('SSL certificate validation is disabled. This is a security risk and should only be used with self-hosted instances with self-signed certificates.');
    }

    // Read changelog content
    let content: string;
    try {
      content = await readContent(finalPath, token, ignoreCertErrors);
      debugLog(`Successfully read ${content.length} characters from changelog`);
    } catch (error) {
      debugLog(`Error reading changelog: ${error instanceof Error ? error.message : String(error)}`);
      // Check if it's a 404 error (file not found)
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('not found'))) {
        core.info('CHANGELOG.md not found at the specified location');
        core.setOutput('version', '');
        core.setOutput('date', '');
        core.setOutput('status', 'nofound');
        core.setOutput('changes', '');
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!content || content.trim() === '') {
      throw new Error('Changelog file is empty');
    }

    // Parse changelog
    debugLog('Parsing changelog content...');
    const parsed = parseChangelog(content);
    debugLog(`Parsed ${parsed.entries.length} changelog entries`);

    if (parsed.entries.length === 0) {
      throw new Error('No changelog entries found');
    }

    core.info(`Found ${parsed.entries.length} changelog entries`);
    
    if (debug && parsed.entries.length > 0) {
      debugLog('Available versions:');
      parsed.entries.slice(0, 10).forEach((entry, idx) => {
        debugLog(`  ${idx + 1}. ${entry.version} (${entry.status})${entry.date ? ` - ${entry.date}` : ''}`);
      });
      if (parsed.entries.length > 10) {
        debugLog(`  ... and ${parsed.entries.length - 10} more`);
      }
    }

    // Validate if requested
    if (config.validation_level !== 'none') {
      const validation = validateChangelog(parsed, config);
      
      // Output warnings
      for (const warning of validation.warnings) {
        core.warning(warning);
      }

      // Output errors
      for (const error of validation.errors) {
        core.error(error);
      }

      // Fail if validation level is error and there are errors
      if (config.validation_level === 'error' && !validation.valid) {
        throw new Error(
          `Changelog validation failed:\n${validation.errors.join('\n')}`
        );
      }
    }

    // Find the requested version entry
    debugLog(`Searching for version: ${version || '(latest)'}`);
    const entry = findVersionEntry(parsed, version);

    if (!entry) {
      debugLog(`Version entry not found. Available versions: ${parsed.entries.map(e => e.version).join(', ')}`);
      const versionMsg = version
        ? `Version "${version}" not found`
        : 'No version entry found';
      throw new Error(versionMsg);
    }

    core.info(`Found entry for version: ${entry.version}`);

    // Set outputs
    core.setOutput('version', entry.version);
    core.setOutput('date', entry.date || '');
    core.setOutput('status', entry.status);
    core.setOutput('changes', entry.changes);

    core.info('Changelog parsed successfully');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred');
    }
  }
}

// Run the action
run();

