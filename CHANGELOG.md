# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

