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
exports.typeCompletionItems = exports.completionItems = exports.functionsData = void 0;
exports.fetchFunctions = fetchFunctions;
exports.fetchEvents = fetchEvents;
const undici_1 = require("undici");
const vscode = __importStar(require("vscode"));
const utils_1 = require("./utils");
exports.functionsData = [];
exports.completionItems = [];
exports.typeCompletionItems = [];
const EXTENSIONS = [
    'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/functions.json',
    'https://raw.githubusercontent.com/tryforge/Forgecanvas/refs/heads/dev/metadata/functions.json'
];
async function fetchFunctions() {
    const urls = [
        'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/functions.json',
        ...EXTENSIONS
    ];
    const allFunctions = [];
    for (const url of urls) {
        const res = await (0, undici_1.fetch)(url);
        const json = await res.json();
        const source = (0, utils_1.getSourceName)(url);
        json.forEach(func => func._source = source);
        allFunctions.push(...json);
    }
    exports.functionsData = allFunctions;
    exports.completionItems = allFunctions.map((func) => {
        const kindMap = {
            'ForgeScript': vscode.CompletionItemKind.Function,
            'ForgeDB': vscode.CompletionItemKind.Module,
            'ForgeCanvas': vscode.CompletionItemKind.Interface
        };
        const item = new vscode.CompletionItem(func.name, kindMap[func._source ?? ''] || vscode.CompletionItemKind.Function);
        const name = func.name.replace('$', '');
        let snippet = name;
        if (func.brackets === true) {
            snippet += `[${(func.args || []).map((arg, i) => `\${${i + 1}:${arg.name}${arg.required ? '' : '?'}}`).join(';')}]`;
        }
        else if (func.brackets === false) {
            snippet += `[\${1:${(func.args || []).map((arg, i) => `\${${i + 1}:${arg.name}?}`).join(';')}}]`;
        }
        item.insertText = new vscode.SnippetString(snippet);
        item.detail = func.description;
        const argsList = func.args?.map(arg => `- \`${arg.name}\`${arg.required ? '' : ' _(optional)_'}: ${arg.description || ''}`).join('\n') || 'None';
        const doc = new vscode.MarkdownString(`### ${func.name}\n\n${func.description}\n\n**Package:** \`${func._source}\`\n**Version:** \`${func.version ?? 'unknown'}\`\n**Brackets:** \`${func.brackets === undefined ? 'none' : func.brackets ? 'required' : 'optional'}\`\n\n**Arguments:**\n${argsList}`);
        doc.isTrusted = true;
        item.documentation = doc;
        return item;
    });
}
async function fetchEvents() {
    const urls = [
        'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/events.json',
        'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/events.json'
    ];
    const allEvents = [];
    for (const url of urls) {
        const res = await (0, undici_1.fetch)(url);
        const json = await res.json();
        const source = (0, utils_1.getSourceName)(url);
        json.forEach(evt => evt._source = source);
        allEvents.push(...json);
    }
    exports.typeCompletionItems = allEvents.map(evt => {
        const item = new vscode.CompletionItem(evt.name, vscode.CompletionItemKind.Event);
        item.detail = evt.description;
        item.insertText = `"${evt.name}"`;
        item.documentation = new vscode.MarkdownString(`### ${evt.name}\n\n${evt.description ?? ''}\n\n**Package:** \`${evt._source}\`\n**Version:** \`${evt.version ?? 'unknown'}\``);
        return item;
    });
}
