import * as vscode from "vscode"
import { getConfig } from "../config/getConfig"
import { fetchFunctionMetadata } from "../utils/functionLoader"

export async function getAutocompleteFunctionsItems(): Promise<vscode.CompletionItem[]> {
  const items: vscode.CompletionItem[] = []
  const metadata = await fetchFunctionMetadata()

  const urls = getConfig("urls") || {}
  const extensions = [...Object.keys(urls), "custom"]

  const iconPool: vscode.CompletionItemKind[] = [
    vscode.CompletionItemKind.Function,
    vscode.CompletionItemKind.Interface,
    vscode.CompletionItemKind.Module,
    vscode.CompletionItemKind.Class,
    vscode.CompletionItemKind.Struct,
    vscode.CompletionItemKind.Constant,
    vscode.CompletionItemKind.Variable,
    vscode.CompletionItemKind.Color,
    vscode.CompletionItemKind.Property,
    vscode.CompletionItemKind.Field,
    vscode.CompletionItemKind.Unit,
    vscode.CompletionItemKind.Method,
    vscode.CompletionItemKind.Value
  ]

  const kindMap: Record<string, vscode.CompletionItemKind> = {}
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i]
    kindMap[ext] = iconPool[i % iconPool.length]
  }

  for (const fn of metadata) {
    if (!fn.name) continue

    const hasRequiredArg = fn.args?.some(arg => arg.required) ?? false
    const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`
    const insertText = hasRequiredArg ? `${name}[` : name

    const doc = new vscode.MarkdownString(undefined)
    doc.isTrusted = true

    doc.appendMarkdown(`${fn.description || "*No description*"}\n\n`)

    if (Array.isArray(fn.args) && fn.args.length > 0) {
  doc.appendMarkdown(`**Arguments:**\n\n`)

  const rows = [
    ["Name","Type", "Required", "Rest"],
    ["-----","----", "--------", "----"]
  ]

  for (const arg of fn.args) {
    const name = arg.name || "arg"

    const type = arg.type || "any"
    const required = arg.required ? "✅" : "❌"
    const rest = arg.rest ? "✅" : "❌"
    rows.push([name, type, required, rest])
  }

  const colWidths = rows[0].map((_, i) =>
    Math.max(...rows.map(row => row[i].length))
  )

  const formatted = rows.map(row =>
    row.map((cell, i) => cell.padEnd(colWidths[i])).join(" | ")
  )

  const block = "```txt\n" + formatted.join("\n") + "\n```\n"
  doc.appendMarkdown(block)
}


    if (fn.output?.length) {
      const output = Array.isArray(fn.output) ? fn.output.join(", ") : fn.output
      doc.appendMarkdown(`**Returns:** ${output}\n`)
    }

    const kind = kindMap[fn.extension ?? "custom"] ?? vscode.CompletionItemKind.Value

    const item = new vscode.CompletionItem(name, kind)
    item.insertText = insertText
    item.detail = name
    item.documentation = doc
    items.push(item)
  }

  return items
}