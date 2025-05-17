import * as vscode from 'vscode';
import { functionsData } from './fetchers';

export function registerDiagnostics(autoCompletionEnabledRef: () => boolean) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('forgescript');

  const diagnosticCheck = vscode.workspace.onDidChangeTextDocument(event => {
    if (!autoCompletionEnabledRef()) return;

    const document = event.document;
    if (!document.fileName.endsWith('.fs.js') && !document.fileName.endsWith('.fs.ts') && document.languageId !== 'fs') return;

    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    for (const func of functionsData) {
      if (!func.args || !func.brackets) continue;

      const required = func.args.filter(arg => arg.required).length;
      const total = func.args.length;
      const regex = new RegExp(`\\${func.name}\\[([^\\]]*)\\]`, 'g');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const provided = match[1].split(';').filter(Boolean);
        const start = document.positionAt(match.index);
        const end = document.positionAt(match.index + match[0].length);

        if (provided.length < required) {
          diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(start, end),
            `${func.name} is missing required parameters.`,
            vscode.DiagnosticSeverity.Error
          ));
        } else if (provided.length > total) {
          diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(start, end),
            `${func.name} has too many parameters.`,
            vscode.DiagnosticSeverity.Error
          ));
        }
      }
    }

    diagnosticCollection.set(document.uri, diagnostics);
  });

  return [diagnosticCheck, diagnosticCollection];
}
