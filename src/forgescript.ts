import * as vscode from 'vscode'

import { initForgeConfig } from './features/config/init'
import { registerSyntaxHighlightWatcher } from './features/theming/updateThemeWatcher'
import { getAutocompleteItems } from './features/autocompletion/autocomplete'
import { registerHoverProvider } from './features/hover/hover'
import { updateSyntaxHighlightingMC } from './features/theming/updateThemeMC'

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('forge-vsc.initConfig', initForgeConfig)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('forge-vsc.reloadSyntaxHighlighting', async () => {
      updateSyntaxHighlightingMC()
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
  const autocompleteProvider = vscode.languages.registerCompletionItemProvider(
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
        const items = await getAutocompleteItems()
        return items.filter(item => item.label.startsWith(`$${partial}`))
      }
    },
    '$'
  )

  context.subscriptions.push(autocompleteProvider)

  console.log('🎉 Forge VSC Extension is now active!')
}

export function deactivate() {
  console.log('👋 Forge VSC Extension has been deactivated.')
}
