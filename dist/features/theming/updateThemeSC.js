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
exports.updateSyntaxHighlightingSC = updateSyntaxHighlightingSC;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https_1 = __importDefault(require("https"));
const getConfig_1 = require("../config/getConfig");
const vscode = __importStar(require("vscode"));
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
                const base = fn.name.startsWith("$") ? fn.name : `$${fn.name}`;
                allFunctions.push(base);
                if (Array.isArray(fn.aliases)) {
                    fn.aliases.forEach((alias) => {
                        if (!alias)
                            return;
                        const aliasBase = alias.startsWith("$") ? alias : `$${alias}`;
                        allFunctions.push(aliasBase);
                    });
                }
                if (Array.isArray(fn.customFunctions)) {
                    fn.customFunctions.forEach((customFn) => {
                        if (!customFn.name)
                            return;
                        const customBase = customFn.name.startsWith("$") ? customFn.name : `$${customFn.name}`;
                        allFunctions.push(customBase);
                    });
                }
            });
            console.log(`✅ Fetched ${json.length} functions from ${url}`);
        }
        catch (err) {
            console.error(`❌ Failed to fetch ${url}:`, err);
        }
    }
    const customFuncs = (0, getConfig_1.getConfig)("customFunctions");
    if (customFuncs && typeof customFuncs === "object") {
        for (const key in customFuncs) {
            const func = customFuncs[key];
            if (func && typeof func === "object" && typeof func.name === "string") {
                if (func.name.includes("$")) {
                    vscode.window.showErrorMessage(`❌ Custom function "${func.name}" should not include "$" in the name.`);
                    continue;
                }
                allFunctions.push(`$${func.name}`);
            }
        }
    }
    return allFunctions;
}
const DEFAULT_SINGLE_COLOR = "#a87ffb";
async function updateSyntaxHighlightingSC() {
    const SINGLE_COLOR = (0, getConfig_1.getConfig)("syntax.singleColor") || DEFAULT_SINGLE_COLOR;
    const OPERATORS = (0, getConfig_1.getConfig)("syntax.operators") || [];
    const injectionPath = path.resolve(__dirname, "../../config/injection.json");
    const themePath = path.resolve(__dirname, "../../config/FSColorThemeDarkFlat.json");
    if (!fs.existsSync(injectionPath)) {
        console.error("❌ injection.json not found.");
        process.exit(1);
    }
    const injectionJson = JSON.parse(fs.readFileSync(injectionPath, "utf-8"));
    const patterns = injectionJson.repository?.everything_fs?.patterns;
    if (!patterns || !Array.isArray(patterns)) {
        console.error("❌ Invalid injection.json structure.");
        process.exit(1);
    }
    injectionJson.repository.everything_fs.patterns = patterns.filter((p) => !p.name?.endsWith(".function.fs") && p.name !== "functions.fs");
    const allFunctions = await getAllFunctions();
    allFunctions.sort((a, b) => b.length - a.length);
    function escapeForRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    const opsRegexParts = OPERATORS.map(op => {
        if (op === "@[]")
            return "@\\[[^\\]]*\\]";
        return escapeForRegex(op);
    });
    const opsPattern = opsRegexParts.length > 0 ? `(?:${opsRegexParts.join("|")})?` : "";
    const patternsFinal = allFunctions.map((fn) => {
        const base = fn.startsWith("$") ? fn.slice(1) : fn;
        const escaped = escapeForRegex(base);
        return {
            match: `(?<!\\\\)\\$${opsPattern}${escaped}`,
            name: "shared.function.fs"
        };
    });
    injectionJson.repository.everything_fs.patterns.push({
        name: "functions.fs",
        patterns: patternsFinal,
    });
    fs.writeFileSync(injectionPath, JSON.stringify(injectionJson, null, 2));
    console.log(`✅ injection.json updated with ${allFunctions.length} functions`);
    if (!fs.existsSync(themePath)) {
        console.error("❌ FSColorThemeDarkFlat.json not found.");
        process.exit(1);
    }
    const themeJson = JSON.parse(fs.readFileSync(themePath, "utf-8"));
    if (!Array.isArray(themeJson.tokenColors))
        themeJson.tokenColors = [];
    themeJson.tokenColors = themeJson.tokenColors.filter((token) => !token.scope?.toString().endsWith(".function.fs"));
    themeJson.tokenColors.push({
        name: "All function color",
        scope: "shared.function.fs",
        settings: { foreground: SINGLE_COLOR },
    });
    fs.writeFileSync(themePath, JSON.stringify(themeJson, null, 2));
    console.log(`✅ theme.json updated with single color for all function categories`);
}
updateSyntaxHighlightingSC().catch((err) => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
});
