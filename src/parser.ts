import { ChangelogEntry, ParsedChangelog, ActionConfig } from './types';

/**
 * Validates semantic version format
 */
function isValidSemVer(version: string): boolean {
  // Allow "Unreleased" as a special version
  if (version.toLowerCase() === 'unreleased') {
    return true;
  }

  // Semantic versioning pattern: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
  const semVerPattern =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semVerPattern.test(version);
}

/**
 * Parses a Keep a Changelog formatted file
 */
export function parseChangelog(content: string): ParsedChangelog {
  const entries: ChangelogEntry[] = [];
  const lines = content.split('\n');
  let currentEntry: Partial<ChangelogEntry> | null = null;
  let currentChanges: string[] = [];
  let inEntry = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for version header: ## [version] or ## [version](link) (date) or ## [version] - date
    // Pattern: ## [version](optional-link) (date) or ## [version] - date
    const versionMatch = line.match(/^##\s+\[([^\]]+)\](?:\([^)]+\))?(?:\s*\(([^)]+)\))?(?:\s*-\s*([^-\n]+))?/);
    if (versionMatch) {
      // Save previous entry if exists
      if (currentEntry && inEntry) {
        entries.push({
          version: currentEntry.version!,
          date: currentEntry.date,
          status: currentEntry.status || 'released',
          changes: currentChanges.join('\n').trim(),
        });
      }

      // Start new entry
      const version = versionMatch[1];
      const date1 = versionMatch[2];
      const date2 = versionMatch[3];
      // Check if date1 is actually a date (YYYY-MM-DD format) or a link
      let date: string | undefined = date1 || date2;
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // If date1 doesn't look like a date, try date2, or look for date in the line
        const dateMatch = line.match(/\((\d{4}-\d{2}-\d{2})\)/);
        if (dateMatch) {
          date = dateMatch[1];
        } else if (!date2 || !/^\d{4}-\d{2}-\d{2}$/.test(date2)) {
          date = undefined;
        }
      }

      // Determine status based on version and date
      let status: ChangelogEntry['status'] = 'released';
      if (version.toLowerCase() === 'unreleased') {
        status = 'unreleased';
      } else if (version.includes('-') && (version.includes('alpha') || version.includes('beta') || version.includes('rc'))) {
        status = 'prereleased';
      }

      currentEntry = {
        version,
        date: date || undefined,
        status,
      };
      currentChanges = [];
      inEntry = true;
      continue;
    }

    // Check for yanked status: ## [version] - YANKED
    if (inEntry && trimmedLine.match(/^##\s+\[.+\]\s*-\s*YANKED/i)) {
      if (currentEntry) {
        currentEntry.status = 'yanked';
      }
      continue;
    }

    // Collect content for current entry
    if (inEntry && currentEntry) {
      // Skip empty lines at the start
      if (trimmedLine === '' && currentChanges.length === 0) {
        continue;
      }

      // Stop if we hit another section header (##) that's not part of current entry
      if (line.startsWith('##') && !line.match(/^##\s+\[/)) {
        // This might be a subsection, include it
        currentChanges.push(line);
        continue;
      }

      // Stop if we hit the next version entry
      if (line.match(/^##\s+\[[^\]]+\]/) && currentEntry.version && line !== `## [${currentEntry.version}]`) {
        // Save current entry
        entries.push({
          version: currentEntry.version,
          date: currentEntry.date,
          status: currentEntry.status || 'released',
          changes: currentChanges.join('\n').trim(),
        });
        inEntry = false;
        currentEntry = null;
        currentChanges = [];
        // Process this new entry
        i--; // Rewind to process this line again
        continue;
      }

      currentChanges.push(line);
    }
  }

  // Save last entry
  if (currentEntry && inEntry) {
    entries.push({
      version: currentEntry.version!,
      date: currentEntry.date,
      status: currentEntry.status || 'released',
      changes: currentChanges.join('\n').trim(),
    });
  }

  return { entries };
}

/**
 * Validates changelog entries
 */
export function validateChangelog(
  parsed: ParsedChangelog,
  config: ActionConfig
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const depth = config.validation_depth || 10;
  const entriesToValidate = parsed.entries.slice(0, depth);

  for (const entry of entriesToValidate) {
    // Validate version format
    if (!isValidSemVer(entry.version)) {
      const message = `Invalid version format: ${entry.version}`;
      if (config.validation_level === 'error') {
        errors.push(message);
      } else if (config.validation_level === 'warn') {
        warnings.push(message);
      }
    }

    // Validate date format (if present)
    if (entry.date && entry.date !== 'Unreleased') {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(entry.date)) {
        const message = `Invalid date format for version ${entry.version}: ${entry.date}. Expected YYYY-MM-DD`;
        if (config.validation_level === 'error') {
          errors.push(message);
        } else if (config.validation_level === 'warn') {
          warnings.push(message);
        }
      }
    }

    // Warn if changes are empty
    if (!entry.changes || entry.changes.trim() === '') {
      warnings.push(`Version ${entry.version} has no changes`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Finds a specific version entry
 */
export function findVersionEntry(
  parsed: ParsedChangelog,
  version?: string
): ChangelogEntry | null {
  if (!version) {
    // Return the first (latest) entry
    return parsed.entries.length > 0 ? parsed.entries[0] : null;
  }

  const normalizedVersion = version.toLowerCase();
  for (const entry of parsed.entries) {
    if (entry.version.toLowerCase() === normalizedVersion) {
      return entry;
    }
  }

  return null;
}

/**
 * Loads configuration from a file
 */
export async function loadConfig(configPath: string): Promise<ActionConfig> {
  const fs = require('fs');
  const path = require('path');

  const resolvedPath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const content = await fs.promises.readFile(resolvedPath, 'utf-8');
  const ext = path.extname(resolvedPath).toLowerCase();

  if (ext === '.json' || configPath.endsWith('.json')) {
    return JSON.parse(content);
  } else if (ext === '.yml' || ext === '.yaml') {
    // For YAML, we'd need a YAML parser, but for now just throw an error
    // In a real implementation, you'd use a library like 'js-yaml'
    throw new Error('YAML configuration files are not yet supported. Please use JSON format.');
  }

  throw new Error(`Unsupported configuration file format: ${ext}`);
}

/**
 * Finds configuration file in repository root
 */
export async function findConfigFile(): Promise<string | null> {
  const fs = require('fs');
  const path = require('path');

  const configFiles = [
    '.changelog-reader.json',
    '.changelog-reader.yml',
    '.changelog-reader.yaml',
    '.changelogrc',
    '.changelogrc.json',
  ];

  const rootDir = process.cwd();
  for (const configFile of configFiles) {
    const configPath = path.join(rootDir, configFile);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

