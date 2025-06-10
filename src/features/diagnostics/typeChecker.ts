import * as vscode from "vscode"
import { fetchFunctionMetadata } from "../utils/functionLoader"

function getTopLevelArgs(argString: string): string[] {
  let args: string[] = []
  let current = ""
  let depth = 0

  for (let i = 0; i < argString.length; i++) {
    const char = argString[i]

    if (char === "[") {
      depth++
      current += char
    } else if (char === "]") {
      depth--
      current += char
    } else if (char === ";" && depth === 0) {
      args.push(current)
      current = ""
    } else {
      current += char
    }
  }

  if (current.length > 0) {
    args.push(current)
  }

  return args
}

function parseFunction(
  value: string,
  functionNames: string[]
): { name: string; args: string[]; range: [number, number] } | null {
  const escapedNames = functionNames.map(escapeRegex).join("|")
  const regex = new RegExp(`^(\\$(?:${escapedNames}))\\[((?:.|\\n)*?)\\]$`)
  const match = regex.exec(value.trim())
  if (!match) return null

  const name = match[1]
  const args = getTopLevelArgs(match[2])
  const range: [number, number] = [0, value.length]

  return { name, args, range }
}

function inferType(value: string): string {
  const trimmed = value.trim()

  if (!isNaN(Number(trimmed))) return "number"
  if (trimmed === "true" || trimmed === "false") return "boolean"

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return "array"
    if (typeof parsed === "object") return "object"
  } catch {}

  return "string"
}

function resolveType(input: string, metadata: any[]): string {
  const trimmed = input.trim()
  const functionNames = metadata.map(f => f.name.replace(/^\$/, ""))
  const nested = parseFunction(trimmed, functionNames)

  if (nested) {
    const fn = metadata.find(f => `$${f.name}` === nested.name || f.name === nested.name)
    const output = fn?.output
    const outputType = Array.isArray(output) ? output[0] : output ?? "any"
    return typeof outputType === "string" ? normalizeType(outputType) : "any"
  }

  const fn = metadata.find(f => {
    const raw = f.name.startsWith("$") ? f.name : `$${f.name}`
    return trimmed === raw
  })

  if (fn) {
    const output = fn.output
    const outputType = Array.isArray(output) ? output[0] : output ?? "any"
    return typeof outputType === "string" ? normalizeType(outputType) : "any"
  }

  return inferType(trimmed)
}

function normalizeType(type: string): string {
  const t = type.toLowerCase()
  if (["unknown", "null", "undefined", "other"].includes(t)) return "any"
  return t
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function runTypeDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
  const diagnostics: vscode.Diagnostic[] = []
  const text = document.getText()
  const metadata = await fetchFunctionMetadata()
  const functionNames = metadata.map(f => f.name.replace(/^\$/, ""))

  const regex = new RegExp(`\\$(?:${functionNames.map(escapeRegex).join("|")})\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\][^\\[\\]]*)*\\]`, "g")
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0]
    const start = match.index
    const end = match.index + raw.length

    const parsed = parseFunction(raw, functionNames)
    if (!parsed) continue

    const fn = metadata.find(f => {
      const base = f.name.startsWith("$") ? f.name : `$${f.name}`
      return parsed.name === base
    })

    if (!fn || !fn.args || !Array.isArray(fn.args)) continue

    for (let i = 0; i < parsed.args.length; i++) {
      const expected = normalizeType(fn.args[i]?.type ?? "any")
      const actual = resolveType(parsed.args[i].trim(), metadata)

      if (expected === "any" || actual === "any") continue
      if (expected !== actual) {
        const range = new vscode.Range(
          document.positionAt(start),
          document.positionAt(end)
        )
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Argument ${i + 1} of ${parsed.name} expects ${expected}, got ${actual}`,
            vscode.DiagnosticSeverity.Warning
          )
        )
      }
    }
  }

  collection.set(document.uri, diagnostics)
}