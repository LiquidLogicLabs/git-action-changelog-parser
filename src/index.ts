import * as core from '@actions/core';
import * as fs from 'fs';
import * as nodePath from 'path';
import { getInputs } from './config';
import {
  readContent,
  isRepoRootUrl,
  constructChangelogUrl,
} from './path-handler';
import {
  parseChangelog,
  validateChangelog,
  findVersionEntry,
  loadConfig,
  findConfigFile,
} from './parser';
import { ActionConfig } from './types';
import { Logger } from './logger';

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
    const ignoreCertErrors = inputs.skipCertificateCheck;
    const outputFile = inputs.outputFile;

    const logger = new Logger(inputs.verbose, inputs.debugMode);

    logger.verboseInfo('=== Changelog Parser Action Debug Mode ===');
    logger.verboseInfo(`Inputs received:`);
    logger.verboseInfo(`  path: ${path || '(empty)'}`);
    logger.verboseInfo(`  repo-url: ${repoUrl || '(empty)'}`);
    logger.verboseInfo(`  ref: ${ref}`);
    logger.verboseInfo(`  repo-type: ${repoType}`);
    logger.verboseInfo(`  version: ${version || '(empty)'}`);
    logger.verboseInfo(`  validation-level: ${validationLevel}`);
    logger.verboseInfo(`  validation-depth: ${validationDepth}`);
    logger.verboseInfo(`  config-file: ${configFileInput || '(empty)'}`);
    logger.verboseInfo(`  token: ${token ? '***' : '(empty)'}`);
    logger.verboseInfo(`  output-file: ${outputFile || '(empty)'}`);

    // Load configuration if provided
    let config: ActionConfig = {
      validation_level: validationLevel,
      validation_depth: validationDepth,
    };

    if (configFileInput) {
      logger.verboseInfo(`Loading config from: ${configFileInput}`);
      const fileConfig = await loadConfig(configFileInput);
      config = { ...config, ...fileConfig };
      logger.debug(`Config loaded: ${JSON.stringify(fileConfig, null, 2)}`);
    } else {
      // Try to find config file automatically
      const foundConfigFile = await findConfigFile();
      if (foundConfigFile) {
        logger.verboseInfo(`Auto-detected config file: ${foundConfigFile}`);
        const fileConfig = await loadConfig(foundConfigFile);
        config = { ...config, ...fileConfig };
        logger.debug(`Config loaded: ${JSON.stringify(fileConfig, null, 2)}`);
      } else {
        logger.verboseInfo('No config file found');
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

    logger.verboseInfo('=== Determining final path/URL ===');
    // If repoUrl is provided, it takes precedence (even if path has a default value)
    if (repoUrl) {
      logger.verboseInfo(`Using repo-url (takes precedence): ${repoUrl}`);
      logger.verboseInfo(`  ref: ${ref}`);
      logger.verboseInfo(`  repo-type: ${repoType}`);
      finalPath = constructChangelogUrl(repoUrl, ref, repoType);
      core.info(`Constructed CHANGELOG.md URL from repo-url: ${finalPath}`);
      logger.verboseInfo(`  Constructed URL: ${finalPath}`);
    }
    // Check if path is a repository root URL
    else if (path && isRepoRootUrl(path)) {
      logger.verboseInfo(`Path is a repository root URL: ${path}`);
      logger.verboseInfo(`  ref: ${ref}`);
      logger.verboseInfo(`  repo-type: ${repoType}`);
      finalPath = constructChangelogUrl(path, ref, repoType);
      core.info(
        `Detected repo root URL, constructed CHANGELOG.md URL: ${finalPath}`
      );
      logger.verboseInfo(`  Constructed URL: ${finalPath}`);
    }
    // Use path as-is (default behavior)
    else {
      finalPath = path || './CHANGELOG.md';
      logger.verboseInfo(`Using path as-is: ${finalPath}`);
    }

    // Validation settings are already set from config above

    core.info(`Reading changelog from: ${finalPath}`);
    logger.verboseInfo(`Attempting to read content from: ${finalPath}`);
    logger.verboseInfo(
      `  Is URL: ${finalPath.startsWith('http://') || finalPath.startsWith('https://')}`
    );
    if (token) {
      logger.debug(`  Token provided: ${token.substring(0, 4)}...`);
    } else {
      logger.verboseInfo(`  No token provided`);
    }
    if (ignoreCertErrors) {
      logger.verboseInfo(`  Skipping TLS certificate verification`);
      core.warning(
        'SSL certificate validation is disabled. This is a security risk and should only be used with self-hosted instances with self-signed certificates.'
      );
    }

    // Read changelog content
    let content: string;
    try {
      content = await readContent(finalPath, token, ignoreCertErrors);
      logger.verboseInfo(
        `Successfully read ${content.length} characters from changelog`
      );
    } catch (error) {
      logger.debug(
        `Error reading changelog: ${error instanceof Error ? error.message : String(error)}`
      );
      // Check if it's a 404 error (file not found)
      if (
        error instanceof Error &&
        (error.message.includes('404') || error.message.includes('not found'))
      ) {
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
    logger.verboseInfo('Parsing changelog content...');
    const parsed = parseChangelog(content);
    logger.verboseInfo(`Parsed ${parsed.entries.length} changelog entries`);

    if (parsed.entries.length === 0) {
      throw new Error('No changelog entries found');
    }

    core.info(`Found ${parsed.entries.length} changelog entries`);

    if (logger.isVerbose() && parsed.entries.length > 0) {
      logger.verboseInfo('Available versions:');
      parsed.entries.slice(0, 10).forEach((entry, idx) => {
        logger.verboseInfo(
          `  ${idx + 1}. ${entry.version} (${entry.status})${entry.date ? ` - ${entry.date}` : ''}`
        );
      });
      if (parsed.entries.length > 10) {
        logger.verboseInfo(`  ... and ${parsed.entries.length - 10} more`);
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
    logger.verboseInfo(`Searching for version: ${version || '(latest)'}`);
    const entry = findVersionEntry(parsed, version);

    if (!entry) {
      logger.verboseInfo(
        `Version entry not found. Available versions: ${parsed.entries.map((e) => e.version).join(', ')}`
      );
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

    const changesEscaped = entry.changes
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n/g, '\\n');
    core.setOutput('changes-escaped', changesEscaped);

    if (outputFile) {
      const resolvedPath = nodePath.resolve(outputFile);
      logger.verboseInfo(`Writing changes to output file:`);
      logger.verboseInfo(`  output-file input: ${outputFile}`);
      logger.verboseInfo(`  resolved path: ${resolvedPath}`);
      logger.debug(`  changes length: ${entry.changes.length} characters`);
      try {
        await fs.promises.writeFile(resolvedPath, entry.changes, 'utf8');
        core.info(`Changelog changes written to: ${resolvedPath}`);
        logger.verboseInfo(`  changes-file output set to: ${resolvedPath}`);
        core.setOutput('changes-file', resolvedPath);
      } catch (writeError) {
        throw new Error(
          `Failed to write output file "${resolvedPath}": ${writeError instanceof Error ? writeError.message : String(writeError)}`
        );
      }
    } else {
      logger.verboseInfo('No output-file specified, skipping file write');
    }

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
