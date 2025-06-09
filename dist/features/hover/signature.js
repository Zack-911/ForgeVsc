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
exports.registerSignatureHelpProvider = registerSignatureHelpProvider;
const vscode = __importStar(require("vscode"));
const functionLoader_1 = require("../utils/functionLoader");
function registerSignatureHelpProvider(context) {
    const supportedLanguages = ["forgescript", "javascript", "typescript"];
    const provider = vscode.languages.registerSignatureHelpProvider(supportedLanguages, {
        async provideSignatureHelp(document, position) {
            const line = document.lineAt(position.line).text;
            const textBeforeCursor = line.substring(0, position.character);
            const functionMatch = /\$([a-zA-Z0-9_]+)\[([^\]]*)$/.exec(textBeforeCursor);
            if (!functionMatch)
                return;
            const functionName = `$${functionMatch[1]}`;
            const argString = functionMatch[2];
            const argIndex = argString.split(";").length - 1;
            const metadata = await (0, functionLoader_1.fetchFunctionMetadata)();
            const fn = metadata.find(f => `$${f.name}` === functionName || f.name === functionName);
            if (!fn || !Array.isArray(fn.args))
                return;
            const sigHelp = new vscode.SignatureHelp();
            const sig = new vscode.SignatureInformation(`${functionName}[${fn.args.map(arg => `${arg.name}: ${arg.type || "any"}`).join("; ")}]`, fn.description || "");
            sig.parameters = fn.args.map(arg => {
                const desc = `${arg.name}\n${arg.description || "No description"}\n\nType: ${arg.type || "any"}\nRequired: ${arg.required ? "Yes" : "No"}`;
                return new vscode.ParameterInformation(`${arg.name}: ${arg.type || "any"}`, desc);
            });
            sigHelp.signatures = [sig];
            sigHelp.activeSignature = 0;
            sigHelp.activeParameter = Math.min(argIndex, fn.args.length - 1);
            return sigHelp;
        }
    }, {
        triggerCharacters: ["[", ";"],
        retriggerCharacters: ["[", ";"]
    });
    context.subscriptions.push(provider);
    const forceTrigger = vscode.window.onDidChangeTextEditorSelection(e => {
        const editor = e.textEditor;
        const pos = e.selections[0].active;
        const doc = editor.document;
        const line = doc.lineAt(pos.line).text;
        const before = line.substring(0, pos.character);
        const insideForgeCall = /\$[a-zA-Z0-9_]+\[[^\]]*\]?$/.test(before);
        if (insideForgeCall) {
            vscode.commands.executeCommand('editor.action.triggerParameterHints');
        }
    });
    context.subscriptions.push(forceTrigger);
}
