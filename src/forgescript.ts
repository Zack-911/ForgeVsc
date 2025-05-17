import * as vscode from 'vscode';
import { fetchFunctions, fetchEvents } from './core/fetchers';
import { registerCompletionProviders } from './features/completion/completion';
import { registerDiagnostics } from './features/diagnostic/diagnostics';

let autoCompletionEnabled = true;

export async function activate(context: vscode.ExtensionContext) {
  await fetchFunctions();
  await fetchEvents();

  const getStatus = () => autoCompletionEnabled;

  const [fsProvider, typeProvider] = registerCompletionProviders(getStatus);
  const [diagnosticCheck, diagnosticCollection] = registerDiagnostics(getStatus);

  const enableCmd = vscode.commands.registerCommand('forgescript.enableAutocomplete', () => {
    autoCompletionEnabled = true;
    vscode.window.showInformationMessage('ForgeScript Autocomplete enabled');
  });

  const disableCmd = vscode.commands.registerCommand('forgescript.disableAutocomplete', () => {
    autoCompletionEnabled = false;
    vscode.window.showInformationMessage('ForgeScript Autocomplete disabled');
  });

  context.subscriptions.push(fsProvider, typeProvider, enableCmd, disableCmd, diagnosticCheck, diagnosticCollection);
}

export function deactivate() {}
