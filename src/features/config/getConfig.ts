import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { initForgeConfig } from './init';
const TEMPLATE_PATH = '../../config/forgevsc.config.json';

function getNestedValue(obj: any, keyPath: string): any {
  return keyPath.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object') return acc[key];
    return undefined;
  }, obj);
}

export function getConfig(key: string): any | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder found.');
    return undefined;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;
  const configFolder = path.join(workspacePath, '.vscode');
  const configPath = path.join(configFolder, 'forgevsc.config.json');

  try {
    if (!fs.existsSync(configPath)) {
      initForgeConfig()
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(configContent);

    return getNestedValue(userConfig, key);
  } catch {
    return undefined;
  }
}