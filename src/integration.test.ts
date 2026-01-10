/**
 * Integration tests - Test multiple components working together
 * These tests verify that path-handler, parser, and file operations work together correctly
 */

import * as fs from 'fs';
import * as path from 'path';
import { readContent, convertBlobToRaw, isRepoRootUrl, constructChangelogUrl } from './path-handler';
import { parseChangelog, findVersionEntry } from './parser';

// Mock fs, path, and https for integration tests
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

jest.mock('https');

const mockFs = require('fs');
const mockPath = require('path');
const mockHttps = require('https');

describe('Integration Tests - Path Handler + Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.isAbsolute.mockReturnValue(false);
    mockPath.resolve.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.extname.mockReturnValue('.md');
    mockFs.existsSync.mockReturnValue(true);
  });

  describe('Local file reading and parsing integration', () => {
    it('should read local file and parse changelog successfully', async () => {
      const changelogContent = `# Changelog

## [1.0.0] - 2024-01-01

### Added
- Initial release
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockResolvedValue(changelogContent);

      const content = await readContent('./CHANGELOG.md');
      const parsed = parseChangelog(content);
      const entry = findVersionEntry(parsed, '1.0.0');

      expect(content).toBe(changelogContent);
      expect(parsed.entries).toHaveLength(1);
      expect(entry).not.toBeNull();
      expect(entry?.version).toBe('1.0.0');
      expect(entry?.date).toBe('2024-01-01');
      expect(entry?.status).toBe('released');
    });

    it('should handle URL conversion and parsing flow', () => {
      // Test the integration of convertBlobToRaw + URL construction
      const blobUrl = 'https://github.com/owner/repo/blob/main/CHANGELOG.md';
      const rawUrl = convertBlobToRaw(blobUrl);
      
      expect(rawUrl).toBe('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
      
      // Test parsing a sample changelog (without actually fetching)
      const changelogContent = `# Changelog
## [1.0.0] - 2024-01-01
### Added
- Initial release
`;

      const parsed = parseChangelog(changelogContent);
      const entry = findVersionEntry(parsed, '1.0.0');

      expect(parsed.entries).toHaveLength(1);
      expect(entry?.version).toBe('1.0.0');
    });
  });

  describe('Repository URL detection and changelog URL construction integration', () => {
    it('should detect repo root URL and construct changelog URL correctly', () => {
      const repoUrl = 'https://github.com/owner/repo';
      
      expect(isRepoRootUrl(repoUrl)).toBe(true);
      
      const changelogUrl = constructChangelogUrl(repoUrl, 'main', 'github');
      
      expect(changelogUrl).toContain('raw.githubusercontent.com');
      expect(changelogUrl).toContain('owner/repo');
      expect(changelogUrl).toContain('main');
      expect(changelogUrl).toContain('CHANGELOG.md');
    });

    it('should handle repo_url input with version lookup integration', () => {
      const repoUrl = 'https://github.com/owner/repo';
      const ref = 'v1.0.0';
      const version = '1.0.0';

      const changelogUrl = constructChangelogUrl(repoUrl, ref, 'github');
      
      expect(changelogUrl).toContain('raw.githubusercontent.com');
      expect(changelogUrl).toContain('v1.0.0');
      expect(changelogUrl).toContain('CHANGELOG.md');

      // Test parsing a sample changelog (without actually fetching)
      const changelogContent = `# Changelog
## [1.0.0] - 2024-01-01
### Added
- Initial release
`;

      const parsed = parseChangelog(changelogContent);
      const entry = findVersionEntry(parsed, version);

      expect(entry).not.toBeNull();
      expect(entry?.version).toBe(version);
    });
  });

  describe('Error handling integration', () => {
    it('should handle missing local file gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(readContent('./nonexistent.md')).rejects.toThrow(/Error reading file|ENOENT/i);
    });
  });

  describe('Version matching and parsing integration', () => {
    it('should find version entry after parsing complete changelog', async () => {
      const changelogContent = `# Changelog

## [1.2.0] - 2024-03-01

### Added
- Feature B

## [1.1.0] - 2024-02-01

### Added
- Feature A

## [1.0.0] - 2024-01-01

### Added
- Initial release
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockResolvedValue(changelogContent);

      const content = await readContent('./CHANGELOG.md');
      const parsed = parseChangelog(content);
      
      expect(parsed.entries).toHaveLength(3);

      // Test finding different versions
      const entry1_2_0 = findVersionEntry(parsed, '1.2.0');
      const entry1_1_0 = findVersionEntry(parsed, '1.1.0');
      const entry1_0_0 = findVersionEntry(parsed, '1.0.0');
      const entryUnreleased = findVersionEntry(parsed, 'Unreleased');

      expect(entry1_2_0?.version).toBe('1.2.0');
      expect(entry1_1_0?.version).toBe('1.1.0');
      expect(entry1_0_0?.version).toBe('1.0.0');
      expect(entryUnreleased).toBeNull();
    });
  });
});
