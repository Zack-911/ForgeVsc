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
exports.registerBracketAndArgumentChecker = registerBracketAndArgumentChecker;
const vscode = __importStar(require("vscode"));
const functionLoader_1 = require("../utils/functionLoader");
const supportedLanguages = ["forgescript", "javascript", "typescript"];
function getTopLevelArgs(argString) {
    let args = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < argString.length; i++) {
        const char = argString[i];
        if (char === "[" && argString[i - 1] === "$")
            depth++;
        else if (char === "[")
            depth++;
        else if (char === "]")
            depth--;
        if (char === ";" && depth === 0) {
            args.push(current);
            current = "";
        }
        else {
            current += char;
        }
    }
    if (current.length > 0) {
        args.push(current);
    }
    return args.map((x) => x.trim());
}
async function registerBracketAndArgumentChecker(context) {
    const metadata = await (0, functionLoader_1.fetchFunctionMetadata)();
    const diagnosticsCollection = vscode.languages.createDiagnosticCollection("forgescript");
    async function runDiagnostics(document) {
        if (!supportedLanguages.includes(document.languageId))
            return;
        const diagnostics = [];
        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text;
            for (const fn of metadata) {
                const funcName = `$${fn.name}`;
                const pattern = new RegExp(`\\${funcName}\\[([^\\]]*?)\\]?`, "g");
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const [fullMatch, argText] = match;
                    const startIndex = match.index;
                    const endIndex = startIndex + fullMatch.length;
                    const range = new vscode.Range(new vscode.Position(lineIndex, startIndex), new vscode.Position(lineIndex, endIndex));
                    if (fn.brackets && !fullMatch.endsWith("]")) {
                        diagnostics.push(new vscode.Diagnostic(range, `Missing closing bracket for ${funcName}`, vscode.DiagnosticSeverity.Error));
                        continue;
                    }
                    if (!fn.brackets && fullMatch.endsWith("]")) {
                        diagnostics.push(new vscode.Diagnostic(range, `Function ${funcName} does not accept brackets`, vscode.DiagnosticSeverity.Error));
                        continue;
                    }
                    const userArgs = getTopLevelArgs(argText);
                    fn.args.forEach((arg, i) => {
                        const val = userArgs[i];
                        if (arg.required && (!val || val === "")) {
                            diagnostics.push(new vscode.Diagnostic(range, `Missing required argument: ${arg.name}`, vscode.DiagnosticSeverity.Error));
                        }
                    });
                    if (userArgs.length > fn.args.length && !fn.args.at(-1)?.rest) {
                        diagnostics.push(new vscode.Diagnostic(range, `Too many arguments for ${funcName}`, vscode.DiagnosticSeverity.Warning));
                    }
                }
            }
        }
        diagnosticsCollection.set(document.uri, diagnostics);
    }
    vscode.workspace.textDocuments.forEach(runDiagnostics);
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(runDiagnostics), vscode.workspace.onDidSaveTextDocument(runDiagnostics), vscode.workspace.onDidChangeTextDocument((e) => runDiagnostics(e.document)), diagnosticsCollection);
}
