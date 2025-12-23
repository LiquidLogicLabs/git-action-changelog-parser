/**
 * Converts blob URLs to raw URLs for various git platforms
 */
export declare function convertBlobToRaw(url: string): string;
/**
 * Detects if a path is a URL
 */
export declare function isUrl(pathOrUrl: string): boolean;
/**
 * Detects if a URL is a repository root (not a file path)
 */
export declare function isRepoRootUrl(url: string): boolean;
/**
 * Constructs CHANGELOG.md URL from repository URL and ref
 */
export declare function constructChangelogUrl(repoUrl: string, ref: string): string;
/**
 * Reads content from a local file or remote URL
 */
export declare function readContent(pathOrUrl: string, token?: string): Promise<string>;
