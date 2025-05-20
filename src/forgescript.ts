import * as vscode from 'vscode';
import { fetchFunctions, fetchEvents, forceRefetchFunctions } from './core/fetchers';
import { initCache, lastFetchTime, updateFetchTime } from './core/fetchWithCache';

let autoCompletionEnabled = true;

export async function activate(context: vscode.ExtensionContext) {
  initCache(context);

  const now = Date.now();
  const oneDay = 1000 * 60 * 60 * 24;
  const lastFetch = lastFetchTime();

  const shouldRefetch = !lastFetch || now - lastFetch > oneDay;

  if (shouldRefetch) {
    await fetchFunctions();
    await fetchEvents();
    updateFetchTime();
  } else {
    await fetchFunctions(false);
    await fetchEvents(false);
  }

  const getStatus = () => autoCompletionEnabled;

  const enableCmd = vscode.commands.registerCommand('forgescript.enableAutocomplete', () => {
    autoCompletionEnabled = true;
    vscode.window.showInformationMessage('ForgeScript Autocomplete enabled');
  });

  const disableCmd = vscode.commands.registerCommand('forgescript.disableAutocomplete', () => {
    autoCompletionEnabled = false;
    vscode.window.showInformationMessage('ForgeScript Autocomplete disabled');
  });

  const refreshCmd = vscode.commands.registerCommand('forgescript.refreshMetadata', async () => {
    vscode.window.showInformationMessage('Refreshing ForgeScript metadata...');
    await forceRefetchFunctions();
    updateFetchTime();
    vscode.window.showInformationMessage('ForgeScript metadata refreshed!');
  });

  const rainbowExt = vscode.extensions.getExtension('oderwat.indent-rainbow');
  if (!rainbowExt) {
    vscode.window.showInformationMessage(
      'ForgeScript extension reallyyyy recommends installing the "Rainbow Indent Lines" extension for the best experience. Wanna install it now?',
      'Yes', 'No'
    ).then(selection => {
      if (selection === 'Yes') {
        vscode.commands.executeCommand('workbench.extensions.installExtension', 'oderwat.indent-rainbow');
      }
    });
  }

  context.subscriptions.push(
    enableCmd,
    disableCmd,
    refreshCmd
  );
}

export function deactivate() {}