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
exports.getAutocompleteEventsItems = getAutocompleteEventsItems;
const vscode = __importStar(require("vscode"));
const getConfig_1 = require("../config/getConfig");
const eventLoader_1 = require("../utils/eventLoader");
async function getAutocompleteEventsItems() {
    const items = [];
    const metadata = await (0, eventLoader_1.fetchEventMetadata)();
    const urls = (0, getConfig_1.getConfig)("urls") || {};
    const extensions = Object.keys(urls);
    const iconPool = [
        vscode.CompletionItemKind.Event
    ];
    const kindMap = {};
    for (let i = 0; i < extensions.length; i++) {
        const ext = extensions[i];
        kindMap[ext] = iconPool[i % iconPool.length];
    }
    for (const ev of metadata) {
        if (!ev.name)
            continue;
        const doc = new vscode.MarkdownString(undefined);
        doc.appendMarkdown(`${ev.description || "*No description*"}\n\n`);
        if (ev.intents?.length) {
            doc.appendMarkdown(`**Required Intents:** ${ev.intents.join(", ")}\n`);
        }
        const kind = kindMap[ev.extension ?? "custom"] ?? vscode.CompletionItemKind.Event;
        const item = new vscode.CompletionItem(ev.name, kind);
        item.insertText = ev.name;
        item.detail = ev.name;
        item.documentation = doc;
        items.push(item);
    }
    return items;
}
