import * as vscode from "vscode"
import { fetchFunctionMetadata } from "../utils/functionLoader"

function getTopLevelArgsWithRanges(argString: string): { value: string, start: number, end: number }[] {
  let args: { value: string, start: number, end: number }[] = []
  let current = ""
  let depth = 0
  let start = 0

  for (let i = 0; i < argString.length; i++) {
    const char = argString[i]

    if (char === "[" && argString[i - 1] === "$") depth++
    else if (char === "[") depth++
    else if (char === "]") depth--

    if (char === ";" && depth === 0) {
      args.push({ value: current, start, end: i })
      current = ""
      start = i + 1
    } else {
      current += char
    }
  }

  if (current.length > 0) {
    args.push({ value: current, start, end: argString.length })
  }

  return args
}

export function registerSignatureHelpProvider(context: vscode.ExtensionContext) {
  const supportedLanguages = ["forgescript", "javascript", "typescript"]

  const provider = vscode.languages.registerSignatureHelpProvider(
    supportedLanguages,
    {
      async provideSignatureHelp(document, position) {
        const line = document.lineAt(position.line).text
        const textBeforeCursor = line.substring(0, position.character)

        let bracketStack = 0
        let currentFunc = null
        let currentArgs = ""
        for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
          const char = textBeforeCursor[i]

          if (char === "]") bracketStack++
          else if (char === "[") bracketStack--

          if (bracketStack < 0) {
            const match = /\$([a-zA-Z0-9_]+)$/.exec(textBeforeCursor.slice(0, i))
            if (match) {
              currentFunc = `$${match[1]}`
              currentArgs = textBeforeCursor.slice(i + 1)
            }
            break
          }
        }

        if (!currentFunc) return

        const metadata = await fetchFunctionMetadata()
        const lowered = currentFunc.toLowerCase()
        const fn = metadata.find(f => `$${f.name.toLowerCase()}` === lowered || f.name.toLowerCase() === lowered)
        if (!fn || !Array.isArray(fn.args)) return

        const cursorOffset = currentArgs.length
        const argRanges = getTopLevelArgsWithRanges(currentArgs)

        let argIndex = 0
        for (let i = 0; i < argRanges.length; i++) {
          const { start, end } = argRanges[i]
          if (cursorOffset >= start && cursorOffset <= end) {
            argIndex = i
            break
          } else if (cursorOffset > end) {
            argIndex = i + 1
          }
        }

        const signatureLabelLines = fn.args.map(arg => {
          const name = arg.name || "arg"
          const type = arg.type || "any"
          return `  ${name}: ${type}`
        })

        const signatureLabel = `${currentFunc}[\n${signatureLabelLines.join(";\n")}\n]`

        const sig = new vscode.SignatureInformation(
          signatureLabel,
          new vscode.MarkdownString(fn.description || "*No description*")
        )

        sig.parameters = fn.args.map(arg => {
          const desc = new vscode.MarkdownString()
          desc.appendMarkdown(`${arg.description?.trim() || "No description provided."}\n\n`)
          desc.appendMarkdown(`**Type**: \`${arg.type || "any"}\`\n\n`)
          desc.appendMarkdown(`**Required**: \`${arg.required ? "true" : "false"}\`\n\n`)
          desc.appendMarkdown(`**Rest**: \`${arg.rest ? "true" : "false"}\``)
          desc.isTrusted = true

          return new vscode.ParameterInformation(
            `${arg.name}: ${arg.type || "any"}`,
            desc
          )
        })

        const sigHelp = new vscode.SignatureHelp()
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