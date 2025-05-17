import * as vscode from 'vscode';

export function getSourceName(url: string): string {
  if (url.includes('Forgedb')) return 'ForgeDB';
  if (url.includes('Forgecanvas')) return 'ForgeCanvas';
  return 'ForgeScript';
}

export function isInTemplateString(document: vscode.TextDocument, position: vscode.Position): boolean {
  const text = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
  const backticks = (text.match(/`/g) || []).length;
  return backticks % 2 === 1;
}

export function shouldProvideForJsTs(document: vscode.TextDocument, position: vscode.Position): boolean {
  const fileName = document.fileName;
  if (fileName.endsWith('.fs.js') || fileName.endsWith('.fs.ts')) return true;
  if ((fileName.endsWith('.js') || fileName.endsWith('.ts')) && position) {
    return isInTemplateString(document, position);
  }
  return false;
}
