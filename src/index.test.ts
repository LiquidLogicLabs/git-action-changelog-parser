import * as core from '@actions/core';
import { readContent, isRepoRootUrl, constructChangelogUrl } from './path-handler';
import { parseChangelog, findVersionEntry, findConfigFile, loadConfig, validateChangelog } from './parser';
import { run } from './index';

// Mock dependencies
jest.mock('@actions/core');
jest.mock('./path-handler');
jest.mock('./parser');

const mockCore = core as jest.Mocked<typeof core>;
const mockReadContent = readContent as jest.MockedFunction<typeof readContent>;
const mockIsRepoRootUrl = isRepoRootUrl as jest.MockedFunction<typeof isRepoRootUrl>;
const mockConstructChangelogUrl = constructChangelogUrl as jest.MockedFunction<typeof constructChangelogUrl>;
const mockParseChangelog = parseChangelog as jest.MockedFunction<typeof parseChangelog>;
const mockFindVersionEntry = findVersionEntry as jest.MockedFunction<typeof findVersionEntry>;
const mockFindConfigFile = findConfigFile as jest.MockedFunction<typeof findConfigFile>;
const mockLoadConfig = loadConfig as jest.MockedFunction<typeof loadConfig>;
const mockValidateChangelog = validateChangelog as jest.MockedFunction<typeof validateChangelog>;

