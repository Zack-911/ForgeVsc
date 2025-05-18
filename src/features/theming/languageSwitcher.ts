import * as vscode from 'vscode';

export function activateLanguageSwitcher(context: vscode.ExtensionContext) {
  function shouldSwitch(doc: vscode.TextDocument): boolean {

    if (!['javascript', 'typescript'].includes(doc.languageId)) return false;
    if (doc.languageId === 'fs') return false;

    const text = doc.getText();

    if ( text.startsWith('// @forgescript')) return true;

    return false;
  }

  async function trySwitch(doc: vscode.TextDocument) {
    if (shouldSwitch(doc)) {
      await vscode.languages.setTextDocumentLanguage(doc, 'fs');
      console.log(`[ForgeScript] Language set to fs for ${doc.fileName}`);
    }
  };
}