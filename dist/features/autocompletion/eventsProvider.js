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
exports.registerEventCompletionProvider = registerEventCompletionProvider;
const vscode = __importStar(require("vscode"));
const autocompleteEvents_1 = require("./autocompleteEvents");
function registerEventCompletionProvider(context) {
    const provider = vscode.languages.registerCompletionItemProvider([
        { language: 'javascript' },
        { language: 'typescript' }
    ], {
        async provideCompletionItems(document, position) {
            const line = document.lineAt(position.line).text;
            const prefix = line.substring(0, position.character);
            const typeMatch = prefix.match(/type\s*:\s*["'`]([\w-]*)$/);
            const eventsArrayMatch = prefix.match(/events\s*:\s*\[\s*["'`]([\w-]*)$/);
            if (!typeMatch && !eventsArrayMatch)
                return undefined;
            const partial = (typeMatch?.[1] || eventsArrayMatch?.[1] || "").trim();
            const items = await (0, autocompleteEvents_1.getAutocompleteEventsItems)();
            return items.filter(item => item.label.startsWith(partial));
        }
    }, '"', "'", '`');
    context.subscriptions.push(provider);
}
