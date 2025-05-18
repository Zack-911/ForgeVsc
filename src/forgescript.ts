import * as vscode from 'vscode';
import { fetchFunctions, fetchEvents, forceRefetchFunctions } from './core/fetchers';
import { initCache, lastFetchTime, updateFetchTime } from './core/fetchWithCache';
import { registerCompletionProviders } from './features/completion/completion';
import { activateLanguageSwitcher } from './features/theming/languageSwitcher';

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

  const [fsProvider, typeProvider] = registerCompletionProviders(getStatus);

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

  context.subscriptions.push(
    fsProvider,
    typeProvider,
    enableCmd,
    disableCmd,
    refreshCmd
  );

  // Activate the language switcher feature:
  activateLanguageSwitcher(context);
}

export function deactivate() {}