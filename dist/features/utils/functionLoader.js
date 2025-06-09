"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFunctionMetadata = fetchFunctionMetadata;
const https_1 = __importDefault(require("https"));
const getConfig_1 = require("../config/getConfig");
async function fetchFunctionMetadata() {
    const all = [];
    const rawUrls = Object.values((0, getConfig_1.getConfig)("urls") || {}).filter((v) => typeof v === "string");
    const urls = rawUrls
        .map((entry) => {
        const match = entry.match(/^([^/#]+)\/([^#]+)#(.+)$/);
        if (!match)
            return null;
        const [, user, repo, ref] = match;
        return `https://raw.githubusercontent.com/${user}/${repo}/${ref}/metadata/functions.json`;
    })
        .filter((v) => !!v);
    const customFuncs = (0, getConfig_1.getConfig)("customFunctions");
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
                        reject(`❌ Failed to parse metadata from ${url}: ${e}`);
                    }
                });
            }).on("error", (err) => reject(`❌ Error fetching ${url}: ${err}`));
        });
    }
    for (const url of urls) {
        try {
            const fetched = await fetchJson(url);
            for (const fn of fetched) {
                all.push(fn);
                if (Array.isArray(fn.aliases)) {
                    for (const alias of fn.aliases) {
                        if (typeof alias === "string") {
                            all.push({
                                ...fn,
                                name: alias,
                                aliases: undefined,
                            });
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    if (customFuncs && typeof customFuncs === "object") {
        for (const key in customFuncs) {
            const fn = customFuncs[key];
            if (fn && typeof fn === "object" && typeof fn.name === "string") {
                const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`;
                const rawAliases = fn.aliases;
                const aliases = typeof rawAliases === "string"
                    ? [rawAliases]
                    : Array.isArray(rawAliases)
                        ? rawAliases.filter(a => typeof a === "string")
                        : [];
                const base = {
                    name,
                    aliases,
                    description: fn.description || "Custom function",
                    category: fn.category || "custom",
                    args: fn.params || undefined,
                };
                all.push(base);
                for (const alias of aliases) {
                    all.push({
                        ...base,
                        name: alias,
                        aliases: undefined,
                    });
                }
            }
        }
    }
    return all;
}
