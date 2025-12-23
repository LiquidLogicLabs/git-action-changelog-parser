import * as core from '@actions/core';
import { readContent } from './path-handler';
import {
  parseChangelog,
  validateChangelog,
  findVersionEntry,
  loadConfig,
  findConfigFile,
} from './parser';
import { ActionConfig } from './types';

async function run(): Promise<void> {
  try {
    // Get inputs
    let path = core.getInput('path') || './CHANGELOG.md';
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

    // Override path from config if not explicitly provided
    if (config.path && !core.getInput('path')) {
      path = config.path;
    }

    // Override validation settings from config
    if (config.validation_level) {
      config.validation_level = config.validation_level;
    }
    if (config.validation_depth) {
      config.validation_depth = config.validation_depth;
    }

    core.info(`Reading changelog from: ${path}`);

    // Read changelog content
    const content = await readContent(path, token);

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

