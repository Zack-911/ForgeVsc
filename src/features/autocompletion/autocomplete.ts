import * as vscode from "vscode"
import { fetchFunctionMetadata } from "../utils/functionLoader"

export async function getAutocompleteItems(): Promise<vscode.CompletionItem[]> {
  const items: vscode.CompletionItem[] = []
  const metadata = await fetchFunctionMetadata()

  for (const fn of metadata) {
    if (!fn.name) continue

    const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`
    let insertText = name

    const doc = new vscode.MarkdownString(undefined)
    doc.appendMarkdown(`${fn.description || "*No description*"}\n\n`)

    if (Array.isArray(fn.args) && fn.args.length > 0) {
      doc.appendMarkdown(`**Arguments:**\n`)
      fn.args.forEach(arg => {
        const name = arg.name || "arg"
        const type = arg.type || "any"
        const isRequired = arg.required === true
        doc.appendMarkdown(`- \`${name}\` (${type})${isRequired ? " (req)" : ""}\n`)
      })
    }

    if (fn.output?.length) {
      doc.appendMarkdown(`\nReturns: ${fn.output.join(", ")}\n`)
    }

    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function)
    item.insertText = insertText
    item.detail = name
    item.documentation = doc
    items.push(item)
  }

  return items
}
