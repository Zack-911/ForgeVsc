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
exports.registerArgumentChecker = registerArgumentChecker;
const vscode = __importStar(require("vscode"));
const functionLoader_1 = require("../utils/functionLoader");
const parser_1 = require("../utils/parser");
const getConfig_1 = require("../config/getConfig");
const supportedLanguages = ["forgescript", "javascript", "typescript"];
let allMetadata = [];
function hasForgeCode(text) {
    return /code\s*:\s*[`'"]/.test(text);
}
function validateFunction(func, meta, document, blockOffset, diagnostics, blockText) {
    if (func.escaped)
        return;
    const rangeStart = blockOffset + func.rangeInBlock.start;
    const rangeEnd = blockOffset + func.rangeInBlock.end;
    const range = new vscode.Range(document.positionAt(rangeStart), document.positionAt(rangeEnd));
    const realArgs = func.insides;
    const argDefs = meta.args ?? [];
    const hasBrackets = func.raw.includes("[") && func.raw.endsWith("]");
    const shouldEnforceArgs = meta.brackets || hasBrackets;
    if (argDefs.length === 0 && hasBrackets) {
        diagnostics.push(new vscode.Diagnostic(range, `Function $${func.name} cannot have brackets because it takes no arguments.`, vscode.DiagnosticSeverity.Error));
        return;
    }
    if (meta.brackets && argDefs.some(arg => arg.required) && !hasBrackets) {
        diagnostics.push(new vscode.Diagnostic(range, `Function $${func.name} requires brackets because it has required arguments.`, vscode.DiagnosticSeverity.Error));
        return;
    }
    if (shouldEnforceArgs) {
        const realArgCount = func.argCount;
        const maxArgs = argDefs.length;
        const hasRest = argDefs.at(-1)?.rest ?? false;
        let requiredCount = 0;
        for (const arg of argDefs) {
            if (arg.required)
                requiredCount++;
            else
                break;
        }
        if (realArgCount < requiredCount) {
            diagnostics.push(new vscode.Diagnostic(range, `Function $${func.name} requires at least ${requiredCount} argument(s), but got ${realArgCount}.`, vscode.DiagnosticSeverity.Error));
        }
        if (realArgCount > maxArgs && !hasRest) {
            diagnostics.push(new vscode.Diagnostic(range, `Function $${func.name} received ${realArgCount} argument(s), but only ${maxArgs} expected.`, vscode.DiagnosticSeverity.Error));
        }
        for (let i = 0; i < argDefs.length; i++) {
            const metaArg = argDefs[i];
            const realArg = realArgs[i];
            const isEmpty = realArg === undefined || realArg === null || realArg === "" || (typeof realArg === "string" && realArg.trim() === "");
            if (metaArg.required && isEmpty) {
                diagnostics.push(new vscode.Diagnostic(range, `Missing required argument: ${metaArg.name}`, vscode.DiagnosticSeverity.Error));
            }
        }
    }
    for (const arg of realArgs) {
        if (typeof arg === "object") {
            if (Array.isArray(arg)) {
                for (const sub of arg) {
                    if (typeof sub === "object" && "name" in sub) {
                        const subMeta = allMetadata.find(m => m.name === `$${sub.name}` || m.aliases?.includes(`$${sub.name}`));
                        if (subMeta)
                            validateFunction(sub, subMeta, document, blockOffset, diagnostics, blockText);
                    }
                }
            }
            else if ("name" in arg) {
                const subMeta = allMetadata.find(m => m.name === `$${arg.name}` || m.aliases?.includes(`$${arg.name}`));
                if (subMeta)
                    validateFunction(arg, subMeta, document, blockOffset, diagnostics, blockText);
            }
        }
    }
}
function findMetadata(name) {
    const lower = name.toLowerCase();
    return allMetadata.find(m => m.name.toLowerCase() === `$${lower}` ||
        m.aliases?.some(alias => alias.toLowerCase() === `$${lower}`));
}
async function registerArgumentChecker(context) {
    allMetadata = await (0, functionLoader_1.fetchFunctionMetadata)();
    const diagnosticsCollection = vscode.languages.createDiagnosticCollection("forgescript");
    async function runDiagnostics(document) {
        if (!supportedLanguages.includes(document.languageId))
            return;
        if (!(0, getConfig_1.getConfig)("enabled"))
            return;
        if (!(0, getConfig_1.getConfig)("diagnosticsEnabled"))
            return;
        const text = document.getText();
        if (!hasForgeCode(text)) {
            diagnosticsCollection.set(document.uri, []);
            return;
        }
        const diagnostics = [];
        try {
            const functions = (0, parser_1.parseExpression)(text);
            const validFunctions = functions.filter(func => findMetadata(func.name));
            if (validFunctions.length === 0) {
                diagnosticsCollection.set(document.uri, []);
                return;
            }
            for (const func of validFunctions) {
                const meta = findMetadata(func.name);
                if (meta)
                    validateFunction(func, meta, document, 0, diagnostics, text);
            }
        }
        catch (err) {
            const error = err;
            const position = document.positionAt(error.pos ?? 0);
            diagnostics.push(new vscode.Diagnostic(new vscode.Range(position, position), `Parse error: ${error.message}`, vscode.DiagnosticSeverity.Error));
        }
        diagnosticsCollection.set(document.uri, diagnostics);
    }
    let debounceTimer = null;
    function scheduleDiagnostics(document) {
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => runDiagnostics(document), 1000);
    }
    vscode.workspace.textDocuments.forEach(runDiagnostics);
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(runDiagnostics), vscode.workspace.onDidSaveTextDocument(runDiagnostics), vscode.workspace.onDidChangeTextDocument(e => scheduleDiagnostics(e.document)), diagnosticsCollection);
}
