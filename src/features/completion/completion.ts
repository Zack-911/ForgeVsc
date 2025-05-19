import * as vscode from 'vscode';
import { shouldProvideForJsTs } from '../../core/utils';
import { completionItems, typeCompletionItems } from '../../core/fetchers';
console.log("Autocompleteee")
export function registerCompletionProviders(autoCompletionEnabledRef: () => boolean) {
  const fsProvider = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript'],
    {
      provideCompletionItems(document, position) {
        if (!autoCompletionEnabledRef()) return;
        if (document.languageId === 'fs' || shouldProvideForJsTs(document, position)) {
          const linePrefix = document.lineAt(position).text.substr(0, position.character);
          if (!linePrefix.match(/\$[a-zA-Z0-9_]*$/)) return;
          return completionItems;
        }
      }
    },
    '$'
  );
  console.log("Autocompletee")
  const typeProvider = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript'],
    {
      provideCompletionItems(document, position) {
        if (!autoCompletionEnabledRef()) return;
        if (document.languageId === 'fs' || shouldProvideForJsTs(document, position)) {
          const line = document.lineAt(position).text;
          const prefix = line.substring(0, position.character);
          if (!/type\s*[:=]\s*["']?[a-zA-Z0-9_]*$/.test(prefix)) return;
          return typeCompletionItems;
        }
      }
    },
    '"', "'"
  );

  console.log("Autocomplete")

  return [fsProvider, typeProvider];
}