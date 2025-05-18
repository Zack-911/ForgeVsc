"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCache = initCache;
exports.lastFetchTime = lastFetchTime;
exports.updateFetchTime = updateFetchTime;
exports.fetchWithCache = fetchWithCache;
const fs_1 = require("fs");
const path_1 = require("path");
const undici_1 = require("undici");
let globalContext;
function initCache(context) {
    globalContext = context;
}
function lastFetchTime() {
    return globalContext?.globalState.get('fs.lastFetch') ?? undefined;
}
function updateFetchTime() {
    globalContext?.globalState.update('fs.lastFetch', Date.now());
}
async function fetchWithCache(url, filename, force = false) {
    const storagePath = globalContext.globalStorageUri.fsPath;
    const cacheDir = (0, path_1.join)(storagePath, 'cache');
    const filePath = (0, path_1.join)(cacheDir, filename);
    if (!(0, fs_1.existsSync)(cacheDir))
        (0, fs_1.mkdirSync)(cacheDir, { recursive: true });
    if (!force && (0, fs_1.existsSync)(filePath)) {
        try {
            const data = JSON.parse((0, fs_1.readFileSync)(filePath, 'utf-8'));
            return data;
        }
        catch (err) {
            console.warn(`⚠️ Failed to read cache for ${filename}, refetching...`);
        }
    }
    const res = await (0, undici_1.fetch)(url);
    const json = await res.json();
    (0, fs_1.writeFileSync)(filePath, JSON.stringify(json, null, 2));
    return json;
}
