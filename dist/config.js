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
exports.getInputs = getInputs;
const core = __importStar(require("@actions/core"));
function parseBoolean(val) {
    return val?.toLowerCase() === 'true' || val === '1';
}
function getInputs() {
    const path = core.getInput('path');
    const repoUrl = core.getInput('repo-url');
    const refInput = core.getInput('ref');
    const repoTypeInput = (core.getInput('repo-type') || 'auto');
    const token = core.getInput('token') || process.env.GITHUB_TOKEN;
    const version = core.getInput('version');
    const validationLevel = (core.getInput('validation-level') || 'none');
    const validationDepth = parseInt(core.getInput('validation-depth') || '10', 10);
    const configFile = core.getInput('config-file');
    const verboseInput = core.getBooleanInput('verbose');
    const debugMode = (typeof core.isDebug === 'function' && core.isDebug()) || parseBoolean(process.env.ACTIONS_STEP_DEBUG) || parseBoolean(process.env.ACTIONS_RUNNER_DEBUG) || parseBoolean(process.env.RUNNER_DEBUG);
    const verbose = verboseInput || debugMode;
    const skipCertificateCheck = core.getBooleanInput('skip-certificate-check');
    if (verboseInput && !process.env.ACTIONS_STEP_DEBUG) {
        process.env.ACTIONS_STEP_DEBUG = 'true';
    }
    return {
        path,
        repoUrl,
        ref: refInput || 'main',
        repoType: repoTypeInput,
        token,
        version,
        validationLevel,
        validationDepth,
        configFile,
        verbose,
        debugMode,
        skipCertificateCheck,
        hasPathInput: path !== '',
        hasRepoUrlInput: repoUrl !== '',
        hasRefInput: refInput !== '',
        hasRepoTypeInput: core.getInput('repo-type') !== '',
        hasConfigFileInput: configFile !== '',
    };
}
//# sourceMappingURL=config.js.map