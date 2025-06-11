import * as vscode from "vscode"
import { fetchFunctionMetadata } from "../utils/functionLoader"

export function registerHoverProvider(context: vscode.ExtensionContext) {
  const supportedLanguages = ["forgescript", "javascript", "typescript"]

  const provider = vscode.languages.registerHoverProvider(supportedLanguages, {
    async provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position, /\$[a-zA-Z0-9_]+/)
      if (!range) return

      const word = document.getText(range)
      if (!word.startsWith("$")) return

      const metadata = await fetchFunctionMetadata()
      const fn = metadata.find(f => `$${f.name}` === word || f.name === word)
      if (!fn) return

      const md = new vscode.MarkdownString(undefined)
      md.isTrusted = true

      md.appendMarkdown(`**Function Details**\n`)
      md.appendMarkdown(`\n\`${word}\`\n\n`)

      if (fn.description) {
        md.appendMarkdown(`${fn.description}\n\n`)
      }

      if (fn.output) {
        const output = Array.isArray(fn.output) ? fn.output.join(", ") : fn.output
        md.appendMarkdown(`**Returns:**\n${output}\n\n`)
      }

      if (Array.isArray(fn.args)) {
        md.appendMarkdown(`**Arguments (${fn.args.length}):**\n`)
        for (const arg of fn.args) {
          const name = `\`${arg.name || "unknown"}\``
          const type = arg.type || "any"
          const required = arg.required ? "(Required)" : ""
          md.appendMarkdown(`- ${name} (${type}) ${required}\n`)
        }
        md.appendMarkdown("\n")
      }

      const extension = fn.extension || "Unknown"
      md.appendMarkdown(`**Extension:** ${extension}\n`)

      return new vscode.Hover(md, range)
    }
  })

  context.subscriptions.push(provider)
}