"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_handler_1 = require("./path-handler");
describe('isRepoRootUrl', () => {
    describe('GitHub URLs', () => {
        it('should return true for GitHub cloud repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://github.com/owner/repo')).toBe(true);
            expect((0, path_handler_1.isRepoRootUrl)('https://github.com/owner/repo/')).toBe(true);
        });
        it('should return true for GitHub Enterprise repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://github.example.com/owner/repo')).toBe(true);
            expect((0, path_handler_1.isRepoRootUrl)('https://github.example.com/owner/repo/')).toBe(true);
        });
        it('should return false for GitHub blob URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://github.com/owner/repo/blob/main/CHANGELOG.md')).toBe(false);
            expect((0, path_handler_1.isRepoRootUrl)('https://github.com/owner/repo/blob/main/README.md')).toBe(false);
        });
        it('should return false for GitHub raw URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md')).toBe(false);
        });
    });
    describe('GitLab URLs', () => {
        it('should return true for GitLab cloud repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://gitlab.com/owner/repo')).toBe(true);
            expect((0, path_handler_1.isRepoRootUrl)('https://gitlab.com/owner/repo/')).toBe(true);
        });
        it('should return true for GitLab Enterprise repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://gitlab.example.com/owner/repo')).toBe(true);
            expect((0, path_handler_1.isRepoRootUrl)('https://gitlab.example.com/owner/repo/')).toBe(true);
        });
        it('should return false for GitLab blob URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://gitlab.com/owner/repo/-/blob/main/CHANGELOG.md')).toBe(false);
        });
        it('should return false for GitLab raw URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://gitlab.com/owner/repo/-/raw/main/CHANGELOG.md')).toBe(false);
        });
    });
    describe('Bitbucket URLs', () => {
        it('should return true for Bitbucket repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://bitbucket.org/owner/repo')).toBe(true);
            expect((0, path_handler_1.isRepoRootUrl)('https://bitbucket.org/owner/repo/')).toBe(true);
        });
        it('should return true for Bitbucket Server repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://bitbucket.example.com/owner/repo')).toBe(true);
        });
        it('should return false for Bitbucket src URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://bitbucket.org/owner/repo/src/main/CHANGELOG.md')).toBe(false);
        });
    });
    describe('Gitea URLs', () => {
        it('should return true for Gitea cloud repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://gitea.com/owner/repo')).toBe(true);
            expect((0, path_handler_1.isRepoRootUrl)('https://gitea.com/owner/repo/')).toBe(true);
        });
        it('should return true for Gitea self-hosted repo root URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://gitea.example.com/owner/repo')).toBe(true);
        });
        it('should return false for Gitea src URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://gitea.com/owner/repo/src/branch/main/CHANGELOG.md')).toBe(false);
        });
    });
    describe('Edge cases', () => {
        it('should return false for file paths', () => {
            expect((0, path_handler_1.isRepoRootUrl)('./CHANGELOG.md')).toBe(false);
            expect((0, path_handler_1.isRepoRootUrl)('/path/to/CHANGELOG.md')).toBe(false);
        });
        it('should return false for URLs with file extensions', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://github.com/owner/repo.md')).toBe(false);
            expect((0, path_handler_1.isRepoRootUrl)('https://github.com/owner/repo.txt')).toBe(false);
        });
        it('should return false for non-HTTP URLs', () => {
            expect((0, path_handler_1.isRepoRootUrl)('git@github.com:owner/repo.git')).toBe(false);
        });
        it('should return false for URLs with too many path segments', () => {
            expect((0, path_handler_1.isRepoRootUrl)('https://github.com/owner/repo/subdir')).toBe(false);
        });
    });
});
describe('detectRepoType', () => {
    describe('Explicit repo type', () => {
        it('should return explicit github type', () => {
            expect((0, path_handler_1.detectRepoType)('https://git.example.com/owner/repo', 'github')).toBe('github');
        });
        it('should return explicit gitea type', () => {
            expect((0, path_handler_1.detectRepoType)('https://git.example.com/owner/repo', 'gitea')).toBe('gitea');
        });
        it('should return explicit gitlab type', () => {
            expect((0, path_handler_1.detectRepoType)('https://git.example.com/owner/repo', 'gitlab')).toBe('gitlab');
        });
        it('should return explicit bitbucket type', () => {
            expect((0, path_handler_1.detectRepoType)('https://git.example.com/owner/repo', 'bitbucket')).toBe('bitbucket');
        });
    });
    describe('Auto-detection', () => {
        it('should detect github.com as github', () => {
            expect((0, path_handler_1.detectRepoType)('https://github.com/owner/repo', 'auto')).toBe('github');
        });
        it('should detect github enterprise as github', () => {
            expect((0, path_handler_1.detectRepoType)('https://github.example.com/owner/repo', 'auto')).toBe('github');
        });
        it('should detect gitlab.com as gitlab', () => {
            expect((0, path_handler_1.detectRepoType)('https://gitlab.com/owner/repo', 'auto')).toBe('gitlab');
        });
        it('should detect gitlab enterprise as gitlab', () => {
            expect((0, path_handler_1.detectRepoType)('https://gitlab.example.com/owner/repo', 'auto')).toBe('gitlab');
        });
        it('should detect bitbucket.org as bitbucket', () => {
            expect((0, path_handler_1.detectRepoType)('https://bitbucket.org/owner/repo', 'auto')).toBe('bitbucket');
        });
        it('should detect bitbucket server as bitbucket', () => {
            expect((0, path_handler_1.detectRepoType)('https://bitbucket.example.com/owner/repo', 'auto')).toBe('bitbucket');
        });
        it('should detect gitea.com as gitea', () => {
            expect((0, path_handler_1.detectRepoType)('https://gitea.com/owner/repo', 'auto')).toBe('gitea');
        });
        it('should detect gitea self-hosted as gitea', () => {
            expect((0, path_handler_1.detectRepoType)('https://gitea.example.com/owner/repo', 'auto')).toBe('gitea');
        });
        it('should default to gitea for unknown domains', () => {
            expect((0, path_handler_1.detectRepoType)('https://git.ravenwolf.org/owner/repo', 'auto')).toBe('gitea');
        });
        it('should default to gitea for invalid URLs', () => {
            expect((0, path_handler_1.detectRepoType)('not-a-url', 'auto')).toBe('gitea');
        });
    });
    describe('constructChangelogUrl with .git suffix', () => {
        it('should strip .git suffix from GitHub URL', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://github.com/owner/repo.git', 'main', 'github');
            expect(result).toBe('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
        });
        it('should strip .git suffix from Gitea URL', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://git.ravenwolf.org/github/traefik.git', 'v3.6.5', 'gitea');
            expect(result).toBe('https://git.ravenwolf.org/github/traefik/raw/branch/v3.6.5/CHANGELOG.md');
        });
        it('should strip .git suffix from custom Gitea domain', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://git.example.com/owner/repo.git', 'main', 'gitea');
            expect(result).toBe('https://git.example.com/owner/repo/raw/branch/main/CHANGELOG.md');
        });
    });
});
describe('constructChangelogUrl', () => {
    describe('GitHub URLs', () => {
        it('should construct GitHub cloud URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://github.com/owner/repo', 'main');
            expect(result).toBe('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
        });
        it('should construct GitHub cloud URL with different ref', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://github.com/owner/repo', 'develop');
            expect(result).toBe('https://raw.githubusercontent.com/owner/repo/develop/CHANGELOG.md');
        });
        it('should construct GitHub Enterprise URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://github.example.com/owner/repo', 'main');
            expect(result).toBe('https://github.example.com/owner/repo/raw/main/CHANGELOG.md');
        });
        it('should handle trailing slash in repo URL', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://github.com/owner/repo/', 'main');
            expect(result).toBe('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
        });
    });
    describe('GitLab URLs', () => {
        it('should construct GitLab cloud URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://gitlab.com/owner/repo', 'main');
            expect(result).toBe('https://gitlab.com/owner/repo/-/raw/main/CHANGELOG.md');
        });
        it('should construct GitLab Enterprise URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://gitlab.example.com/owner/repo', 'main');
            expect(result).toBe('https://gitlab.example.com/owner/repo/-/raw/main/CHANGELOG.md');
        });
        it('should construct GitLab URL with master branch', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://gitlab.com/owner/repo', 'master');
            expect(result).toBe('https://gitlab.com/owner/repo/-/raw/master/CHANGELOG.md');
        });
    });
    describe('Bitbucket URLs', () => {
        it('should construct Bitbucket URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://bitbucket.org/owner/repo', 'main');
            expect(result).toBe('https://bitbucket.org/owner/repo/raw/main/CHANGELOG.md');
        });
        it('should construct Bitbucket Server URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://bitbucket.example.com/owner/repo', 'main');
            expect(result).toBe('https://bitbucket.example.com/owner/repo/raw/main/CHANGELOG.md');
        });
    });
    describe('Gitea URLs', () => {
        it('should construct Gitea cloud URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://gitea.com/owner/repo', 'main');
            expect(result).toBe('https://gitea.com/owner/repo/raw/branch/main/CHANGELOG.md');
        });
        it('should construct Gitea self-hosted URL correctly', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://gitea.example.com/owner/repo', 'main');
            expect(result).toBe('https://gitea.example.com/owner/repo/raw/branch/main/CHANGELOG.md');
        });
        it('should construct Gitea URL with develop branch', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://gitea.com/owner/repo', 'develop');
            expect(result).toBe('https://gitea.com/owner/repo/raw/branch/develop/CHANGELOG.md');
        });
    });
    describe('Error handling', () => {
        it('should throw error for invalid repository URL format', () => {
            expect(() => {
                (0, path_handler_1.constructChangelogUrl)('not-a-url', 'main');
            }).toThrow('Invalid repository URL format');
        });
        it('should throw error for URL with too many segments', () => {
            expect(() => {
                (0, path_handler_1.constructChangelogUrl)('https://github.com/owner/repo/subdir', 'main');
            }).toThrow('Invalid repository URL format');
        });
    });
    describe('Explicit repo_type parameter', () => {
        it('should use explicit gitea type for custom domain', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://git.ravenwolf.org/owner/repo', 'main', 'gitea');
            expect(result).toBe('https://git.ravenwolf.org/owner/repo/raw/branch/main/CHANGELOG.md');
        });
        it('should use explicit github type for custom domain', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://git.example.com/owner/repo', 'main', 'github');
            expect(result).toBe('https://git.example.com/owner/repo/raw/main/CHANGELOG.md');
        });
        it('should use explicit gitlab type for custom domain', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://git.example.com/owner/repo', 'main', 'gitlab');
            expect(result).toBe('https://git.example.com/owner/repo/-/raw/main/CHANGELOG.md');
        });
        it('should use explicit bitbucket type for custom domain', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://git.example.com/owner/repo', 'main', 'bitbucket');
            expect(result).toBe('https://git.example.com/owner/repo/raw/main/CHANGELOG.md');
        });
        it('should use auto detection when repo_type is auto', () => {
            const result = (0, path_handler_1.constructChangelogUrl)('https://github.com/owner/repo', 'main', 'auto');
            expect(result).toBe('https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md');
        });
    });
});
//# sourceMappingURL=path-handler.test.js.map