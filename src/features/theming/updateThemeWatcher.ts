import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import { updateSyntaxHighlighting } from './updateTheme'

function hasForgeConfig(workspacePath: string): boolean {
  return fs.existsSync(path.join(workspacePath, '.vscode', 'forgevsc.config.json'))
}

export function registerSyntaxHighlightWatcher(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders?.length) return

  const workspacePath = workspaceFolders[0].uri.fsPath

  if (!hasForgeConfig(workspacePath)) {
    vscode.window.showErrorMessage('❌ Missing .vscode/forgevsc.config.json. Use the init command to generate it.')
    return
  }

  const watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/forgevsc.config.json')

  const onConfigChange = async () => {
    await updateSyntaxHighlighting()
    const choice = await vscode.window.showInformationMessage(
      'Syntax highlighting updated. Reload window for full effect?',
      'Reload Now'
    )
    if (choice === 'Reload Now') {
      vscode.commands.executeCommand('workbench.action.reloadWindow')
    }
  }

  watcher.onDidCreate(onConfigChange)
  watcher.onDidChange(onConfigChange)

  context.subscriptions.push(watcher)

  context.subscriptions.push(
    vscode.commands.registerCommand('forgevsc.reloadSyntax', async () => {
      await updateSyntaxHighlighting()
      vscode.window.showInformationMessage('Syntax highlighting manually reloaded. Reload window for full effect.')
    })
  )
}
