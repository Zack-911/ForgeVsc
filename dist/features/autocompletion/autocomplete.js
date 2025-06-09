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
exports.getAutocompleteItems = getAutocompleteItems;
const vscode = __importStar(require("vscode"));
const functionLoader_1 = require("../utils/functionLoader");
async function getAutocompleteItems() {
    const items = [];
    const metadata = await (0, functionLoader_1.fetchFunctionMetadata)();
    for (const fn of metadata) {
        if (!fn.name)
            continue;
        const name = fn.name.startsWith("$") ? fn.name : `$${fn.name}`;
        let insertText = name;
        const doc = new vscode.MarkdownString(undefined);
        doc.appendMarkdown(`${fn.description || "*No description*"}\n\n`);
        if (Array.isArray(fn.args) && fn.args.length > 0) {
            doc.appendMarkdown(`**Arguments:**\n`);
            fn.args.forEach(arg => {
                const name = arg.name || "arg";
                const type = arg.type || "any";
                const isRequired = arg.required === true;
                doc.appendMarkdown(`- \`${name}\` (${type})${isRequired ? " (req)" : ""}\n`);
            });
        }
        if (fn.output?.length) {
            doc.appendMarkdown(`\nReturns: ${fn.output.join(", ")}\n`);
        }
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
        item.insertText = insertText;
        item.detail = name;
        item.documentation = doc;
        items.push(item);
    }
    return items;
}
