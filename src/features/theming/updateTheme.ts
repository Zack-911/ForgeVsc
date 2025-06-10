import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import { getConfig } from "../config/getConfig"
import { fetchFunctionMetadata } from "../utils/functionLoader"

const DEFAULT_COLORS = [
  "#a87ffb", "#b895fd", "#92A9FF", "#85CDF1", "#708fff", "#77D5A3",
  "#66ce98", "#FFD395", "#f7768e", "#fc8f8e", "#ffa23e", "#ffc26e",
  "#BD9CFE", "#c8aaff", "#9AC1F6", "#5A8CFF"
]

const injectionPaths = [
  path.join(__dirname, '..', '..', 'config', 'injection.json')
]

const themePaths = [
  path.join(__dirname, '..', '..', 'config', 'FSColorThemeDarkFlat.json'),
  path.join(__dirname, '..', '..', 'config', 'FSColorThemeDarkColorBlind.json')
]

export async function updateSyntaxHighlighting() {
  const COLORS = getConfig("syntax.colors")
  const OPERATORS: string[] = getConfig("syntax.operators") || []

  const colorArray = Array.isArray(COLORS) && COLORS.length > 0
    ? COLORS
    : (() => {
      vscode.window.showErrorMessage(
        "⚠️  getConfig('syntax.colors') returned nothing or invalid format. Using default color palette."
      )
      return DEFAULT_COLORS
    })()

  const functionData = await fetchFunctionMetadata()
  const allFunctions: { fn: string; category: string }[] = []

  for (const fn of functionData) {
    const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`
    const category = fn.category || "uncategorized"
    allFunctions.push({ fn: name, category })

    if (Array.isArray(fn.aliases)) {
      fn.aliases.forEach(alias => {
        const aliasName = alias.startsWith("$") ? alias : `$${alias}`
        allFunctions.push({ fn: aliasName, category })
      })
    }
  }

  allFunctions.sort((a, b) => b.fn.length - a.fn.length)

  const categories = Array.from(new Set(allFunctions.map(f => f.category))).sort()
  const categoryColorMap: Record<string, string> = {}
  categories.forEach((cat, i) => categoryColorMap[cat] = colorArray[i % colorArray.length])

  function escapeForRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  const opsRegexParts = OPERATORS.map(op => op === "@[]" ? "@\\[[^\\]]*\\]" : escapeForRegex(op))
  const opsPattern = opsRegexParts.length > 0 ? `(?:${opsRegexParts.join("|")})?` : ""

  const patternsFinal = allFunctions.map(({ fn, category }) => {
    const base = fn.startsWith("$") ? fn.slice(1) : fn
    const escaped = escapeForRegex(base)
    return {
      match: `(?<!\\\\)\\$${opsPattern}(?i:${escaped})`,
      name: `${category}.function.fs`,
    }
  })

  for (const injectionPath of injectionPaths) {
    if (!fs.existsSync(injectionPath)) {
      console.error(`❌ injection.json not found at ${injectionPath}`)
      continue
    }

    const injectionJson = JSON.parse(fs.readFileSync(injectionPath, "utf-8"))
    const patterns = injectionJson.repository?.everything_fs?.patterns
    if (!patterns || !Array.isArray(patterns)) {
      console.error(`❌ Invalid injection.json structure at ${injectionPath}`)
      continue
    }

    injectionJson.repository.everything_fs.patterns = patterns.filter(
      (p: any) => !p.name?.endsWith(".function.fs") && p.name !== "functions.fs"
    )

    injectionJson.repository.everything_fs.patterns.push({
      name: "functions.fs",
      patterns: patternsFinal,
    })

    fs.writeFileSync(injectionPath, JSON.stringify(injectionJson, null, 2))
    console.log(`✅ Updated injection.json with ${allFunctions.length} functions at ${injectionPath}`)
  }

  for (const themePath of themePaths) {
    if (!fs.existsSync(themePath)) {
      console.error(`❌ Theme file not found at ${themePath}`)
      continue
    }

    const themeJson = JSON.parse(fs.readFileSync(themePath, "utf-8"))
    if (!Array.isArray(themeJson.tokenColors)) themeJson.tokenColors = []

    themeJson.tokenColors = themeJson.tokenColors.filter(
      (token: any) => !token.scope?.toString().endsWith(".function.fs")
    )

    const tokenColors = categories.map(category => ({
      name: `${category} function color`,
      scope: `${category}.function.fs`,
      settings: {
        foreground: categoryColorMap[category],
      },
    }))

    themeJson.tokenColors.push(...tokenColors)
    fs.writeFileSync(themePath, JSON.stringify(themeJson, null, 2))
    console.log(`✅ Updated theme.json with ${tokenColors.length} scopes at ${themePath}`)
  }
}

updateSyntaxHighlighting().catch((err) => {
  console.error("❌ Unexpected error:", err)
  process.exit(1)
})
