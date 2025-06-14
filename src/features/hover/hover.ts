import * as vscode from "vscode"
import { fetchFunctionMetadata, RawFunction } from "../utils/functionLoader"

export function registerHoverProvider(context: vscode.ExtensionContext) {
  const supportedLanguages = ["forgescript", "javascript", "typescript"]

  const provider = vscode.languages.registerHoverProvider(supportedLanguages, {
    async provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position, /\$[a-zA-Z0-9_]+/)
      if (!range) return

      const word = document.getText(range).trim()
      if (!word.startsWith("$")) return

      const metadata = await fetchFunctionMetadata()
      const fn = findMetadata(word, metadata)

      if (!fn) {
        const errMd = new vscode.MarkdownString(undefined)
        errMd.isTrusted = true
        errMd.appendMarkdown(`❌ Unknown ForgeScript function: \`${word}\``)
        return new vscode.Hover(errMd, range)
      }

      const md = new vscode.MarkdownString(undefined)
      md.isTrusted = true

      const shownName = word !== fn.name ? `\`${word}\` (matched: \`${fn.name}\`)` : `\`${fn.name}\``

      md.appendMarkdown(`**Function Details**\n\n`)
      md.appendMarkdown(`${shownName}\n\n`)

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

function findMetadata(name: string, metadata: RawFunction[]) {
  const lower = name.toLowerCase().replace(/^\$/, "")

  const exact = metadata.find(
    m =>
      m.name.toLowerCase() === `$${lower}` ||
      m.name.toLowerCase() === lower ||
      m.aliases?.some(alias => alias.toLowerCase().replace(/^\$/, "") === lower)
  )
  if (exact) return exact

  const sorted = [...metadata].sort((a, b) => b.name.length - a.name.length)

  for (const m of sorted) {
    const base = m.name.replace(/^\$/, "").toLowerCase()
    if (lower.startsWith(base)) return m

    const aliasMatch = m.aliases?.find(alias => {
      const sliced = alias.startsWith("$") ? alias.slice(1) : alias
      return lower.startsWith(sliced.toLowerCase())
    })

    if (aliasMatch) return m
  }

  return null
}