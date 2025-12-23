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
- ✅ Optional authentication token support for remote URLs
- ✅ Keep a Changelog format parsing
- ✅ Version extraction and validation
- ✅ Configuration file support
- ✅ No GitHub API dependencies (uses standard HTTP only)

## Usage

### Basic Example

```yaml
- name: Read Changelog
  uses: LiquidLogicLabs/changelog-parser-action@v1.0.0
  id: changelog
  with:
    path: ./CHANGELOG.md
    version: '1.2.3'
```

### Remote URL Example

```yaml
- name: Read Changelog from Remote URL
  uses: LiquidLogicLabs/changelog-parser-action@v1.0.0
  id: changelog
  with:
    path: 'https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md'
    version: '1.2.3'
    token: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Blob URL (Auto-converted)

```yaml
- name: Read Changelog from GitHub Blob URL
  uses: LiquidLogicLabs/changelog-parser-action@v1.0.0
  id: changelog
  with:
    path: 'https://github.com/owner/repo/blob/main/CHANGELOG.md'
    version: '1.2.3'
```

### GitLab Example

```yaml
- name: Read Changelog from GitLab
  uses: LiquidLogicLabs/changelog-parser-action@v1.0.0
  id: changelog
  with:
    path: 'https://gitlab.com/owner/repo/-/raw/main/CHANGELOG.md'
    version: '1.2.3'
```

### Gitea Example (Self-hosted)

```yaml
- name: Read Changelog from Gitea
  uses: LiquidLogicLabs/changelog-parser-action@v1.0.0
  id: changelog
  with:
    path: 'https://your-gitea.com/owner/repo/src/branch/main/CHANGELOG.md'
    version: '1.2.3'
    token: ${{ secrets.GITEA_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `path` | Path to changelog file or URL | No | `./CHANGELOG.md` |
| `token` | Authentication token for remote URLs | No | `${{ github.token }}` |
| `version` | Version to retrieve (or "Unreleased") | No | Latest version |
| `validation_level` | Validation level: `none`, `warn`, or `error` | No | `none` |
| `validation_depth` | Number of entries to validate | No | `10` |
| `config_file` | Path to configuration file | No | Auto-detect |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Version number found (e.g., `2.0.0`) |
| `date` | Release date (e.g., `2020-08-22`) |
| `status` | Status: `prereleased`, `released`, `unreleased`, or `yanked` |
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
  "validation_level": "warn",
  "validation_depth": 10
}
```

Action inputs take precedence over configuration file values.

## Validation

The action can validate changelog entries for:
- Semantic versioning format
- Date format (YYYY-MM-DD)
- Empty entries

Set `validation_level` to:
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
        id: tag_name
        run: |
          echo "current_version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Get Changelog Entry
        id: changelog_reader
        uses: LiquidLogicLabs/changelog-parser-action@v1.0.0
        with:
          validation_level: warn
          version: ${{ steps.tag_name.outputs.current_version }}
          path: ./CHANGELOG.md

      - name: Create Release
        uses: ncipollo/release-action@v1
        with:
          tag: ${{ steps.changelog_reader.outputs.version }}
          name: Release ${{ steps.changelog_reader.outputs.version }}
          body: ${{ steps.changelog_reader.outputs.changes }}
          prerelease: ${{ steps.changelog_reader.outputs.status == 'prereleased' }}
          draft: ${{ steps.changelog_reader.outputs.status == 'unreleased' }}
          allowUpdates: true
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Security

- Tokens are automatically masked in logs
- Only used when fetching remote URLs that require authentication
- No GitHub API dependencies - uses standard HTTP only
- Works with any HTTP server, not just GitHub

## License

MIT

## Acknowledgments

- Based on [changelog-reader-action](https://github.com/mindsers/changelog-reader-action) by [mindsers](https://github.com/mindsers)
- Follows the [Keep a Changelog](https://keepachangelog.com/) standard

