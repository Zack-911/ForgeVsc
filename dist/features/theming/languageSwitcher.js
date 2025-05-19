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
exports.activate = activate;
exports.activateLanguageSwitcher = activateLanguageSwitcher;
const vscode = __importStar(require("vscode"));
function activate(context) {
    activateLanguageSwitcher(context);
}
function activateLanguageSwitcher(context) {
    function shouldSwitch(doc) {
        if (!['javascript', 'typescript'].includes(doc.languageId))
            return false;
        if (doc.languageId === 'fs')
            return false;
        const text = doc.getText();
        if (text.startsWith('// @forgescript'))
            return true;
        return false;
    }
    async function trySwitch(doc) {
        if (shouldSwitch(doc)) {
            await vscode.languages.setTextDocumentLanguage(doc, 'fs');
            console.log(`[ForgeScript] Language set to fs for ${doc.fileName}`);
        }
    }
    // Register events to watch file opening and changes
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(trySwitch), vscode.workspace.onDidChangeTextDocument(e => trySwitch(e.document)));
    // Check current file (e.g., when extension activates)
    if (vscode.window.activeTextEditor) {
        trySwitch(vscode.window.activeTextEditor.document);
    }
}
