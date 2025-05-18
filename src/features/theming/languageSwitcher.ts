import * as vscode from 'vscode';
import * as ts from 'typescript';
import { getConfig, updateConfig, isDisabled } from './LSwitcherUtils';

export function activateLanguageSwitcher(context: vscode.ExtensionContext) {
  function shouldSwitch(doc: vscode.TextDocument): boolean {
    const { enableCommentDetection, enableObjectDetection, enableKeyDetection } = getConfig();

    if (!['javascript', 'typescript'].includes(doc.languageId)) return false;
    if (doc.languageId === 'fs') return false;
    if (isDisabled(doc)) return false;

    const text = doc.getText();

    if (enableCommentDetection && text.startsWith('// @forgescript')) return true;

    if (enableObjectDetection || enableKeyDetection) {
      try {
        const source = ts.createSourceFile(doc.fileName, text, ts.ScriptTarget.Latest, true);
        for (const stmt of source.statements) {
          if (ts.isExportAssignment(stmt) && ts.isObjectLiteralExpression(stmt.expression)) {
            const props = stmt.expression.properties.map(p => p.name?.getText().toLowerCase() || '');
            if (props.includes('code')) {
              if (enableKeyDetection && (props.includes('type') || props.includes('data'))) return true;
              if (enableObjectDetection && !(props.includes('type') || props.includes('data'))) return true;
            }
          }
        }
      } catch {}
    }

    return false;
  }

  async function trySwitch(doc: vscode.TextDocument) {
    if (shouldSwitch(doc)) {
      await vscode.languages.setTextDocumentLanguage(doc, 'fs');
      console.log(`[ForgeScript] Language set to fs for ${doc.fileName}`);
    }
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(trySwitch),
    vscode.workspace.onDidChangeTextDocument(e => trySwitch(e.document))
  );

  if (vscode.window.activeTextEditor) trySwitch(vscode.window.activeTextEditor.document);

  context.subscriptions.push(
    vscode.commands.registerCommand('forgescript.configureLanguageDetection', async () => {
      const doc = vscode.window.activeTextEditor?.document;
      const root = doc ? vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath : undefined;
      const cfg = getConfig();

      const options = [
        { label: 'Toggle //@forgescript comment', key: 'enableCommentDetection' },
        { label: 'Toggle object detection (module.exports)', key: 'enableObjectDetection' },
        { label: 'Toggle type/code/data detection', key: 'enableKeyDetection' },
        { label: 'Enable all detection', key: 'enableAll' },
        { label: 'Disable all detection', key: 'disableAll' },
        { label: 'Toggle detection for this file', key: 'file' },
        { label: 'Toggle detection for this project', key: 'project' },
        { label: 'Toggle global switcher', key: 'global' }
      ];

      const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select a detection toggle',
      });

      if (!selection) return;

      switch (selection.key) {
        case 'enableAll':
          updateConfig({
            enableCommentDetection: true,
            enableObjectDetection: true,
            enableKeyDetection: true
          }).then(() => vscode.window.showInformationMessage('ForgeScript: All detection enabled.'));
          break;

        case 'disableAll':
          updateConfig({
            enableCommentDetection: false,
            enableObjectDetection: false,
            enableKeyDetection: false
          }).then(() => vscode.window.showInformationMessage('ForgeScript: All detection disabled.'));
          break;

        case 'global':
          updateConfig({ disableAll: !cfg.disableAll }).then(() =>
            vscode.window.showInformationMessage(
              `ForgeScript: Global switcher ${cfg.disableAll ? 'enabled' : 'disabled'}.`
            )
          );
          break;

        case 'file':
          if (!doc) return;
          const filePath = doc.uri.fsPath;
          const isFileDisabled = cfg.disabledFiles.includes(filePath);
          const newFileList = isFileDisabled
            ? cfg.disabledFiles.filter(f => f !== filePath)
            : [...cfg.disabledFiles, filePath];
          updateConfig({ disabledFiles: newFileList }).then(() =>
            vscode.window.showInformationMessage(
              `ForgeScript: File detection ${isFileDisabled ? 'enabled' : 'disabled'}.`
            )
          );
          break;

        case 'project':
          if (!root) return;
          const isProjectDisabled = cfg.disabledProjects.includes(root);
          const newProjectList = isProjectDisabled
            ? cfg.disabledProjects.filter(p => p !== root)
            : [...cfg.disabledProjects, root];
          updateConfig({ disabledProjects: newProjectList }).then(() =>
            vscode.window.showInformationMessage(
              `ForgeScript: Project detection ${isProjectDisabled ? 'enabled' : 'disabled'}.`
            )
          );
          break;

        default: {
          const key = selection.key as keyof typeof cfg;
          const newVal = !cfg[key];
          updateConfig({ [key]: newVal }).then(() =>
            vscode.window.showInformationMessage(
              `ForgeScript: ${selection.label} ${newVal ? 'enabled' : 'disabled'}.`
            )
          );
        }
      }
    })
  );
}