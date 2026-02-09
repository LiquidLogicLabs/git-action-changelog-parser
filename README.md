# Changelog Parser Action

[![CI](https://github.com/LiquidLogicLabs/changelog-parser-action/actions/workflows/ci.yml/badge.svg)](https://github.com/LiquidLogicLabs/changelog-parser-action/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A GitHub Action that reads and parses `CHANGELOG.md` files from local paths or remote URLs, following the [Keep a Changelog](https://keepachangelog.com/) standard.

## Credits

This action is inspired by and extends the functionality of [changelog-reader-action](https://github.com/mindsers/changelog-reader-action) by [mindsers](https://github.com/mindsers). We've added support for remote URLs and enhanced URL handling capabilities while maintaining compatibility with the original action's API.

## Features

- ✅ Read changelogs from local file paths
- ✅ Read changelogs from remote URLs (GitHub, GitLab, Bitbucket, Gitea, and any HTTP server)
- ✅ Automatic blob-to-raw URL conversion for GitHub, GitLab, Bitbucket, and Gitea (both cloud and self-hosted)
- ✅ Automatic CHANGELOG.md detection from repository root URLs (via `repo-url` input or detecting repo root in `path`)
- ✅ Graceful handling of missing CHANGELOG.md files (returns `nofound` status instead of failing)
- ✅ Optional authentication token support for remote URLs
- ✅ Keep a Changelog format parsing
- ✅ Version extraction and validation
- ✅ Configuration file support
- ✅ No GitHub API dependencies (uses standard HTTP only)

## Usage

### Basic Example

```yaml
- name: Read Changelog
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    path: ./CHANGELOG.md
    version: '1.2.3'
```

### Remote URL Example

```yaml
- name: Read Changelog from Remote URL
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    path: 'https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md'
    version: '1.2.3'
    token: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Blob URL (Auto-converted)

```yaml
- name: Read Changelog from GitHub Blob URL
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    path: 'https://github.com/owner/repo/blob/main/CHANGELOG.md'
    version: '1.2.3'
```

### GitLab Example

```yaml
- name: Read Changelog from GitLab
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    path: 'https://gitlab.com/owner/repo/-/raw/main/CHANGELOG.md'
    version: '1.2.3'
```

### Gitea Example (Self-hosted)

```yaml
- name: Read Changelog from Gitea
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    path: 'https://your-gitea.com/owner/repo/src/branch/main/CHANGELOG.md'
    version: '1.2.3'
    token: ${{ secrets.GITEA_TOKEN }}
```

### Gitea Example with Custom Domain

For Gitea instances with custom domains (e.g., `git.ravenwolf.org`), you can explicitly specify the repository type:

```yaml
- name: Read Changelog from Custom Gitea Domain
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    repo-url: 'https://git.ravenwolf.org/owner/repo'
    repo-type: 'gitea'  # Explicitly specify Gitea for custom domains
    ref: 'main'
    version: '1.2.3'
    token: ${{ secrets.GITEA_TOKEN }}
```

### Repository URL Example (Auto-detect CHANGELOG.md)

You can provide a repository URL and the action will automatically fetch `CHANGELOG.md` from the repository root:

```yaml
- name: Read Changelog from Repository URL
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    repo-url: 'https://github.com/owner/repo'
    ref: 'main'
    version: '1.2.3'
```

### Repository Root URL in Path

Alternatively, you can pass the repository root URL directly as the `path` input (leave `path` blank or omit it):

```yaml
- name: Read Changelog from Repo Root URL
  uses: LiquidLogicLabs/changelog-parser-action@v1
  id: changelog
  with:
    path: 'https://github.com/owner/repo'
    ref: 'main'
    version: '1.2.3'
```

Both approaches work the same way - the action will automatically detect that it's a repository root URL and construct the appropriate `CHANGELOG.md` URL.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `path` | Path to changelog file or URL. Can also be a repository root URL (e.g., `https://github.com/owner/repo`) | No | `./CHANGELOG.md` |
| `repo-url` | Repository URL (e.g., `https://github.com/owner/repo`). When `path` is blank, CHANGELOG.md will be fetched from the root of this repository | No | - |
| `ref` | Branch or ref to use when constructing CHANGELOG.md URL from `repo-url` or repository root URL in `path` | No | `main` |
| `repo-type` | Repository platform type: `auto`, `github`, `gitea`, `gitlab`, or `bitbucket`. Use explicit type for custom domains (e.g., `git.ravenwolf.org`). Defaults to `auto` which attempts to detect from domain | No | `auto` |
| `token` | Authentication token for remote URLs | No | `${{ github.token }}` |
| `version` | Version to retrieve (or "Unreleased") | No | Latest version |
| `validation-level` | Validation level: `none`, `warn`, or `error` | No | `none` |
| `validation-depth` | Number of entries to validate | No | `10` |
| `config-file` | Path to configuration file | No | Auto-detect |
| `verbose` | Enable debug logging for troubleshooting. Set to `true` to see detailed information about URL construction, repository type detection, and HTTP requests. Also respects `ACTIONS_STEP_DEBUG` environment variable | No | `false` |
| `skip-certificate-check` | Ignore SSL certificate errors (useful for self-hosted instances with self-signed certificates). **WARNING**: This is a security risk and should only be used with trusted self-hosted instances | No | `false` |

## Permissions

No special permissions are required. Typical workflows need `contents: read` for checkout.

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Version number found (e.g., `2.0.0`) |
| `date` | Release date (e.g., `2020-08-22`) |
| `status` | Status: `prereleased`, `released`, `unreleased`, `yanked`, or `nofound` (when CHANGELOG.md is not found) |
| `changes` | Changelog entry content |

## Supported URL Formats

### GitHub
- **Cloud**: `https://raw.githubusercontent.com/owner/repo/branch/CHANGELOG.md`
- **Blob (auto-converted)**: `https://github.com/owner/repo/blob/branch/CHANGELOG.md`
- **Enterprise**: `https://your-github.com/owner/repo/blob/branch/CHANGELOG.md`

### GitLab
- **Raw**: `https://gitlab.com/owner/repo/-/raw/branch/CHANGELOG.md`
- **Blob (auto-converted)**: `https://gitlab.com/owner/repo/-/blob/branch/CHANGELOG.md`
- **Self-hosted**: `https://your-gitlab.com/owner/repo/-/blob/branch/CHANGELOG.md`

### Bitbucket
- **Raw**: `https://bitbucket.org/owner/repo/raw/branch/CHANGELOG.md`
- **Blob (auto-converted)**: `https://bitbucket.org/owner/repo/src/branch/CHANGELOG.md`
- **Server/Data Center**: `https://your-bitbucket.com/owner/repo/src/branch/CHANGELOG.md`

### Gitea
- **Raw**: `https://gitea.com/owner/repo/raw/branch/CHANGELOG.md`
- **Blob (auto-converted)**: `https://gitea.com/owner/repo/src/branch/CHANGELOG.md`
- **Self-hosted**: `https://your-gitea.com/owner/repo/src/branch/CHANGELOG.md`
- **Custom domain**: For Gitea instances with custom domains (e.g., `git.ravenwolf.org`), use `repo-type: 'gitea'` to ensure correct URL format

### Any HTTP Server
- `https://example.com/path/to/CHANGELOG.md`

## Configuration File

You can use a configuration file instead of specifying options in your workflow. The action will automatically look for:

1. `.changelog-reader.json`
2. `.changelog-reader.yml`
3. `.changelog-reader.yaml`
4. `.changelogrc`
5. `.changelogrc.json`

**Example `.changelog-reader.json`:**

```json
{
  "path": "./CHANGELOG.md",
  "repo-url": "https://github.com/owner/repo",
  "ref": "main",
  "repo-type": "auto",
  "validation-level": "warn",
  "validation-depth": 10
}
```

Action inputs take precedence over configuration file values.

## Validation

The action can validate changelog entries for:
- Semantic versioning format
- Date format (YYYY-MM-DD)
- Empty entries

Set `validation-level` to:
- `none`: No validation (default)
- `warn`: Print warnings but don't fail
- `error`: Fail the action if validation errors are found

## Example Workflow

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Get version from tag
        id: tagName
        run: |
          echo "current_version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Get Changelog Entry
        id: changelog_reader
        uses: LiquidLogicLabs/changelog-parser-action@v1
        with:
          validation-level: 'warn'
          version: ${{ steps.tagName.outputs.current_version }}
          path: ./CHANGELOG.md

      - name: Create Release
        uses: LiquidLogicLabs/git-action-release@v1
        with:
          tag: ${{ steps.changelog_reader.outputs.version }}
          name: Release ${{ steps.changelog_reader.outputs.version }}
          body: ${{ steps.changelog_reader.outputs.changes }}
          prerelease: ${{ steps.changelog_reader.outputs.status == 'prereleased' }}
          token: ${{ secrets.GITHUB_TOKEN }}
          draft: ${{ steps.changelog_reader.outputs.status == 'unreleased' }}
          allow-updates: true
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Security

- Tokens are automatically masked in logs
- Only used when fetching remote URLs that require authentication
- No GitHub API dependencies - uses standard HTTP only
- Works with any HTTP server, not just GitHub

## Documentation

For developers and contributors:

- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, development workflow, and contributing guidelines
- **[Testing Guide](docs/TESTING.md)** - Complete testing documentation

## License

MIT

## Acknowledgments

- Based on [changelog-reader-action](https://github.com/mindsers/changelog-reader-action) by [mindsers](https://github.com/mindsers)
- Follows the [Keep a Changelog](https://keepachangelog.com/) standard

