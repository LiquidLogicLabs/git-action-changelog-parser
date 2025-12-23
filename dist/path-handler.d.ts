/**
 * Converts blob URLs to raw URLs for various git platforms
 */
export declare function convertBlobToRaw(url: string): string;
/**
 * Detects if a path is a URL
 */
export declare function isUrl(pathOrUrl: string): boolean;
/**
 * Reads content from a local file or remote URL
 */
export declare function readContent(pathOrUrl: string, token?: string): Promise<string>;
