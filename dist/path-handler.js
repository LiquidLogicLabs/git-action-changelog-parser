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
exports.isRepoRootUrl = isRepoRootUrl;
exports.detectRepoType = detectRepoType;
exports.constructChangelogUrl = constructChangelogUrl;
exports.readContent = readContent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
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
 * Detects if a URL is a repository root (not a file path)
 */
function isRepoRootUrl(url) {
    if (!isUrl(url)) {
        return false;
    }
    // Remove trailing slash
    const normalizedUrl = url.replace(/\/$/, '');
    // Check if URL contains paths that indicate it's NOT a repo root
    if (normalizedUrl.includes('/blob/') ||
        normalizedUrl.includes('/-/blob/') ||
        normalizedUrl.includes('/raw/') ||
        normalizedUrl.includes('/-/raw/') ||
        normalizedUrl.includes('/src/') ||
        normalizedUrl.match(/\.(md|txt|json|yml|yaml|js|ts|py|java|cpp|h|hpp)$/i)) {
        return false;
    }
    // Pattern: https?://[domain]/[owner]/[repo] or https?://[domain]/[owner]/[repo]/
    // Should match exactly 3 path segments after domain
    const repoRootMatch = normalizedUrl.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);
    return repoRootMatch !== null;
}
/**
 * Detects repository type from URL or returns explicit type
 * @param repoUrl The repository URL
 * @param repoType Explicit repo type or 'auto' for auto-detection
 * @returns Detected or explicit repository type
 */
