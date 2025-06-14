import * as vscode from "vscode"
import { getAutocompleteFunctionsItems } from "./autocompleteFunctions"

export function registerFunctionCompletionProvider(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'javascript' },
      { language: 'typescript' }
    ],
    {
      async provideCompletionItems(document, position) {
        const line = document.lineAt(position).text
        let start = position.character - 1
      
        while (start >= 0) {
          const char = line[start]
          if (char === '$') break
          if (!/[a-zA-Z0-9_]/.test(char)) return undefined
          start--
        }
      
        if (start < 0 || line[start] !== '$') return undefined
        const partial = line.slice(start, position.character)
      
        const items = await getAutocompleteFunctionsItems()
        return items.filter(item => item.label.startsWith(`$${partial.slice(1)}`))
      }
    },
    '$'
  )
  context.subscriptions.push(provider)
}
