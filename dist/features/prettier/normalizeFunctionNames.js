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
exports.registerFunctionNameNormalizer = registerFunctionNameNormalizer;
const vscode = __importStar(require("vscode"));
const parser_1 = require("../utils/parser");
const functionLoader_1 = require("../utils/functionLoader");
const getConfig_1 = require("../config/getConfig");
function findOfficialPrefix(name, allMetadata) {
    const lower = name.toLowerCase();
    const exact = allMetadata.find(m => m.name.toLowerCase() === `$${lower}` ||
        m.aliases?.some(alias => alias.toLowerCase() === `$${lower}`));
    if (exact)
        return exact.name.slice(1);
    const sortedMetadata = [...allMetadata].sort((a, b) => {
        const aLen = a.name.slice(1).length;
        const bLen = b.name.slice(1).length;
        return bLen - aLen;
    });
    for (const m of sortedMetadata) {
        const base = m.name.slice(1).toLowerCase();
        if (lower.startsWith(base))
            return m.name.slice(1);
        const aliasMatch = m.aliases?.find(alias => {
            const aliasBase = alias.startsWith("$") ? alias.slice(1) : alias;
            return lower.startsWith(aliasBase.toLowerCase());
        });
        if (aliasMatch)
            return m.name.slice(1);
    }
    return null;
}
function fixFunctionNamesInText(text, allMetadata) {
    const parsed = (0, parser_1.parseExpression)(text);
    let offset = 0;
    let updatedText = text;
    let changed = false;
    function normalizeFunc(func) {
        if (func.escaped || !func.range)
            return;
        const originalName = func.name;
        const officialPrefix = findOfficialPrefix(originalName, allMetadata);
        if (!officialPrefix)
            return;
        const lowerOfficial = officialPrefix.toLowerCase();
        const lowerOriginal = originalName.toLowerCase();
        if (!lowerOriginal.startsWith(lowerOfficial))
            return;
        const suffix = originalName.slice(lowerOfficial.length);
        const corrected = officialPrefix + suffix;
        const nameStart = func.range.start + offset;
        const nameEnd = func.range.end + offset;
        const current = updatedText.slice(nameStart, nameEnd);
        if (current !== corrected) {
            updatedText =
                updatedText.slice(0, nameStart) +
                    corrected +
                    updatedText.slice(nameEnd);
            offset += corrected.length - (nameEnd - nameStart);
            changed = true;
        }
    }
    function walk(funcs) {
        for (const func of funcs) {
            normalizeFunc(func);
            for (const arg of func.insides || []) {
                if (typeof arg === "object" && arg.name) {
                    walk([arg]);
                }
                if (Array.isArray(arg)) {
                    walk(arg.filter(e => typeof e === "object" && e.name));
                }
            }
        }
    }
    walk(parsed);
    return { updatedText, hasChanges: changed };
}
async function registerFunctionNameNormalizer(context) {
    const allMetadata = await (0, functionLoader_1.fetchFunctionMetadata)();
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(async (e) => {
        if (!(0, getConfig_1.getConfig)("Prettier"))
            return;
        const document = e.document;
        const text = document.getText();
        const { updatedText, hasChanges } = fixFunctionNamesInText(text, allMetadata);
        if (!hasChanges)
            return;
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
        const edit = vscode.TextEdit.replace(fullRange, updatedText);
        e.waitUntil(Promise.resolve([edit]));
    }));
}
