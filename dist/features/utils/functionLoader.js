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
            url: `https://raw.githubusercontent.com/${user}/${repo}/${ref}/metadata/functions.json`,
            extension: key
        };
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
    for (const { url, extension } of urls) {
        try {
            const fetched = await fetchJson(url);
            for (const fn of fetched) {
                const normalized = {
                    ...fn,
                    name: fn.name.startsWith("$") ? fn.name : `$${fn.name}`,
                    args: Array.isArray(fn.args) ? fn.args : [],
                    brackets: fn.brackets !== false,
                    extension
                };
                all.push(normalized);
                if (Array.isArray(fn.aliases)) {
                    for (const alias of fn.aliases) {
                        if (typeof alias === "string") {
                            all.push({
                                ...normalized,
                                name: alias.startsWith("$") ? alias : `$${alias}`,
                                aliases: undefined
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
                    description: typeof fn.description === "string" ? fn.description : "Custom function",
                    category: typeof fn.category === "string" ? fn.category : "custom",
                    args: Array.isArray(fn.args) ? fn.args : [],
                    brackets: fn.brackets !== false,
                    extension: "custom"
                };
                all.push(base);
                for (const alias of aliases) {
                    all.push({
                        ...base,
                        name: alias.startsWith("$") ? alias : `$${alias}`,
                        aliases: undefined
                    });
                }
            }
        }
    }
    return all;
}
