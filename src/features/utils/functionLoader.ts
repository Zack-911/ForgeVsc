import https from "https"
import { getConfig } from "../config/getConfig"

export interface RawFunction {
  name: string
  aliases?: string[]
  version?: string
  description?: string
  category?: string
  output?: string[]
  args: {
    name: string
    description?: string
    type?: string
    required?: boolean
    rest?: boolean
  }[]
  example?: string
  documentation?: string
  brackets?: boolean
}

export async function fetchFunctionMetadata(): Promise<RawFunction[]> {
  const all: RawFunction[] = []

  const rawUrls = Object.values(getConfig("urls") || {}).filter((v): v is string => typeof v === "string")
  const urls = rawUrls
    .map((entry) => {
      const match = entry.match(/^([^/#]+)\/([^#]+)#(.+)$/)
      if (!match) return null
      const [, user, repo, ref] = match
      return `https://raw.githubusercontent.com/${user}/${repo}/${ref}/metadata/functions.json`
    })
    .filter((v): v is string => !!v)

  const customFuncs = getConfig("customFunctions")

  async function fetchJson(url: string): Promise<RawFunction[]> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data)
            resolve(Array.isArray(parsed) ? parsed : [])
          } catch (e) {
            reject(`❌ Failed to parse metadata from ${url}: ${e}`)
          }
        })
      }).on("error", (err) => reject(`❌ Error fetching ${url}: ${err}`))
    })
  }

  for (const url of urls) {
    try {
      const fetched = await fetchJson(url)
      for (const fn of fetched) {
        const normalized: RawFunction = {
          ...fn,
          name: fn.name.startsWith("$") ? fn.name : `$${fn.name}`,
          args: Array.isArray(fn.args) ? fn.args : [],
          brackets: fn.brackets !== false,
        }
        all.push(normalized)

        if (Array.isArray(fn.aliases)) {
          for (const alias of fn.aliases) {
            if (typeof alias === "string") {
              all.push({
                ...normalized,
                name: alias.startsWith("$") ? alias : `$${alias}`,
                aliases: undefined,
              })
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (customFuncs && typeof customFuncs === "object") {
    for (const key in customFuncs) {
      const fn = customFuncs[key]
      if (fn && typeof fn === "object" && typeof fn.name === "string") {
        const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`
        const rawAliases = fn.aliases
        const aliases: string[] = typeof rawAliases === "string"
          ? [rawAliases]
          : Array.isArray(rawAliases)
            ? rawAliases.filter(a => typeof a === "string")
            : []

        const base: RawFunction = {
          name,
          aliases,
          description: fn.description || "Custom function",
          category: fn.category || "custom",
          args: Array.isArray(fn.params) ? fn.params : [],
          brackets: fn.brackets !== false,
        }

        all.push(base)
        for (const alias of aliases) {
          all.push({
            ...base,
            name: alias.startsWith("$") ? alias : `$${alias}`,
            aliases: undefined,
          })
        }
      }
    }
  }

  return all
}