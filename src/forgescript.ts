import * as vscode from 'vscode'

import { initForgeConfig } from './features/config/init'
import { registerSyntaxHighlightWatcher } from './features/theming/updateThemeWatcher'
import { getAutocompleteItems } from './features/autocompletion/autocomplete'
import { registerHoverProvider } from './features/hover/hover'
import { registerSignatureHelpProvider } from './features/hover/signature'
import { updateSyntaxHighlighting } from './features/theming/updateTheme'
import { registerArgumentChecker } from './features/diagnostics/argumentChecker'
// import { runTypeDiagnostics } from './features/diagnostics/typeChecker'

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

  // const diagnostics = vscode.languages.createDiagnosticCollection("forgescript")
  //  context.subscriptions.push(diagnostics)

  // const triggerDiagnostics = (doc: vscode.TextDocument) => {
  //   if (doc.languageId === "javascript" || doc.languageId === "typescript") {
  //     runTypeDiagnostics(doc, diagnostics)
  //   }
  // }

  // vscode.workspace.textDocuments.forEach(triggerDiagnostics)
  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeTextDocument(e => triggerDiagnostics(e.document)),
  //   vscode.workspace.onDidOpenTextDocument(triggerDiagnostics)
  // )

  console.log('🎉 Forge VSC Extension is now active!')
}

export function deactivate() {
  console.log('👋 Forge VSC Extension has been deactivated.')
}
