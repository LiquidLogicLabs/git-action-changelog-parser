import {
  parseChangelog,
  validateChangelog,
  findVersionEntry,
  loadConfig,
  findConfigFile,
} from './parser';
import { ParsedChangelog, ActionConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path modules (for dynamic imports)
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock('path', () => ({
  isAbsolute: jest.fn(),
  resolve: jest.fn(),
  extname: jest.fn(),
  join: jest.fn(),
}));

const mockFs = require('fs');
const mockPath = require('path');

describe('parseChangelog', () => {
  it('should parse a simple changelog with one entry', () => {
    const content = `# Changelog

## [1.0.0] - 2024-01-01

### Added
- Initial release
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual({
      version: '1.0.0',
      date: '2024-01-01',
      status: 'released',
      changes: '### Added\n- Initial release',
    });
  });

  it('should parse multiple changelog entries', () => {
    const content = `# Changelog

## [1.1.0] - 2024-02-01

### Added
- New feature

## [1.0.0] - 2024-01-01

### Added
- Initial release
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].version).toBe('1.1.0');
    expect(result.entries[1].version).toBe('1.0.0');
  });

  it('should parse Unreleased entry', () => {
    const content = `# Changelog

## [Unreleased]

### Added
- Work in progress

## [1.0.0] - 2024-01-01

### Added
- Initial release
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toEqual({
      version: 'Unreleased',
      date: undefined,
      status: 'unreleased',
      changes: '### Added\n- Work in progress',
    });
  });

  it('should detect prereleased status for alpha/beta/rc versions', () => {
    const content = `# Changelog

## [1.0.0-alpha.1] - 2024-01-01

### Added
- Alpha release

## [1.0.0-beta.1] - 2024-01-15

### Added
- Beta release

## [1.0.0-rc.1] - 2024-01-30

### Added
- Release candidate
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(3);
    expect(result.entries[0].status).toBe('prereleased');
    expect(result.entries[1].status).toBe('prereleased');
    expect(result.entries[2].status).toBe('prereleased');
  });

  it('should detect yanked status', () => {
    const content = `# Changelog

## [1.0.0] - YANKED

### Added
- Initial release (yanked)
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].status).toBe('yanked');
  });

  it('should parse version with link', () => {
    const content = `# Changelog

## [1.0.0](https://github.com/owner/repo/releases/tag/v1.0.0) (2024-01-01)

### Added
- Initial release
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].version).toBe('1.0.0');
    expect(result.entries[0].date).toBe('2024-01-01');
  });

  it('should parse version with date in parentheses', () => {
    const content = `# Changelog

## [1.0.0] (2024-01-01)

### Added
- Initial release
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].date).toBe('2024-01-01');
  });

  it('should handle empty changelog', () => {
    const content = `# Changelog

All notable changes to this project will be documented in this file.
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(0);
  });

  it('should handle changelog with no date', () => {
    const content = `# Changelog

## [1.0.0]

### Added
- Initial release
`;

    const result = parseChangelog(content);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].date).toBeUndefined();
  });
});

