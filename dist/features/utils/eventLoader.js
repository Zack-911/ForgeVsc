"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEventMetadata = fetchEventMetadata;
const https_1 = __importDefault(require("https"));
const getConfig_1 = require("../config/getConfig");
async function fetchEventMetadata() {
    const all = [];
    const urlsConfig = (0, getConfig_1.getConfig)("urls") || {};
    const urls = Object.entries(urlsConfig)
        .map(([key, value]) => {
        if (typeof value !== "string")
            return null;
        const match = value.match(/^([^/#]+)\/([^#]+)#(.+)$/);
        if (!match)
            return null;
        const [, user, repo, ref] = match;
        return {
            url: `https://raw.githubusercontent.com/${user}/${repo}/${ref}/metadata/events.json`,
            extension: key
        };
    })
        .filter((v) => !!v);
    async function fetchJson(url) {
        return new Promise((resolve, reject) => {
            https_1.default.get(url, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(Array.isArray(parsed) ? parsed : []);
                    }
                    catch (e) {
                        reject(`❌ Failed to parse event metadata from ${url}: ${e}`);
                    }
                });
            }).on("error", (err) => reject(`❌ Error fetching ${url}: ${err}`));
        });
    }
    for (const { url, extension } of urls) {
        try {
            const fetched = await fetchJson(url);
            for (const event of fetched) {
                const normalized = {
                    name: event.name,
                    description: event.description || "",
                    version: event.version || "1.0.0",
                    intents: Array.isArray(event.intents) ? event.intents : [],
                    extension
                };
                all.push(normalized);
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    return all;
}
