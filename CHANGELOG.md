# [2.1.0](https://github.com/LiquidLogicLabs/git-action-changelog-parser/compare/v2.0.1...v2.1.0) (2026-02-19)


### Features

* add changes-escaped output and output-file input for safe downstream use ([21de2b6](https://github.com/LiquidLogicLabs/git-action-changelog-parser/commit/21de2b66aad37d11f469833e53400e5e2bf64009))



# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.0](https://github.com/LiquidLogicLabs/git-action-changelog-parser/compare/v1.1.0...v2.0.0) (2026-02-09)

## [1.1.0](https://github.com/LiquidLogicLabs/git-action-changelog-parser/compare/v1.0.12...v1.1.0) (2026-02-07)


### Bug Fixes

* align changelog parser inputs ([f4a5b4d](https://github.com/LiquidLogicLabs/git-action-changelog-parser/commit/f4a5b4df4270f272bcd7fce80b5db9d49a5f93bd))

### [1.0.12](https://github.com/LiquidLogicLabs/git-action-changelog-parser/compare/v1.0.11...v1.0.12) (2026-01-30)

### [1.0.11](https://github.com/LiquidLogicLabs/git-action-changelog-parser/compare/v1.0.10...v1.0.11) (2026-01-30)

### [1.0.10](https://github.com/LiquidLogicLabs/git-action-changelog-parser/compare/v1.0.9...v1.0.10) (2026-01-30)


### Bug Fixes

* **release:** verify only runtime bundle; e2e from committed dist ([a1c93ac](https://github.com/LiquidLogicLabs/git-action-changelog-parser/commit/a1c93accdfb7dd5cb80af449f7ec31b1ac54d450))

## [1.0.6] - 2025-12-24

### Added
- `debug` input parameter to enable verbose logging for troubleshooting
- Detailed debug logging for input values, config loading, URL construction, and HTTP requests
- Debug logging respects `ACTIONS_STEP_DEBUG` environment variable
- Helps troubleshoot issues with URL construction and repository type detection
- `ignore_cert_errors` input parameter to ignore SSL certificate errors for self-hosted instances with self-signed certificates

## [1.0.5] - 2025-12-24

### Fixed
- Fixed `repo_url` to take precedence over default `path` value - now works correctly when `repo_url` is provided even if `path` has default value
- Added automatic `.git` suffix stripping from repository URLs (e.g., `https://git.ravenwolf.org/owner/repo.git` now works correctly)

## [1.0.4] - 2025-12-24

### Added
- `repo_type` input parameter to explicitly specify repository platform type (auto, github, gitea, gitlab, bitbucket)
- `detectRepoType` function for efficient repository type detection
- Support for custom Gitea domains (e.g., git.ravenwolf.org) via auto-detection or explicit `repo_type: gitea`

### Fixed
- Fixed URL construction for Gitea instances with custom domains that don't contain "gitea" in the domain name
- Improved fallback logic in `fetchRemoteUrl` to try alternative URL formats on 404 errors

### Changed
- Refactored `constructChangelogUrl` to use `detectRepoType` for cleaner, more maintainable code
- Default behavior for unknown domains now uses Gitea format (many self-hosted Gitea instances use custom domains)

## [1.0.1] - 2025-12-23

### Added
- `repo_url` input to specify repository URL and automatically fetch CHANGELOG.md from repository root
- `ref` input to specify branch/ref when using `repo_url` or repository root URL in `path` (defaults to `main`)
- Automatic detection of repository root URLs in `path` input
- Graceful handling of missing CHANGELOG.md files (returns `status: "nofound"` instead of failing)

### Changed
- Enhanced error handling to return `nofound` status when CHANGELOG.md is not found at the specified location

## [1.0.0] - 2025-12-23

### Added
- Initial implementation of changelog parser action
- Support for reading changelogs from local file paths
- Support for reading changelogs from remote URLs (GitHub, GitLab, Bitbucket, Gitea, and any HTTP server)
- Automatic blob-to-raw URL conversion for GitHub, GitLab, Bitbucket, and Gitea (both cloud and self-hosted)
- Optional authentication token support for remote URLs
- Keep a Changelog format parsing
- Version extraction and validation
- Configuration file support
- CI/CD workflows for testing and releases
