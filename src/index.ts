import * as core from '@actions/core';
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
    // Get inputs
    let path = core.getInput('path');
    let repoUrl = core.getInput('repo_url');
    let ref = core.getInput('ref') || 'main';
    let repoType = (core.getInput('repo_type') ||
      'auto') as 'auto' | 'github' | 'gitea' | 'gitlab' | 'bitbucket';
    const token = core.getInput('token') || process.env.GITHUB_TOKEN;
    const version = core.getInput('version');
    const validationLevel = (core.getInput('validation_level') ||
      'none') as 'none' | 'warn' | 'error';
    const validationDepth = parseInt(
      core.getInput('validation_depth') || '10',
      10
    );
    const configFileInput = core.getInput('config_file');

    // Load configuration if provided
    let config: ActionConfig = {
      validation_level: validationLevel,
      validation_depth: validationDepth,
    };

    if (configFileInput) {
      const fileConfig = await loadConfig(configFileInput);
      config = { ...config, ...fileConfig };
    } else {
      // Try to find config file automatically
      const foundConfigFile = await findConfigFile();
      if (foundConfigFile) {
        const fileConfig = await loadConfig(foundConfigFile);
        config = { ...config, ...fileConfig };
      }
    }

    // Override inputs from config if not explicitly provided
    if (config.path && !core.getInput('path')) {
      path = config.path;
    }
    if (config.repo_url && !core.getInput('repo_url')) {
      repoUrl = config.repo_url;
    }
    if (config.ref && !core.getInput('ref')) {
      ref = config.ref;
    }
    if (config.repo_type && !core.getInput('repo_type')) {
      repoType = config.repo_type;
    }

    // Determine the final path/URL to use
    let finalPath: string;
    
    // If repo_url is provided, it takes precedence (even if path has a default value)
    if (repoUrl) {
      finalPath = constructChangelogUrl(repoUrl, ref, repoType);
      core.info(`Constructed CHANGELOG.md URL from repo_url: ${finalPath}`);
    }
    // Check if path is a repository root URL
    else if (path && isRepoRootUrl(path)) {
      finalPath = constructChangelogUrl(path, ref, repoType);
      core.info(`Detected repo root URL, constructed CHANGELOG.md URL: ${finalPath}`);
    }
    // Use path as-is (default behavior)
    else {
      finalPath = path || './CHANGELOG.md';
    }

    // Validation settings are already set from config above

    core.info(`Reading changelog from: ${finalPath}`);

    // Read changelog content
    let content: string;
    try {
      content = await readContent(finalPath, token);
    } catch (error) {
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
    const parsed = parseChangelog(content);

    if (parsed.entries.length === 0) {
      throw new Error('No changelog entries found');
    }

    core.info(`Found ${parsed.entries.length} changelog entries`);

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
    const entry = findVersionEntry(parsed, version);

    if (!entry) {
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

