import * as vscode from "vscode"
import { getConfig } from "../config/getConfig"
import { fetchEventMetadata } from "../utils/eventLoader"

export async function getAutocompleteEventsItems(): Promise<vscode.CompletionItem[]> {
  const items: vscode.CompletionItem[] = []
  const metadata = await fetchEventMetadata()

  const urls = getConfig("urls") || {}
  const extensions = Object.keys(urls)

  const iconPool: vscode.CompletionItemKind[] = [
    vscode.CompletionItemKind.Event
  ]

  const kindMap: Record<string, vscode.CompletionItemKind> = {}
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i]
    kindMap[ext] = iconPool[i % iconPool.length]
  }

  for (const ev of metadata) {
    if (!ev.name) continue

    const doc = new vscode.MarkdownString(undefined)
    doc.appendMarkdown(`${ev.description || "*No description*"}\n\n`)

    if (ev.intents?.length) {
      doc.appendMarkdown(`**Required Intents:** ${ev.intents.join(", ")}\n`)
    }

    const kind = kindMap[ev.extension ?? "custom"] ?? vscode.CompletionItemKind.Event

    const item = new vscode.CompletionItem(ev.name, kind)
    item.insertText = ev.name
    item.detail = ev.name
    item.documentation = doc
    items.push(item)
  }

  return items
}
