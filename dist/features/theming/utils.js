"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJSON = fetchJSON;
exports.getAllFunctions = getAllFunctions;
const https_1 = __importDefault(require("https"));
const vscode = __importStar(require("vscode"));
const getConfig_1 = require("../config/getConfig");
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https_1.default.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (err) {
                    reject(`Error parsing JSON from ${url}: ${err}`);
                }
            });
        }).on("error", (err) => reject(`Error fetching ${url}: ${err}`));
    });
}
async function getAllFunctions() {
    const allFunctions = [];
    const urlConfig = (0, getConfig_1.getConfig)("urls");
    if (!urlConfig || typeof urlConfig !== "object") {
        vscode.window.showErrorMessage("❌ Invalid or missing 'urls' in config.json");
        return [];
    }
    const urls = Object.values(urlConfig).filter((u) => typeof u === "string");
    for (const url of urls) {
        try {
            const json = await fetchJSON(url);
            json.forEach((fn) => {
                if (!fn.name)
                    return;
                const mainName = fn.name.startsWith("$") ? fn.name : `$${fn.name}`;
                const category = fn.category || "uncategorized";
                allFunctions.push({ fn: mainName, category });
                if (Array.isArray(fn.aliases)) {
                    fn.aliases.forEach((alias) => {
                        if (!alias)
                            return;
                        const aliasName = alias.startsWith("$") ? alias : `$${alias}`;
                        allFunctions.push({ fn: aliasName, category });
                    });
                }
            });
            console.log(`✅ Fetched ${json.length} functions from ${url}`);
        }
        catch (err) {
            console.error(`❌ Failed to fetch ${url}:`, err);
        }
    }
    return allFunctions;
}
