import * as core from '@actions/core';

type RepoType = 'auto' | 'github' | 'gitea' | 'gitlab' | 'bitbucket';
type ValidationLevel = 'none' | 'warn' | 'error';

function parseBoolean(val?: string): boolean {
  return val?.toLowerCase() === 'true' || val === '1';
}

export type ParsedInputs = {
  path: string;
  repoUrl: string;
  ref: string;
  repoType: RepoType;
  token?: string;
  version: string;
  validationLevel: ValidationLevel;
  validationDepth: number;
  configFile: string;
  verbose: boolean;
  debugMode: boolean;
  skipCertificateCheck: boolean;
  hasPathInput: boolean;
  hasRepoUrlInput: boolean;
  hasRefInput: boolean;
  hasRepoTypeInput: boolean;
  hasConfigFileInput: boolean;
};

export function getInputs(): ParsedInputs {
  const path = core.getInput('path');
  const repoUrl = core.getInput('repo-url');
  const refInput = core.getInput('ref');
  const repoTypeInput = (core.getInput('repo-type') || 'auto') as RepoType;
  const token = core.getInput('token') || process.env.GITHUB_TOKEN;
  const version = core.getInput('version');
  const validationLevel = (core.getInput('validation-level') || 'none') as ValidationLevel;
  const validationDepth = parseInt(core.getInput('validation-depth') || '10', 10);
  const configFile = core.getInput('config-file');
  const verboseInput = core.getBooleanInput('verbose');
  const debugMode =
    (typeof core.isDebug === 'function' && core.isDebug()) || parseBoolean(process.env.ACTIONS_STEP_DEBUG) || parseBoolean(process.env.ACTIONS_RUNNER_DEBUG) || parseBoolean(process.env.RUNNER_DEBUG);
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
