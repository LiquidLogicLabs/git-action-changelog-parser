# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial implementation of changelog parser action
- Support for reading changelogs from local file paths
- Support for reading changelogs from remote URLs (GitHub, GitLab, Bitbucket, Gitea, and any HTTP server)
- Automatic blob-to-raw URL conversion for GitHub, GitLab, Bitbucket, and Gitea (both cloud and self-hosted)
- Optional authentication token support for remote URLs
- Keep a Changelog format parsing
- Version extraction and validation
- Configuration file support

