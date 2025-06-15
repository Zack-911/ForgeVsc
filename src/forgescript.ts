import * as vscode from 'vscode'
import { initForgeConfig } from './features/config/init'
import { registerSyntaxHighlightWatcher } from './features/theming/updateThemeWatcher'
import { registerHoverProvider } from './features/hover/hover'
import { registerSignatureHelpProvider } from './features/intellisense/signature'
import { updateSyntaxHighlighting } from './features/theming/updateTheme'
import { registerArgumentChecker } from './features/diagnostics/argumentChecker'
import { registerWebviewCommands } from './features/webviews/registerWebviewCommands'
import { registerFunctionNameNormalizer } from './features/prettier/normalizeFunctionNames'
import { registerFunctionCompletionProvider } from './features/autocompletion/functionsProvider'
import { registerEventCompletionProvider } from './features/autocompletion/eventsProvider'
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
  registerFunctionNameNormalizer(context)
  registerFunctionCompletionProvider(context)
  registerEventCompletionProvider(context)

  console.log('🎉 Forge VSC Extension is now active!')
}

export function deactivate() {
  console.log('👋 Forge VSC Extension has been deactivated.')
}
