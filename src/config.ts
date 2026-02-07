import * as core from '@actions/core';

type RepoType = 'auto' | 'github' | 'gitea' | 'gitlab' | 'bitbucket';
type ValidationLevel = 'none' | 'warn' | 'error';

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
  debugEnabled: boolean;
  skipCertificateCheck: boolean;
  hasPathInput: boolean;
  hasRepoUrlInput: boolean;
  hasRefInput: boolean;
  hasRepoTypeInput: boolean;
  hasConfigFileInput: boolean;
};

export function getInputs(): ParsedInputs {
  const path = core.getInput('path');
  const repoUrl = core.getInput('repoUrl');
  const refInput = core.getInput('ref');
  const repoTypeInput = (core.getInput('repoType') || 'auto') as RepoType;
  const token = core.getInput('token') || process.env.GITHUB_TOKEN;
  const version = core.getInput('version');
  const validationLevel = (core.getInput('validationLevel') || 'none') as ValidationLevel;
  const validationDepth = parseInt(core.getInput('validationDepth') || '10', 10);
  const configFile = core.getInput('configFile');
  const verboseInput = core.getBooleanInput('verbose');
  const envStepDebug = (process.env.ACTIONS_STEP_DEBUG || '').toLowerCase();
  const stepDebugEnabled = core.isDebug() || envStepDebug === 'true' || envStepDebug === '1';
  const debugEnabled = verboseInput || stepDebugEnabled;
  const skipCertificateCheck = core.getBooleanInput('skipCertificateCheck');

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
    verbose: verboseInput || stepDebugEnabled,
    debugEnabled,
    skipCertificateCheck,
    hasPathInput: path !== '',
    hasRepoUrlInput: repoUrl !== '',
    hasRefInput: refInput !== '',
    hasRepoTypeInput: core.getInput('repoType') !== '',
    hasConfigFileInput: configFile !== '',
  };
}
