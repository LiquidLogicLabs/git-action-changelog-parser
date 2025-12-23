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
exports.convertBlobToRaw = convertBlobToRaw;
exports.isUrl = isUrl;
exports.readContent = readContent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Converts blob URLs to raw URLs for various git platforms
 */
function convertBlobToRaw(url) {
    // GitHub cloud: github.com/owner/repo/blob/ref/path -> raw.githubusercontent.com/owner/repo/ref/path
    const githubBlobMatch = url.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
    if (githubBlobMatch) {
        const [, domain, owner, repo, rest] = githubBlobMatch;
        if (domain === 'github.com') {
            // GitHub cloud uses different domain
            return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
        }
        else {
            // GitHub Enterprise uses same domain, just replace /blob/ with /raw/
            return url.replace('/blob/', '/raw/');
        }
    }
    // GitLab: gitlab.com/owner/repo/-/blob/ref/path -> gitlab.com/owner/repo/-/raw/ref/path
    if (url.includes('/-/blob/')) {
        return url.replace('/-/blob/', '/-/raw/');
    }
    // Gitea: gitea.com/owner/repo/src/branch/ref/path -> gitea.com/owner/repo/raw/branch/ref/path
    if (url.includes('/src/branch/')) {
        return url.replace('/src/branch/', '/raw/branch/');
    }
    // Bitbucket: bitbucket.org/owner/repo/src/ref/path -> bitbucket.org/owner/repo/raw/ref/path
    if (url.includes('/src/') && !url.includes('/src/branch/')) {
        // Only replace /src/ if it's not part of /src/branch/ (Gitea pattern)
        return url.replace('/src/', '/raw/');
    }
    // If no conversion needed, return as-is
    return url;
}
/**
 * Detects if a path is a URL
 */
function isUrl(pathOrUrl) {
    return pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://');
}
/**
 * Reads content from a local file or remote URL
 */
async function readContent(pathOrUrl, token) {
    if (isUrl(pathOrUrl)) {
        return await fetchRemoteUrl(pathOrUrl, token);
    }
    else {
        return await readLocalFile(pathOrUrl);
    }
}
/**
 * Fetches content from a remote URL
 */
async function fetchRemoteUrl(url, token) {
    // Convert blob URLs to raw URLs
    const rawUrl = convertBlobToRaw(url);
    const headers = {};
    if (token) {
        // Try Bearer token first (most common), fallback to token format
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const response = await fetch(rawUrl, {
            headers,
            redirect: 'follow',
        });
        if (!response.ok) {
            // If Bearer token failed, try token format (for GitHub)
            if (response.status === 401 && token && headers['Authorization']?.startsWith('Bearer ')) {
                headers['Authorization'] = `token ${token}`;
                const retryResponse = await fetch(rawUrl, {
                    headers,
                    redirect: 'follow',
                });
                if (!retryResponse.ok) {
                    throw new Error(`Failed to fetch ${rawUrl}: ${retryResponse.status} ${retryResponse.statusText}`);
                }
                return await retryResponse.text();
            }
            throw new Error(`Failed to fetch ${rawUrl}: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching ${rawUrl}: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Reads content from a local file
 */
async function readLocalFile(filePath) {
    try {
        // Resolve relative paths
        const resolvedPath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);
        return await fs.promises.readFile(resolvedPath, 'utf-8');
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error reading file ${filePath}: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=path-handler.js.map