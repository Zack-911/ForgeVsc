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
exports.getAutocompleteFunctionsItems = getAutocompleteFunctionsItems;
const vscode = __importStar(require("vscode"));
const getConfig_1 = require("../config/getConfig");
const functionLoader_1 = require("../utils/functionLoader");
async function getAutocompleteFunctionsItems() {
    const items = [];
    const metadata = await (0, functionLoader_1.fetchFunctionMetadata)();
    const urls = (0, getConfig_1.getConfig)("urls") || {};
    const extensions = [...Object.keys(urls), "custom"];
    const iconPool = [
        vscode.CompletionItemKind.Function,
        vscode.CompletionItemKind.Interface,
        vscode.CompletionItemKind.Module,
        vscode.CompletionItemKind.Class,
        vscode.CompletionItemKind.Struct,
        vscode.CompletionItemKind.Constant,
        vscode.CompletionItemKind.Variable,
        vscode.CompletionItemKind.Color,
        vscode.CompletionItemKind.Property,
        vscode.CompletionItemKind.Field,
        vscode.CompletionItemKind.Unit,
        vscode.CompletionItemKind.Method,
        vscode.CompletionItemKind.Value
    ];
    const kindMap = {};
    for (let i = 0; i < extensions.length; i++) {
        const ext = extensions[i];
        kindMap[ext] = iconPool[i % iconPool.length];
    }
    for (const fn of metadata) {
        if (!fn.name)
            continue;
        const hasRequiredArg = fn.args?.some(arg => arg.required) ?? false;
        const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`;
        const insertText = hasRequiredArg ? `${name}[` : name;
        const doc = new vscode.MarkdownString(undefined);
        doc.isTrusted = true;
        doc.appendMarkdown(`${fn.description || "*No description*"}\n\n`);
        if (Array.isArray(fn.args) && fn.args.length > 0) {
            doc.appendMarkdown(`**Arguments:**\n\n`);
            const rows = [
                ["Name", "Type", "Required", "Rest"],
                ["-----", "----", "--------", "----"]
            ];
            for (const arg of fn.args) {
                const name = arg.name || "arg";
                const type = arg.type || "any";
                const required = arg.required ? "✅" : "❌";
                const rest = arg.rest ? "✅" : "❌";
                rows.push([name, type, required, rest]);
            }
            const colWidths = rows[0].map((_, i) => Math.max(...rows.map(row => row[i].length)));
            const formatted = rows.map(row => row.map((cell, i) => cell.padEnd(colWidths[i])).join(" | "));
            const block = "```txt\n" + formatted.join("\n") + "\n```\n";
            doc.appendMarkdown(block);
        }
        if (fn.output?.length) {
            const output = Array.isArray(fn.output) ? fn.output.join(", ") : fn.output;
            doc.appendMarkdown(`**Returns:** ${output}\n`);
        }
        const kind = kindMap[fn.extension ?? "custom"] ?? vscode.CompletionItemKind.Value;
        const item = new vscode.CompletionItem(name, kind);
        item.insertText = insertText;
        item.detail = name;
        item.documentation = doc;
        items.push(item);
    }
    return items;
}
