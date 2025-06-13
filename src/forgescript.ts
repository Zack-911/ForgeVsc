import * as vscode from 'vscode'

import { initForgeConfig } from './features/config/init'
import { registerSyntaxHighlightWatcher } from './features/theming/updateThemeWatcher'
import { getAutocompleteFunctionsItems } from './features/autocompletion/autocompleteFunctions'
import { getAutocompleteEventsItems } from './features/autocompletion/autocompleteEvents'
import { registerHoverProvider } from './features/hover/hover'
import { registerSignatureHelpProvider } from './features/intellisense/signature'
import { updateSyntaxHighlighting } from './features/theming/updateTheme'
import { registerArgumentChecker } from './features/diagnostics/argumentChecker'
import { registerWebviewCommands } from './features/webviews/registerWebviewCommands'

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('forge-vsc.initConfig', initForgeConfig)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('forge-vsc.reloadSyntaxHighlighting', async () => {
      updateSyntaxHighlighting()
      const choice = await vscode.window.showInformationMessage(
        'Syntax highlighting updated. Reload window for full effect?',
        'Reload Now'
      )
      if (choice === 'Reload Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow')
      }
    })
  )

  registerSyntaxHighlightWatcher(context)
  registerHoverProvider(context)
  registerSignatureHelpProvider(context)
  registerArgumentChecker(context)
  registerWebviewCommands(context)

  const autocompleteFunctionProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'javascript' },
      { language: 'typescript' }
    ],
    {
      async provideCompletionItems(document, position) {
        const line = document.lineAt(position).text.substring(0, position.character)
        const match = line.match(/\$(\w*)$/)
        if (!match) return undefined

        const partial = match[1] || ""
        const items = await getAutocompleteFunctionsItems()
        return items.filter(item => item.label.startsWith(`$${partial}`))
      }
    },
    '$'
  )
  context.subscriptions.push(autocompleteFunctionProvider)

  const autocompleteEventProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'javascript' },
      { language: 'typescript' }
    ],
    {
      async provideCompletionItems(document, position) {
        const line = document.lineAt(position.line).text
        const prefix = line.substring(0, position.character)

        const typeMatch = prefix.match(/type\s*:\s*["'`]([\w-]*)$/)
        const eventsArrayMatch = prefix.match(/events\s*:\s*\[\s*["'`]([\w-]*)$/)

        if (!typeMatch && !eventsArrayMatch) return undefined

        const partial = (typeMatch?.[1] || eventsArrayMatch?.[1] || "").trim()
        const items = await getAutocompleteEventsItems()
        return items.filter(item => item.label.startsWith(partial))
      }
    },
    '"', "'", '`'
  )
  context.subscriptions.push(autocompleteEventProvider)

  console.log('🎉 Forge VSC Extension is now active!')
}

export function deactivate() {
  console.log('👋 Forge VSC Extension has been deactivated.')
}