#!/usr/bin/env node

/**
 * Helper script to extract changelog entry and output as GitHub Actions outputs
 * This is used in the release workflow to get the changelog entry
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const changelogPath = process.argv[2] || './CHANGELOG.md';
const version = process.argv[3];

if (!version) {
  console.error('Usage: get-changelog-entry.js <changelog-path> <version>');
  process.exit(1);
}

// Import the built action logic
const actionPath = path.join(__dirname, '..', 'dist', 'index.js');
if (!fs.existsSync(actionPath)) {
  console.error(`Action not built yet. Run 'npm run build' first.`);
  process.exit(1);
}

// Set environment variables to simulate GitHub Actions inputs
process.env.INPUT_PATH = changelogPath;
process.env.INPUT_VERSION = version;
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Run the action and capture outputs
try {
  // The action will set outputs via core.setOutput
  // We need to capture these by running it in a way that we can parse
  // For now, let's use a simpler approach - directly parse the changelog
  const { parseChangelog, findVersionEntry } = require('../dist/parser');
  const { readContent } = require('../dist/path-handler');

  (async () => {
    try {
      const content = await readContent(changelogPath);
      const parsed = parseChangelog(content);
      const entry = findVersionEntry(parsed, version);

      if (!entry) {
        console.error(`Version ${version} not found in changelog`);
        process.exit(1);
      }

      // Output in GitHub Actions format (GITHUB_OUTPUT)
      const outputFile = process.env.GITHUB_OUTPUT;
      const outputs = [
        `version=${entry.version}`,
        `date=${entry.date || ''}`,
        `status=${entry.status}`,
        `changes<<EOF`,
        entry.changes,
        `EOF`
      ].join('\n');
      
      if (outputFile) {
        require('fs').appendFileSync(outputFile, outputs + '\n');
      } else {
        // Fallback for local testing
        console.log(outputs);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  })();
} catch (error) {
  console.error(`Error running action: ${error.message}`);
  process.exit(1);
}

