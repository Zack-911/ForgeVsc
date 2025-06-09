import * as vscode from "vscode"
import { fetchFunctionMetadata } from "../utils/functionLoader"

export function registerSignatureHelpProvider(context: vscode.ExtensionContext) {
  const supportedLanguages = ["forgescript", "javascript", "typescript"]

  const provider = vscode.languages.registerSignatureHelpProvider(
    supportedLanguages,
    {
      async provideSignatureHelp(document, position) {
        const line = document.lineAt(position.line).text
        const textBeforeCursor = line.substring(0, position.character)
      
        const functionMatch = /\$([a-zA-Z0-9_]+)\[([^\]]*)$/.exec(textBeforeCursor)
        if (!functionMatch) return
      
        const functionName = `$${functionMatch[1]}`
        const argString = functionMatch[2]
        const argIndex = argString.split(";").length - 1
      
        const metadata = await fetchFunctionMetadata()
        const fn = metadata.find(f => `$${f.name}` === functionName || f.name === functionName)
        if (!fn || !Array.isArray(fn.args)) return
      
        const sigHelp = new vscode.SignatureHelp()
        const sig = new vscode.SignatureInformation(
          `${functionName}[${fn.args.map(arg => `${arg.name}: ${arg.type || "any"}`).join("; ")}]`,
          fn.description || ""
        )
      
        sig.parameters = fn.args.map(arg => {
          const desc = `${arg.name}\n${arg.description || "No description"}\n\nType: ${arg.type || "any"}\nRequired: ${arg.required ? "Yes" : "No"}`
          return new vscode.ParameterInformation(`${arg.name}: ${arg.type || "any"}`, desc)
        })
      
        sigHelp.signatures = [sig]
        sigHelp.activeSignature = 0
        sigHelp.activeParameter = Math.min(argIndex, fn.args.length - 1)
      
        return sigHelp
      }
    },
    {
      triggerCharacters: ["[", ";"],
      retriggerCharacters: ["[", ";"]
    }
  )

  context.subscriptions.push(provider)

  const forceTrigger = vscode.window.onDidChangeTextEditorSelection(e => {
    const editor = e.textEditor
    const pos = e.selections[0].active
    const doc = editor.document
    const line = doc.lineAt(pos.line).text

    const before = line.substring(0, pos.character)
    const insideForgeCall = /\$[a-zA-Z0-9_]+\[[^\]]*\]?$/.test(before)

    if (insideForgeCall) {
      vscode.commands.executeCommand('editor.action.triggerParameterHints')
    }
  })

  context.subscriptions.push(forceTrigger)
}