function detectRepoType(repoUrl, repoType = 'auto') {
    // If explicitly set, return it
    if (repoType !== 'auto') {
        return repoType;
    }
    // Auto-detect from domain
    const normalizedUrl = repoUrl.replace(/\/$/, '');
    const urlMatch = normalizedUrl.match(/^https?:\/\/([^/]+)\//);
    if (!urlMatch) {
        // Invalid URL format - default to gitea (matches current fallback behavior)
        return 'gitea';
    }
    const domain = urlMatch[1].toLowerCase();
    if (domain === 'github.com') {
        return 'github';
    }
    else if (domain.includes('github')) {
        return 'github';
    }
    else if (domain.includes('gitlab')) {
        return 'gitlab';
    }
    else if (domain.includes('bitbucket')) {
        return 'bitbucket';
    }
    else if (domain.includes('gitea')) {
        return 'gitea';
    }
    else {
        // Unknown platform - default to gitea (many self-hosted Gitea instances use custom domains)
        return 'gitea';
    }
}
/**
 * Constructs CHANGELOG.md URL from repository URL and ref
 */
function constructChangelogUrl(repoUrl, ref, repoType = 'auto') {
    // Lazy import core for debug logging (only if ACTIONS_STEP_DEBUG is set)
    const shouldDebug = process.env.ACTIONS_STEP_DEBUG === 'true';
    const debugLog = (message) => {
        if (shouldDebug) {
            // Use console.log for debug since we can't easily import core here synchronously
            // This will show up in debug logs when ACTIONS_STEP_DEBUG is enabled
            console.log(`::debug::${message}`);
        }
    };
    debugLog(`constructChangelogUrl called with:`);
    debugLog(`  repoUrl: ${repoUrl}`);
    debugLog(`  ref: ${ref}`);
    debugLog(`  repoType: ${repoType}`);
    // Remove trailing slash and .git suffix if present
    let normalizedUrl = repoUrl.replace(/\/$/, '');
    const hadGitSuffix = normalizedUrl.endsWith('.git');
    normalizedUrl = normalizedUrl.replace(/\.git$/, '');
    if (hadGitSuffix) {
        debugLog(`  Stripped .git suffix: ${normalizedUrl}`);
    }
    // Parse the repository URL
    const urlMatch = normalizedUrl.match(/^https?:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!urlMatch) {
        throw new Error(`Invalid repository URL format: ${repoUrl}`);
    }
    const [, domain, owner, repo] = urlMatch;
    debugLog(`  Parsed URL: domain=${domain}, owner=${owner}, repo=${repo}`);
    // Detect the repository type
    const detectedType = detectRepoType(repoUrl, repoType);
    debugLog(`  Detected repository type: ${detectedType} (requested: ${repoType})`);
    // Construct URL based on detected type
    let constructedUrl;
    switch (detectedType) {
        case 'github':
            if (domain === 'github.com') {
                // GitHub cloud: use raw.githubusercontent.com
                constructedUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/CHANGELOG.md`;
            }
            else {
                // GitHub Enterprise: same domain, use /raw/ path
                constructedUrl = `https://${domain}/${owner}/${repo}/raw/${ref}/CHANGELOG.md`;
            }
            break;
        case 'gitea':
            constructedUrl = `https://${domain}/${owner}/${repo}/raw/branch/${ref}/CHANGELOG.md`;
            break;
        case 'gitlab':
            constructedUrl = `https://${domain}/${owner}/${repo}/-/raw/${ref}/CHANGELOG.md`;
            break;
        case 'bitbucket':
            constructedUrl = `https://${domain}/${owner}/${repo}/raw/${ref}/CHANGELOG.md`;
            break;
    }
    debugLog(`  Constructed URL: ${constructedUrl}`);
    return constructedUrl;
}
/**
 * Reads content from a local file or remote URL
 */
async function readContent(pathOrUrl, token, ignoreCertErrors = false) {
    if (isUrl(pathOrUrl)) {
        return await fetchRemoteUrl(pathOrUrl, token, ignoreCertErrors);
    }
    else {
        return await readLocalFile(pathOrUrl);
    }
}
/**
 * Fetches content from a remote URL
 */
async function fetchRemoteUrl(url, token, ignoreCertErrors = false) {
    const shouldDebug = process.env.ACTIONS_STEP_DEBUG === 'true';
    const debugLog = (message) => {
        if (shouldDebug) {
            console.log(`::debug::${message}`);
        }
    };
    // Convert blob URLs to raw URLs
    const rawUrl = convertBlobToRaw(url);
    if (url !== rawUrl) {
        debugLog(`Converted blob URL to raw URL: ${url} -> ${rawUrl}`);
    }
    const headers = {};
    if (token) {
        // Try Bearer token first (most common), fallback to token format
        headers['Authorization'] = `Bearer ${token}`;
        debugLog(`Using Bearer token authentication`);
    }
    else {
        debugLog(`No token provided, making unauthenticated request`);
    }
    // Create custom agent for ignoring certificate errors if needed
    let agent;
    if (ignoreCertErrors && rawUrl.startsWith('https://')) {
        agent = new https.Agent({
            rejectUnauthorized: false
        });
        debugLog(`SSL certificate validation disabled (skipCertificateCheck=true)`);
    }
    const tryFetch = async (urlToTry) => {
        // For Node.js 20, we need to use undici's fetch with a custom dispatcher
        // or use node-fetch. Let's use a workaround with https module for now.
        if (agent && urlToTry.startsWith('https://')) {
            // Use https module directly when we need to ignore cert errors
            return new Promise((resolve, reject) => {
                const urlObj = new URL(urlToTry);
                const options = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || 443,
                    path: urlObj.pathname + urlObj.search,
                    method: 'GET',
                    headers: headers,
                    agent: agent
                };
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        // Create a Response-like object
                        const response = new Response(data, {
                            status: res.statusCode || 200,
                            statusText: res.statusMessage || 'OK',
                            headers: res.headers
                        });
                        resolve(response);
                    });
                });
                req.on('error', (error) => {
                    reject(error);
                });
                req.end();
            });
        }
        else {
            // Use standard fetch for normal requests
            return await fetch(urlToTry, {
                headers,
                redirect: 'follow',
            });
        }
    };
    try {
        debugLog(`Fetching URL: ${rawUrl}`);
        let response = await tryFetch(rawUrl);
        debugLog(`Response status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            // If Bearer token failed, try token format (for GitHub)
            if (response.status === 401 && token && headers['Authorization']?.startsWith('Bearer ')) {
                debugLog(`Bearer token failed with 401, trying token format`);
                headers['Authorization'] = `token ${token}`;
                response = await tryFetch(rawUrl);
                debugLog(`Retry response status: ${response.status} ${response.statusText}`);
                if (!response.ok && response.status !== 404) {
                    throw new Error(`Failed to fetch ${rawUrl}: ${response.status} ${response.statusText}`);
                }
            }
            // If 404 and URL looks like it might be Gitea format, try GitHub format as fallback
            if (response.status === 404 && rawUrl.includes('/raw/branch/')) {
                const githubFormatUrl = rawUrl.replace('/raw/branch/', '/raw/');
                debugLog(`404 with Gitea format, trying GitHub format: ${githubFormatUrl}`);
                const altResponse = await tryFetch(githubFormatUrl);
                if (altResponse.ok) {
                    debugLog(`GitHub format succeeded`);
                    return await altResponse.text();
                }
                debugLog(`GitHub format also failed`);
            }
            // If 404 and URL looks like GitHub format, try Gitea format as fallback
            else if (response.status === 404 && rawUrl.match(/\/raw\/[^/]+\/CHANGELOG\.md$/)) {
                const giteaFormatUrl = rawUrl.replace(/\/raw\/([^/]+)\/CHANGELOG\.md$/, '/raw/branch/$1/CHANGELOG.md');
                debugLog(`404 with GitHub format, trying Gitea format: ${giteaFormatUrl}`);
                const altResponse = await tryFetch(giteaFormatUrl);
                if (altResponse.ok) {
                    debugLog(`Gitea format succeeded`);
                    return await altResponse.text();
                }
                debugLog(`Gitea format also failed`);
            }
            if (!response.ok) {
                throw new Error(`Failed to fetch ${rawUrl}: ${response.status} ${response.statusText}`);
            }
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