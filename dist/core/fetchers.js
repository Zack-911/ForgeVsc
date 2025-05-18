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
exports.forceRefetchFunctions = forceRefetchFunctions;
const vscode = __importStar(require("vscode"));
const fetchWithCache_1 = require("./fetchWithCache");
const utils_1 = require("./utils");
exports.functionsData = [];
exports.completionItems = [];
exports.typeCompletionItems = [];
const FUNCTION_URLS = [
    'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/functions.json',
    'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/functions.json',
    'https://raw.githubusercontent.com/tryforge/Forgecanvas/refs/heads/dev/metadata/functions.json'
];
const EVENT_URLS = [
    'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/events.json',
    'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/events.json'
];
const kindMap = {
    'ForgeScript': vscode.CompletionItemKind.Function,
    'ForgeDB': vscode.CompletionItemKind.Module,
    'ForgeCanvas': vscode.CompletionItemKind.Interface
};
function isFunctionArray(data) {
    return Array.isArray(data) && data.every(fn => typeof fn.name === 'string');
}
function isEventArray(data) {
    return Array.isArray(data) && data.every(evt => typeof evt.name === 'string');
}
function normalizeSourceName(source) {
    const s = source.toLowerCase();
    if (s.includes('forgescript'))
        return 'ForgeScript';
    if (s.includes('forgedb'))
        return 'ForgeDB';
    if (s.includes('forgecanvas'))
        return 'ForgeCanvas';
    return 'ForgeScript'; // fallback default
}
async function fetchFunctions(force = false) {
    const allFunctions = [];
    const fetches = FUNCTION_URLS.map(async (url) => {
        const name = url.split('/').slice(-3).join('_');
        const json = await (0, fetchWithCache_1.fetchWithCache)(url, `functions_${name}.json`, force);
        if (!isFunctionArray(json))
            return;
        const rawSource = (0, utils_1.getSourceName)(url);
        const source = normalizeSourceName(rawSource);
        json.forEach(func => func._source = source);
        allFunctions.push(...json);
    });
    await Promise.all(fetches);
    exports.functionsData = allFunctions;
    exports.completionItems = allFunctions.map((func) => {
        const item = new vscode.CompletionItem(func.name, kindMap[func._source ?? 'ForgeScript']);
        const name = func.name.replace('$', '');
        let snippet = name;
        if (func.brackets === true) {
            snippet += `[${(func.args || []).map((arg, i) => `\${${i + 1}:${arg.name}${arg.required ? '' : '?'}}`).join(';')}]`;
        }
        else if (func.brackets === false) {
            snippet += `[\${1:${(func.args || []).map((arg, i) => `\${${i + 1}:${arg.name}?}`).join(';')}}]`;
        }
        item.insertText = new vscode.SnippetString(snippet);
        const argsList = func.args?.map(arg => `- \`${arg.name}\`${arg.required ? '' : ' _(optional)_'}: ${arg.description || ''}`).join('\n') || 'None';
        const doc = new vscode.MarkdownString(`### ${func.name}\n\n${func.description}\n\n` +
            `**Package:** \`${func._source}\`\n` +
            `**Version:** \`${func.version ?? 'unknown'}\`\n` +
            `**Brackets:** \`${func.brackets === undefined ? 'none' : func.brackets ? 'required' : 'optional'}\`\n\n` +
            `**Arguments:**\n${argsList}`);
        doc.isTrusted = true;
        item.documentation = doc;
        return item;
    });
}
async function fetchEvents(force = false) {
    const allEvents = [];
    const fetches = EVENT_URLS.map(async (url) => {
        const name = url.split('/').slice(-3).join('_');
        const json = await (0, fetchWithCache_1.fetchWithCache)(url, `events_${name}.json`, force);
        if (!isEventArray(json))
            return;
        const rawSource = (0, utils_1.getSourceName)(url);
        const source = normalizeSourceName(rawSource);
        json.forEach(evt => evt._source = source);
        allEvents.push(...json);
    });
    await Promise.all(fetches);
    exports.typeCompletionItems = allEvents.map(evt => {
        const item = new vscode.CompletionItem(evt.name, vscode.CompletionItemKind.Event);
        item.insertText = `"${evt.name}"`;
        const doc = new vscode.MarkdownString(`### ${evt.name}\n\n${evt.description ?? ''}\n\n` +
            `**Package:** \`${evt._source}\`\n` +
            `**Version:** \`${evt.version ?? 'unknown'}\``);
        doc.isTrusted = true;
        item.documentation = doc;
        return item;
    });
}
async function forceRefetchFunctions() {
    await fetchFunctions(true);
    await fetchEvents(true);
}
