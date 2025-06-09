import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function initForgeConfig(): void {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("❌ No workspace folder found.");
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;
  const vscodeDir = path.join(workspacePath, '.vscode');
  const configPath = path.join(vscodeDir, 'forgevsc.config.json');
  const templatePath = path.join(__dirname, '..', '..', 'config', 'forgevsc.config.json');

  try {
    if (!fs.existsSync(templatePath)) {
      vscode.window.showErrorMessage(`❌ Template config not found at ${templatePath}`);
      return;
    }

    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
      vscode.window.showInformationMessage('📁 Created `.vscode` directory');
    }

    fs.copyFileSync(templatePath, configPath);
    vscode.window.showInformationMessage('✅ forgevsc.config.json copied to .vscode folder');
  } catch (err: any) {
    vscode.window.showErrorMessage(`❌ Failed to initialize config: ${err.message}`);
  }
}