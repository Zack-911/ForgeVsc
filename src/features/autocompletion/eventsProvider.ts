import * as vscode from "vscode"
import { getAutocompleteEventsItems } from "./autocompleteEvents"

export function registerEventCompletionProvider(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'javascript' },
      { language: 'typescript' }
    ],
    {
      async provideCompletionItems(document, position) {
        const line = document.lineAt(position.line).text
        const prefix = line.substring(0, position.character)

        const typeMatch = prefix.match(/type\s*:\s*["'`]([\w-]*)$/)
        const eventsArrayMatch = prefix.match(/events\s*:\s*\[\s*["'`]([\w-]*)$/)

        if (!typeMatch && !eventsArrayMatch) return undefined

        const partial = (typeMatch?.[1] || eventsArrayMatch?.[1] || "").trim()
        const items = await getAutocompleteEventsItems()
        return items.filter(item => item.label.startsWith(partial))
      }
    },
    '"', "'", '`'
  )
  context.subscriptions.push(provider)
}
