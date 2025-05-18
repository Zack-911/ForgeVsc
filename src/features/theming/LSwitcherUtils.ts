import * as vscode from 'vscode';
import * as path from 'path';

const CONFIG_KEY = 'forgescript.languageSwitcher';

interface Config {
  disabledProjects: string[];
  disabledFiles: string[];
  disabledPaths: string[];
  disableAll: boolean;
  enableCommentDetection: boolean;
  enableObjectDetection: boolean;
  enableKeyDetection: boolean;
}

function getConfig(): Config {
  return vscode.workspace.getConfiguration().get(CONFIG_KEY) as Config || {
    disabledProjects: [],
    disabledFiles: [],
    disabledPaths: [],
    disableAll: false,
    enableCommentDetection: true,
    enableObjectDetection: true,
    enableKeyDetection: true,
  };
}

function updateConfig(newValues: Partial<Config>) {
  const config = getConfig();
  const updated = { ...config, ...newValues };
  return vscode.workspace.getConfiguration().update(CONFIG_KEY, updated, vscode.ConfigurationTarget.Global);
}

function isDisabled(doc: vscode.TextDocument): boolean {
  const cfg = getConfig();
  const filePath = doc.uri.fsPath;
  const projectPath = vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath;

  return cfg.disableAll ||
    cfg.disabledFiles.includes(filePath) ||
    (projectPath && cfg.disabledProjects.includes(projectPath)) ||
    cfg.disabledPaths.some(p => filePath.startsWith(p));
}

export {
  getConfig,
  updateConfig,
  isDisabled
};
