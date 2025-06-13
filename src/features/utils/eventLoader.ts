import https from "https"
import { getConfig } from "../config/getConfig"

export interface RawEvent {
  name: string
  version?: string
  description?: string
  intents?: string[]
  extension?: string
}

export async function fetchEventMetadata(): Promise<RawEvent[]> {
  const all: RawEvent[] = []

  const urlsConfig = getConfig("urls") || {}
  const urls = Object.entries(urlsConfig)
    .map(([key, value]) => {
      if (typeof value !== "string") return null
      const match = value.match(/^([^/#]+)\/([^#]+)#(.+)$/)
      if (!match) return null
      const [, user, repo, ref] = match
      return {
        url: `https://raw.githubusercontent.com/${user}/${repo}/${ref}/metadata/events.json`,
        extension: key
      }
    })
    .filter((v): v is { url: string; extension: string } => !!v)

  async function fetchJson(url: string): Promise<RawEvent[]> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data)
            resolve(Array.isArray(parsed) ? parsed : [])
          } catch (e) {
            reject(`❌ Failed to parse event metadata from ${url}: ${e}`)
          }
        })
      }).on("error", (err) => reject(`❌ Error fetching ${url}: ${err}`))
    })
  }

  for (const { url, extension } of urls) {
    try {
      const fetched = await fetchJson(url)
      for (const event of fetched) {
        const normalized: RawEvent = {
          name: event.name,
          description: event.description || "",
          version: event.version || "1.0.0",
          intents: Array.isArray(event.intents) ? event.intents : [],
          extension
        }
        all.push(normalized)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return all
}
