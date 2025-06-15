import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

function getNestedValue(obj: any, keyPath: string): any {
  return keyPath.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object') return acc[key];
    return undefined;
  }, obj);
}

export function getConfig(key: string): any | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) return undefined;

  const workspacePath = workspaceFolders[0].uri.fsPath;
  const configPath = path.join(workspacePath, '.vscode', 'forgevsc.config.json');

  if (!fs.existsSync(configPath)) {
    return undefined;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(configContent);
    return getNestedValue(userConfig, key);
  } catch {
    return undefined;
  }
}
