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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSyntaxHighlighting = updateSyntaxHighlighting;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const getConfig_1 = require("../config/getConfig");
const functionLoader_1 = require("../utils/functionLoader");
const DEFAULT_COLORS = [
    "#a87ffb", "#b895fd", "#92A9FF", "#85CDF1", "#708fff", "#77D5A3",
    "#66ce98", "#FFD395", "#f7768e", "#fc8f8e", "#ffa23e", "#ffc26e",
    "#BD9CFE", "#c8aaff", "#9AC1F6", "#5A8CFF"
];
const injectionPaths = [
    path.join(__dirname, '..', '..', 'config', 'injection.json')
];
const themePaths = [
    path.join(__dirname, '..', '..', 'config', 'FSColorThemeDarkFlat.json'),
    path.join(__dirname, '..', '..', 'config', 'FSColorThemeDarkColorBlind.json')
];
async function updateSyntaxHighlighting() {
    const COLORS = (0, getConfig_1.getConfig)("syntax.colors");
    const OPERATORS = (0, getConfig_1.getConfig)("syntax.operators") || [];
    const colorArray = Array.isArray(COLORS) && COLORS.length > 0
        ? COLORS
        : (() => {
            vscode.window.showErrorMessage("⚠️  getConfig('syntax.colors') returned nothing or invalid format. Using default color palette.");
            return DEFAULT_COLORS;
        })();
    const functionData = await (0, functionLoader_1.fetchFunctionMetadata)();
    const allFunctions = [];
    for (const fn of functionData) {
        const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`;
        const category = fn.category || "uncategorized";
        allFunctions.push({ fn: name, category });
        if (Array.isArray(fn.aliases)) {
            fn.aliases.forEach(alias => {
                const aliasName = alias.startsWith("$") ? alias : `$${alias}`;
                allFunctions.push({ fn: aliasName, category });
            });
        }
    }
    allFunctions.sort((a, b) => b.fn.length - a.fn.length);
    const categories = Array.from(new Set(allFunctions.map(f => f.category))).sort();
    const categoryColorMap = {};
    categories.forEach((cat, i) => categoryColorMap[cat] = colorArray[i % colorArray.length]);
    function escapeForRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    const opsRegexParts = OPERATORS.map(op => op === "@[]" ? "@\\[[^\\]]*\\]" : escapeForRegex(op));
    const opsPattern = opsRegexParts.length > 0 ? `(?:${opsRegexParts.join("|")})?` : "";
    const patternsFinal = allFunctions.map(({ fn, category }) => {
        const base = fn.startsWith("$") ? fn.slice(1) : fn;
        const escaped = escapeForRegex(base);
        return {
            match: `(?<!\\\\)\\$${opsPattern}(?i:${escaped})`,
            name: `${category}.function.fs`,
        };
    });
    for (const injectionPath of injectionPaths) {
        if (!fs.existsSync(injectionPath)) {
            console.error(`❌ injection.json not found at ${injectionPath}`);
            continue;
        }
        const injectionJson = JSON.parse(fs.readFileSync(injectionPath, "utf-8"));
        const patterns = injectionJson.repository?.everything_fs?.patterns;
        if (!patterns || !Array.isArray(patterns)) {
            console.error(`❌ Invalid injection.json structure at ${injectionPath}`);
            continue;
        }
        injectionJson.repository.everything_fs.patterns = patterns.filter((p) => !p.name?.endsWith(".function.fs") && p.name !== "functions.fs");
        injectionJson.repository.everything_fs.patterns.push({
            name: "functions.fs",
            patterns: patternsFinal,
        });
        fs.writeFileSync(injectionPath, JSON.stringify(injectionJson, null, 2));
        console.log(`✅ Updated injection.json with ${allFunctions.length} functions at ${injectionPath}`);
    }
    for (const themePath of themePaths) {
        if (!fs.existsSync(themePath)) {
            console.error(`❌ Theme file not found at ${themePath}`);
            continue;
        }
        const themeJson = JSON.parse(fs.readFileSync(themePath, "utf-8"));
        if (!Array.isArray(themeJson.tokenColors))
            themeJson.tokenColors = [];
        themeJson.tokenColors = themeJson.tokenColors.filter((token) => !token.scope?.toString().endsWith(".function.fs"));
        const tokenColors = categories.map(category => ({
            name: `${category} function color`,
            scope: `${category}.function.fs`,
            settings: {
                foreground: categoryColorMap[category],
            },
        }));
        themeJson.tokenColors.push(...tokenColors);
        fs.writeFileSync(themePath, JSON.stringify(themeJson, null, 2));
        console.log(`✅ Updated theme.json with ${tokenColors.length} scopes at ${themePath}`);
    }
}
updateSyntaxHighlighting().catch((err) => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
});
