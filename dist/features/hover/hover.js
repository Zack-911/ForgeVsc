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
exports.registerHoverProvider = registerHoverProvider;
const vscode = __importStar(require("vscode"));
const functionLoader_1 = require("../utils/functionLoader");
function registerHoverProvider(context) {
    const supportedLanguages = ["forgescript", "javascript", "typescript"];
    const provider = vscode.languages.registerHoverProvider(supportedLanguages, {
        async provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position, /\$[a-zA-Z0-9_]+/);
            if (!range)
                return;
            const word = document.getText(range);
            if (!word.startsWith("$"))
                return;
            const metadata = await (0, functionLoader_1.fetchFunctionMetadata)();
            const fn = metadata.find(f => `$${f.name}` === word || f.name === word);
            if (!fn)
                return;
            const md = new vscode.MarkdownString(undefined);
            md.isTrusted = true;
            md.appendMarkdown(`**Function Details**\n`);
            md.appendMarkdown(`\n\`${word}\`\n\n`);
            if (fn.description) {
                md.appendMarkdown(`${fn.description}\n\n`);
            }
            if (fn.output) {
                const output = Array.isArray(fn.output) ? fn.output.join(", ") : fn.output;
                md.appendMarkdown(`**Returns:**\n${output}\n\n`);
            }
            if (Array.isArray(fn.args)) {
                md.appendMarkdown(`**Arguments (${fn.args.length}):**\n`);
                for (const arg of fn.args) {
                    const name = `\`${arg.name || "unknown"}\``;
                    const type = arg.type || "any";
                    const required = arg.required ? "(Required)" : "";
                    md.appendMarkdown(`- ${name} (${type}) ${required}\n`);
                }
                md.appendMarkdown("\n");
            }
            return new vscode.Hover(md, range);
        }
    });
    context.subscriptions.push(provider);
}