describe('Changelog Parser Action', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // No need to reset modules since we're calling run() directly now
    
    // Clear GITHUB_TOKEN from environment for tests
    delete process.env.GITHUB_TOKEN;
    
    // Set default mock implementations
    mockCore.getInput.mockImplementation((name: string) => {
      const defaults: Record<string, string> = {
        path: '',
        repoUrl: '',
        ref: 'main',
        token: '',
        version: '',
        validationLevel: 'none',
        validationDepth: '10',
        configFile: '',
      };
      return defaults[name] || '';
    });
    mockCore.getBooleanInput.mockImplementation(() => false);
    
    mockCore.setOutput = jest.fn();
    mockCore.info = jest.fn();
    mockCore.warning = jest.fn();
    mockCore.error = jest.fn();
    mockCore.setFailed = jest.fn();
    
    // Mock config file functions to return null/empty by default
    mockFindConfigFile.mockResolvedValue(null);
    mockLoadConfig.mockResolvedValue({});
    
    // Set default parseChangelog return value
    mockParseChangelog.mockReturnValue({
      entries: [
        {
          version: '1.0.0',
          date: '2024-01-01',
          status: 'released',
          changes: '- Initial release',
        },
      ],
    });
    
    // Set default findVersionEntry to return first entry when no version specified, or match version
    mockFindVersionEntry.mockImplementation((parsed, version) => {
      if (!version && parsed.entries.length > 0) {
        return parsed.entries[0];
      }
      if (version && parsed.entries.length > 0) {
        return parsed.entries.find(e => e.version === version) || parsed.entries[0];
      }
      return parsed.entries[0] || null;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('repoUrl handling', () => {
    it('should construct CHANGELOG.md URL when path is blank and repoUrl is provided', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'repoUrl') return 'https://github.com/owner/repo';
        if (name === 'ref') return 'main';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockConstructChangelogUrl.mockReturnValue('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });
      // Call run() directly
      await run();

      expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'main', 'auto');
      expect(mockReadContent).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md', undefined, false);
    });

    it('should use provided ref when constructing URL from repoUrl', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'repoUrl') return 'https://github.com/owner/repo';
        if (name === 'ref') return 'develop';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockConstructChangelogUrl.mockReturnValue('https://raw.githubusercontent.com/owner/repo/develop/CHANGELOG.md');
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'develop', 'auto');
    });

    it('should default to main when ref is not provided', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'repoUrl') return 'https://github.com/owner/repo';
        if (name === 'ref') return '';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockConstructChangelogUrl.mockReturnValue('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'main', 'auto');
    });
  });

  describe('repo root URL detection in path', () => {
    it('should detect repo root URL in path and construct CHANGELOG.md URL', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return 'https://github.com/owner/repo';
        if (name === 'ref') return 'main';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(true);
      mockConstructChangelogUrl.mockReturnValue('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockIsRepoRootUrl).toHaveBeenCalledWith('https://github.com/owner/repo');
      expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'main', 'auto');
    });

    it('should not detect repo root if path is a file URL', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return 'https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockIsRepoRootUrl).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
      expect(mockConstructChangelogUrl).not.toHaveBeenCalled();
      expect(mockReadContent).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md', undefined, false);
    });
  });

  describe('404 error handling', () => {
    it('should set status to nofound when CHANGELOG.md is not found', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'repoUrl') return 'https://github.com/owner/repo';
        if (name === 'ref') return 'main';
        return '';
      });
      
      mockConstructChangelogUrl.mockReturnValue('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
      mockReadContent.mockRejectedValue(new Error('Failed to fetch https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md: 404 Not Found'));

      await run();

      expect(mockCore.setOutput).toHaveBeenCalledWith('version', '');
      expect(mockCore.setOutput).toHaveBeenCalledWith('date', '');
      expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'nofound');
      expect(mockCore.setOutput).toHaveBeenCalledWith('changes', '');
      expect(mockCore.setFailed).not.toHaveBeenCalled();
    });

    it('should handle 404 error with "not found" message', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return './CHANGELOG.md';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockRejectedValue(new Error('Error reading file ./CHANGELOG.md: not found'));

      await run();

      expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'nofound');
      expect(mockCore.setFailed).not.toHaveBeenCalled();
    });

    it('should re-throw non-404 errors', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return './CHANGELOG.md';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockRejectedValue(new Error('Network error'));

      await run();

      expect(mockCore.setFailed).toHaveBeenCalledWith('Network error');
    });
  });

  describe('backward compatibility', () => {
    it('should work with local file paths', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return './CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockReadContent).toHaveBeenCalledWith('./CHANGELOG.md', undefined, false);
      expect(mockConstructChangelogUrl).not.toHaveBeenCalled();
    });

    it('should work with remote file URLs', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return 'https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockReadContent).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md', undefined, false);
      expect(mockConstructChangelogUrl).not.toHaveBeenCalled();
    });

    it('should default to ./CHANGELOG.md when path is not provided', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockReadContent).toHaveBeenCalledWith('./CHANGELOG.md', undefined, false);
    });
  });

  describe('validation', () => {
    it('should call validateChangelog when validationLevel is warn', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return './CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        if (name === 'validationLevel') return 'warn';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });
      mockValidateChangelog.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      });

      await run();

      expect(mockValidateChangelog).toHaveBeenCalled();
    });

    it('should call validateChangelog when validationLevel is error', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return './CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        if (name === 'validationLevel') return 'error';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });
      mockValidateChangelog.mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      });

      await run();

      expect(mockValidateChangelog).toHaveBeenCalled();
    });
  });

  describe('config file handling', () => {
    it('should load config file when configFile is provided', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return './CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        if (name === 'configFile') return '.changelog-reader.json';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });
      mockLoadConfig.mockResolvedValue({
        path: './CHANGELOG.md',
        validation_level: 'warn',
      });

      await run();

      expect(mockLoadConfig).toHaveBeenCalledWith('.changelog-reader.json');
    });

    it('should auto-detect config file when configFile is not provided', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return './CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });
      mockFindConfigFile.mockResolvedValue('.changelog-reader.json');
      mockLoadConfig.mockResolvedValue({
        validation_level: 'warn',
      });

      await run();

      expect(mockFindConfigFile).toHaveBeenCalled();
    });
  });

  describe('repoType explicit specification', () => {
    it('should use explicit repoType when provided', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'repoUrl') return 'https://git.ravenwolf.org/owner/repo';
        if (name === 'ref') return 'main';
        if (name === 'repoType') return 'gitea';
        if (name === 'version') return '1.0.0';
        return '';
      });
      
      mockConstructChangelogUrl.mockReturnValue('https://git.ravenwolf.org/owner/repo/raw/branch/main/CHANGELOG.md');
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockConstructChangelogUrl).toHaveBeenCalledWith(
        'https://git.ravenwolf.org/owner/repo',
        'main',
        'gitea'
      );
    });
  });

  describe('skipCertificateCheck', () => {
    it('should pass skipCertificateCheck to readContent', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'path') return 'https://example.com/CHANGELOG.md';
        if (name === 'version') return '1.0.0';
        return '';
      });
      mockCore.getBooleanInput.mockImplementation((name: string) => name === 'skipCertificateCheck');
      
      mockIsRepoRootUrl.mockReturnValue(false);
      mockReadContent.mockResolvedValue('## [1.0.0] - 2024-01-01\n\n- Initial release');
      mockParseChangelog.mockReturnValue({
        entries: [
          {
            version: '1.0.0',
            date: '2024-01-01',
            status: 'released',
            changes: '- Initial release',
          },
        ],
      });

      await run();

      expect(mockReadContent).toHaveBeenCalledWith(
        'https://example.com/CHANGELOG.md',
        undefined,
        true
      );
    });
  });
});