describe('validateChangelog', () => {
  const validParsed: ParsedChangelog = {
    entries: [
      {
        version: '1.0.0',
        date: '2024-01-01',
        status: 'released',
        changes: '- Initial release',
      },
    ],
  };

  it('should return valid for valid changelog with none validation level', () => {
    const config: ActionConfig = {
      validation_level: 'none',
    };

    const result = validateChangelog(validParsed, config);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should return valid for valid changelog with warn validation level', () => {
    const config: ActionConfig = {
      validation_level: 'warn',
    };

    const result = validateChangelog(validParsed, config);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return errors for invalid version format with error validation level', () => {
    const invalidParsed: ParsedChangelog = {
      entries: [
        {
          version: 'invalid-version',
          date: '2024-01-01',
          status: 'released',
          changes: '- Initial release',
        },
      ],
    };

    const config: ActionConfig = {
      validation_level: 'error',
    };

    const result = validateChangelog(invalidParsed, config);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Invalid version format');
  });

  it('should return warnings for invalid version format with warn validation level', () => {
    const invalidParsed: ParsedChangelog = {
      entries: [
        {
          version: 'invalid-version',
          date: '2024-01-01',
          status: 'released',
          changes: '- Initial release',
        },
      ],
    };

    const config: ActionConfig = {
      validation_level: 'warn',
    };

    const result = validateChangelog(invalidParsed, config);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Invalid version format');
  });

  it('should validate date format', () => {
    const invalidParsed: ParsedChangelog = {
      entries: [
        {
          version: '1.0.0',
          date: '2024/01/01', // Invalid format
          status: 'released',
          changes: '- Initial release',
        },
      ],
    };

    const config: ActionConfig = {
      validation_level: 'error',
    };

    const result = validateChangelog(invalidParsed, config);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Invalid date format');
  });

  it('should warn for empty changes', () => {
    const emptyChangesParsed: ParsedChangelog = {
      entries: [
        {
          version: '1.0.0',
          date: '2024-01-01',
          status: 'released',
          changes: '',
        },
      ],
    };

    const config: ActionConfig = {
      validation_level: 'warn',
    };

    const result = validateChangelog(emptyChangesParsed, config);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('has no changes');
  });

  it('should respect validation_depth', () => {
    const manyEntries: ParsedChangelog = {
      entries: Array.from({ length: 20 }, (_, i) => ({
        version: `${i + 1}.0.0`,
        date: '2024-01-01',
        status: 'released' as const,
        changes: '- Release',
      })),
    };

    const config: ActionConfig = {
      validation_level: 'warn',
      validation_depth: 5,
    };

    const result = validateChangelog(manyEntries, config);

    // Should only validate first 5 entries
    expect(result.warnings.length).toBeLessThanOrEqual(5);
  });

  it('should accept Unreleased as valid version', () => {
    const unreleasedParsed: ParsedChangelog = {
      entries: [
        {
          version: 'Unreleased',
          date: undefined,
          status: 'unreleased',
          changes: '- Work in progress',
        },
      ],
    };

    const config: ActionConfig = {
      validation_level: 'error',
    };

    const result = validateChangelog(unreleasedParsed, config);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('findVersionEntry', () => {
  const parsed: ParsedChangelog = {
    entries: [
      {
        version: '1.1.0',
        date: '2024-02-01',
        status: 'released',
        changes: '- New feature',
      },
      {
        version: '1.0.0',
        date: '2024-01-01',
        status: 'released',
        changes: '- Initial release',
      },
      {
        version: '0.9.0',
        date: '2023-12-01',
        status: 'released',
        changes: '- Beta release',
      },
    ],
  };

  it('should return first entry when version is not provided', () => {
    const result = findVersionEntry(parsed);

    expect(result).toEqual(parsed.entries[0]);
  });

  it('should return null when entries array is empty', () => {
    const emptyParsed: ParsedChangelog = {
      entries: [],
    };

    const result = findVersionEntry(emptyParsed);

    expect(result).toBeNull();
  });

  it('should find entry by exact version match', () => {
    const result = findVersionEntry(parsed, '1.0.0');

    expect(result).toEqual(parsed.entries[1]);
  });

  it('should find entry by case-insensitive version match', () => {
    const result = findVersionEntry(parsed, 'UNRELEASED');

    // This would work if we had an Unreleased entry
    const unreleasedParsed: ParsedChangelog = {
      entries: [
        {
          version: 'Unreleased',
          date: undefined,
          status: 'unreleased',
          changes: '- Work in progress',
        },
        ...parsed.entries,
      ],
    };

    const unreleasedResult = findVersionEntry(unreleasedParsed, 'UNRELEASED');
    expect(unreleasedResult?.version).toBe('Unreleased');
  });

  it('should return null when version is not found', () => {
    const result = findVersionEntry(parsed, '2.0.0');

    expect(result).toBeNull();
  });
});

describe('loadConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.extname.mockReturnValue('.json');
  });

  it('should load JSON config file', async () => {
    const configPath = '.changelog-reader.json';
    const configContent = JSON.stringify({
      path: './CHANGELOG.md',
      validation_level: 'warn',
    });

    mockFs.existsSync.mockReturnValue(true);
    mockFs.promises.readFile.mockResolvedValue(configContent);

    const result = await loadConfig(configPath);

    expect(result).toEqual({
      path: './CHANGELOG.md',
      validation_level: 'warn',
    });
    expect(mockFs.promises.readFile).toHaveBeenCalledWith(
      expect.stringContaining(configPath),
      'utf-8'
    );
  });

  it('should throw error when config file does not exist', async () => {
    const configPath = '.changelog-reader.json';

    mockFs.existsSync.mockReturnValue(false);

    await expect(loadConfig(configPath)).rejects.toThrow(
      'Configuration file not found'
    );
  });

  it('should throw error for YAML files (not yet supported)', async () => {
    const configPath = '.changelog-reader.yml';
    const configContent = 'path: ./CHANGELOG.md';

    mockFs.existsSync.mockReturnValue(true);
    mockPath.extname.mockReturnValue('.yml');
    mockFs.promises.readFile.mockResolvedValue(configContent);

    await expect(loadConfig(configPath)).rejects.toThrow(
      'YAML configuration files are not yet supported'
    );
  });

  it('should throw error for unsupported file format', async () => {
    const configPath = '.changelog-reader.txt';

    mockFs.existsSync.mockReturnValue(true);
    mockPath.extname.mockReturnValue('.txt');
    mockFs.promises.readFile.mockResolvedValue('some content');

    await expect(loadConfig(configPath)).rejects.toThrow(
      'Unsupported configuration file format'
    );
  });

  it('should handle absolute paths', async () => {
    const configPath = '/absolute/path/.changelog-reader.json';
    const configContent = JSON.stringify({ path: './CHANGELOG.md' });

    mockPath.isAbsolute.mockReturnValue(true);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.promises.readFile.mockResolvedValue(configContent);

    const result = await loadConfig(configPath);

    expect(result).toEqual({ path: './CHANGELOG.md' });
    expect(mockPath.resolve).not.toHaveBeenCalled();
  });
});

describe('findConfigFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
  });

  it('should find .changelog-reader.json', async () => {
    mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      return String(filePath).includes('.changelog-reader.json');
    });

    const result = await findConfigFile();

    expect(result).toContain('.changelog-reader.json');
  });

  it('should find .changelog-reader.yml if .json does not exist', async () => {
    mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      return String(filePath).includes('.changelog-reader.yml');
    });

    const result = await findConfigFile();

    expect(result).toContain('.changelog-reader.yml');
  });

  it('should find .changelogrc.json', async () => {
    mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      return String(filePath).includes('.changelogrc.json');
    });

    const result = await findConfigFile();

    expect(result).toContain('.changelogrc.json');
  });

  it('should return null when no config file exists', async () => {
    mockFs.existsSync.mockReturnValue(false);

    const result = await findConfigFile();

    expect(result).toBeNull();
  });

  it('should check files in order of priority', async () => {
    let callCount = 0;
    mockFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      callCount++;
      // Return true for the third file checked
      return callCount === 3;
    });

    const result = await findConfigFile();

    expect(result).not.toBeNull();
    expect(mockFs.existsSync).toHaveBeenCalledTimes(3);
  });
});
