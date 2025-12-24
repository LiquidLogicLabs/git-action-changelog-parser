"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const path_handler_1 = require("./path-handler");
const parser_1 = require("./parser");
const index_1 = require("./index");
// Mock dependencies
jest.mock('@actions/core');
jest.mock('./path-handler');
jest.mock('./parser');
const mockCore = core;
const mockReadContent = path_handler_1.readContent;
const mockIsRepoRootUrl = path_handler_1.isRepoRootUrl;
const mockConstructChangelogUrl = path_handler_1.constructChangelogUrl;
const mockParseChangelog = parser_1.parseChangelog;
const mockFindVersionEntry = parser_1.findVersionEntry;
const mockFindConfigFile = parser_1.findConfigFile;
const mockLoadConfig = parser_1.loadConfig;
describe('Changelog Parser Action', () => {
    const originalEnv = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        // No need to reset modules since we're calling run() directly now
        // Clear GITHUB_TOKEN from environment for tests
        delete process.env.GITHUB_TOKEN;
        // Set default mock implementations
        mockCore.getInput.mockImplementation((name) => {
            const defaults = {
                path: '',
                repo_url: '',
                ref: 'main',
                token: '',
                version: '',
                validation_level: 'none',
                validation_depth: '10',
                config_file: '',
            };
            return defaults[name] || '';
        });
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
    describe('repo_url handling', () => {
        it('should construct CHANGELOG.md URL when path is blank and repo_url is provided', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'repo_url')
                    return 'https://github.com/owner/repo';
                if (name === 'ref')
                    return 'main';
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'main', 'auto');
            expect(mockReadContent).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md', undefined);
        });
        it('should use provided ref when constructing URL from repo_url', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'repo_url')
                    return 'https://github.com/owner/repo';
                if (name === 'ref')
                    return 'develop';
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'develop', 'auto');
        });
        it('should default to main when ref is not provided', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'repo_url')
                    return 'https://github.com/owner/repo';
                if (name === 'ref')
                    return '';
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'main', 'auto');
        });
    });
    describe('repo root URL detection in path', () => {
        it('should detect repo root URL in path and construct CHANGELOG.md URL', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'path')
                    return 'https://github.com/owner/repo';
                if (name === 'ref')
                    return 'main';
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockIsRepoRootUrl).toHaveBeenCalledWith('https://github.com/owner/repo');
            expect(mockConstructChangelogUrl).toHaveBeenCalledWith('https://github.com/owner/repo', 'main', 'auto');
        });
        it('should not detect repo root if path is a file URL', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'path')
                    return 'https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md';
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockIsRepoRootUrl).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
            expect(mockConstructChangelogUrl).not.toHaveBeenCalled();
            expect(mockReadContent).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md', undefined);
        });
    });
    describe('404 error handling', () => {
        it('should set status to nofound when CHANGELOG.md is not found', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'repo_url')
                    return 'https://github.com/owner/repo';
                if (name === 'ref')
                    return 'main';
                return '';
            });
            mockConstructChangelogUrl.mockReturnValue('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
            mockReadContent.mockRejectedValue(new Error('Failed to fetch https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md: 404 Not Found'));
            await (0, index_1.run)();
            expect(mockCore.setOutput).toHaveBeenCalledWith('version', '');
            expect(mockCore.setOutput).toHaveBeenCalledWith('date', '');
            expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'nofound');
            expect(mockCore.setOutput).toHaveBeenCalledWith('changes', '');
            expect(mockCore.setFailed).not.toHaveBeenCalled();
        });
        it('should handle 404 error with "not found" message', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'path')
                    return './CHANGELOG.md';
                return '';
            });
            mockIsRepoRootUrl.mockReturnValue(false);
            mockReadContent.mockRejectedValue(new Error('Error reading file ./CHANGELOG.md: not found'));
            await (0, index_1.run)();
            expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'nofound');
            expect(mockCore.setFailed).not.toHaveBeenCalled();
        });
        it('should re-throw non-404 errors', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'path')
                    return './CHANGELOG.md';
                return '';
            });
            mockIsRepoRootUrl.mockReturnValue(false);
            mockReadContent.mockRejectedValue(new Error('Network error'));
            await (0, index_1.run)();
            expect(mockCore.setFailed).toHaveBeenCalledWith('Network error');
        });
    });
    describe('backward compatibility', () => {
        it('should work with local file paths', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'path')
                    return './CHANGELOG.md';
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockReadContent).toHaveBeenCalledWith('./CHANGELOG.md', undefined);
            expect(mockConstructChangelogUrl).not.toHaveBeenCalled();
        });
        it('should work with remote file URLs', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'path')
                    return 'https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md';
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockReadContent).toHaveBeenCalledWith('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md', undefined);
            expect(mockConstructChangelogUrl).not.toHaveBeenCalled();
        });
        it('should default to ./CHANGELOG.md when path is not provided', async () => {
            mockCore.getInput.mockImplementation((name) => {
                if (name === 'version')
                    return '1.0.0';
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
            await (0, index_1.run)();
            expect(mockReadContent).toHaveBeenCalledWith('./CHANGELOG.md', undefined);
        });
    });
});
//# sourceMappingURL=index.test.js.map