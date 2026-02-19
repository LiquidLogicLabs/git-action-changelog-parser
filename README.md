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
- ✅ Escaped single-line output (`changes-escaped`) for safe use in `commit_message`, `tag_message`, and similar parameters
- ✅ File output support (`output-file`) for passing changelog content to actions that accept a file path

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
    repo-type: 'gitea' # Explicitly specify Gitea for custom domains
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

| Input                    | Description                                                                                                                                                                                                       | Required | Default               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------- |
| `path`                   | Path to changelog file or URL. Can also be a repository root URL (e.g., `https://github.com/owner/repo`)                                                                                                          | No       | `./CHANGELOG.md`      |
| `repo-url`               | Repository URL (e.g., `https://github.com/owner/repo`). When `path` is blank, CHANGELOG.md will be fetched from the root of this repository                                                                       | No       | -                     |
| `ref`                    | Branch or ref to use when constructing CHANGELOG.md URL from `repo-url` or repository root URL in `path`                                                                                                          | No       | `main`                |
| `repo-type`              | Repository platform type: `auto`, `github`, `gitea`, `gitlab`, or `bitbucket`. Use explicit type for custom domains (e.g., `git.ravenwolf.org`). Defaults to `auto` which attempts to detect from domain          | No       | `auto`                |
| `token`                  | Authentication token for remote URLs                                                                                                                                                                              | No       | `${{ github.token }}` |
| `version`                | Version to retrieve (or "Unreleased")                                                                                                                                                                             | No       | Latest version        |
| `validation-level`       | Validation level: `none`, `warn`, or `error`                                                                                                                                                                      | No       | `none`                |
| `validation-depth`       | Number of entries to validate                                                                                                                                                                                     | No       | `10`                  |
| `config-file`            | Path to configuration file                                                                                                                                                                                        | No       | Auto-detect           |
| `verbose`                | Enable debug logging for troubleshooting. Set to `true` to see detailed information about URL construction, repository type detection, and HTTP requests. Also respects `ACTIONS_STEP_DEBUG` environment variable | No       | `false`               |
| `skip-certificate-check` | Ignore SSL certificate errors (useful for self-hosted instances with self-signed certificates). **WARNING**: This is a security risk and should only be used with trusted self-hosted instances                   | No       | `false`               |
| `output-file`            | File path to write the changelog `changes` content to (e.g., `.release-notes.md`). Useful for passing long or special-character content to downstream actions that accept a file path instead of an inline string | No       | -                     |

## Permissions

No special permissions are required. Typical workflows need `contents: read` for checkout.

## Outputs

| Output            | Description                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`         | Version number found (e.g., `2.0.0`)                                                                                                                                      |
| `date`            | Release date (e.g., `2020-08-22`)                                                                                                                                         |
| `status`          | Status: `prereleased`, `released`, `unreleased`, `yanked`, or `nofound` (when CHANGELOG.md is not found)                                                                  |
| `changes`         | Full changelog entry content (multiline markdown)                                                                                                                         |
| `changes-escaped` | Changes with newlines replaced by the literal string `\n` and carriage returns stripped. Safe for single-line action parameters such as `commit_message` or `tag_message` |
| `changes-file`    | Absolute path of the file the changes were written to. Only set when `output-file` input is provided                                                                      |

## Handling Long or Special-Character Changelog Notes

Inline GitHub Actions expressions (`${{ steps.id.outputs.changes }}`) have several compounding limitations when used in downstream action parameters:

| Problem | Impact |
|---------|--------|
| **Newlines** | Break YAML value parsing in `with:` blocks |
| **Backticks / `$()`** | Trigger shell command substitution in composite actions that embed expressions directly in `run:` steps |
| **`${{` sequences** | May be re-evaluated as GitHub expressions in certain YAML positions |
| **Size** | GitHub Actions expression values and environment variables have OS-level size limits (~32 KB). Large changelog entries can exceed them |

There is no inline expression approach that is simultaneously safe from all of these and free of size limits. The correct solutions depend on what the downstream action accepts.

### `changes-escaped` — for short, code-free single-line parameters

`changes-escaped` replaces all newlines with the literal two-character sequence `\n`, producing a single-line value. It is appropriate for short parameters like `commit_message` where the notes are unlikely to contain backticks or exceed a few hundred characters.

> **Limitation:** `changes-escaped` does not escape backticks or `$()` sequences. If your changelog entries contain inline code examples (e.g., `` `npm install` ``), those characters may cause shell expansion issues in composite actions. For entries with code, use `output-file` instead.

```yaml
- name: Get Changelog Entry
  id: changelog
  uses: LiquidLogicLabs/changelog-parser-action@v2
  with:
    version: ${{ steps.tagName.outputs.current_version }}

# Safe only for short, code-free entries
- name: Commit changelog
  uses: stefanzweifel/git-auto-commit-action@v5
  with:
    commit_message: 'chore(release): ${{ steps.changelog.outputs.version }} ${{ steps.changelog.outputs.changes-escaped }}'
```

For `commit_message` specifically, using only the version avoids all of these issues entirely:

```yaml
commit_message: 'chore(release): ${{ steps.changelog.outputs.version }}'
```

### `output-file` — the safe approach for full notes and tag messages

`output-file` writes the raw changelog content to a file on disk before any other steps run. The content never passes through YAML expression substitution or shell expansion, so there are no size limits, no injection risks, and no escaping concerns.

**For actions that accept a file path** (releases, PR bodies):

```yaml
- name: Get Changelog Entry
  id: changelog
  uses: LiquidLogicLabs/changelog-parser-action@v2
  with:
    version: ${{ steps.tagName.outputs.current_version }}
    output-file: .release-notes.md

- name: Create Release
  uses: LiquidLogicLabs/git-action-release@v2
  with:
    tag: v${{ steps.changelog.outputs.version }}
    body_path: ${{ steps.changelog.outputs.changes-file }}
```

**For tag messages** (reading the file directly in a `run:` step avoids all inline expression issues):

```yaml
- name: Get Changelog Entry
  id: changelog
  uses: LiquidLogicLabs/changelog-parser-action@v2
  with:
    version: ${{ steps.tagName.outputs.current_version }}
    output-file: .release-notes.md

- name: Create annotated tag with full release notes
  env:
    TAG: v${{ steps.changelog.outputs.version }}
    NOTES_FILE: ${{ steps.changelog.outputs.changes-file }}
  run: |
    git tag -a "$TAG" -F "$NOTES_FILE"
    git push origin "$TAG"
```

Reading the file via `$NOTES_FILE` in a `run:` step is safe regardless of content size or special characters, because the shell reads the file from disk rather than expanding an expression value.

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
