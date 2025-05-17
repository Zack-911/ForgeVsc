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
exports.registerDiagnostics = registerDiagnostics;
const vscode = __importStar(require("vscode"));
const fetchers_1 = require("./core/fetchers");
function registerDiagnostics(autoCompletionEnabledRef) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('forgescript');
    const diagnosticCheck = vscode.workspace.onDidChangeTextDocument(event => {
        if (!autoCompletionEnabledRef())
            return;
        const document = event.document;
        if (!document.fileName.endsWith('.fs.js') && !document.fileName.endsWith('.fs.ts') && document.languageId !== 'fs')
            return;
        const text = document.getText();
        const diagnostics = [];
        for (const func of fetchers_1.functionsData) {
            if (!func.args || !func.brackets)
                continue;
            const required = func.args.filter(arg => arg.required).length;
            const total = func.args.length;
            const regex = new RegExp(`\\${func.name}\\[([^\\]]*)\\]`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const provided = match[1].split(';').filter(Boolean);
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                if (provided.length < required) {
                    diagnostics.push(new vscode.Diagnostic(new vscode.Range(start, end), `${func.name} is missing required parameters.`, vscode.DiagnosticSeverity.Error));
                }
                else if (provided.length > total) {
                    diagnostics.push(new vscode.Diagnostic(new vscode.Range(start, end), `${func.name} has too many parameters.`, vscode.DiagnosticSeverity.Error));
                }
            }
        }
        diagnosticCollection.set(document.uri, diagnostics);
    });
    return [diagnosticCheck, diagnosticCollection];
}
