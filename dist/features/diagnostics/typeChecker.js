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
exports.runTypeDiagnostics = runTypeDiagnostics;
const vscode = __importStar(require("vscode"));
const functionLoader_1 = require("../utils/functionLoader");
function getTopLevelArgs(argString) {
    let args = [];
    let current = "";
    let depth = 0;
    for (let i = 0; i < argString.length; i++) {
        const char = argString[i];
        if (char === "[") {
            depth++;
            current += char;
        }
        else if (char === "]") {
            depth--;
            current += char;
        }
        else if (char === ";" && depth === 0) {
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
    return args;
}
function parseFunction(value, functionNames) {
    const escapedNames = functionNames.map(escapeRegex).join("|");
    const regex = new RegExp(`^(\\$(?:${escapedNames}))\\[((?:.|\\n)*?)\\]$`);
    const match = regex.exec(value.trim());
    if (!match)
        return null;
    const name = match[1];
    const args = getTopLevelArgs(match[2]);
    const range = [0, value.length];
    return { name, args, range };
}
function inferType(value) {
    const trimmed = value.trim();
    if (!isNaN(Number(trimmed)))
        return "number";
    if (trimmed === "true" || trimmed === "false")
        return "boolean";
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed))
            return "array";
        if (typeof parsed === "object")
            return "object";
    }
    catch { }
    return "string";
}
function resolveType(input, metadata) {
    const trimmed = input.trim();
    const functionNames = metadata.map(f => f.name.replace(/^\$/, ""));
    const nested = parseFunction(trimmed, functionNames);
    if (nested) {
        const fn = metadata.find(f => `$${f.name}` === nested.name || f.name === nested.name);
        const output = fn?.output;
        const outputType = Array.isArray(output) ? output[0] : output ?? "any";
        return typeof outputType === "string" ? normalizeType(outputType) : "any";
    }
    const fn = metadata.find(f => {
        const raw = f.name.startsWith("$") ? f.name : `$${f.name}`;
        return trimmed === raw;
    });
    if (fn) {
        const output = fn.output;
        const outputType = Array.isArray(output) ? output[0] : output ?? "any";
        return typeof outputType === "string" ? normalizeType(outputType) : "any";
    }
    return inferType(trimmed);
}
function normalizeType(type) {
    const t = type.toLowerCase();
    if (["unknown", "null", "undefined", "other", "string"].includes(t))
        return "any";
    return t;
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function runTypeDiagnostics(document, collection) {
    const diagnostics = [];
    const text = document.getText();
    const metadata = await (0, functionLoader_1.fetchFunctionMetadata)();
    const functionNames = metadata.map(f => f.name.replace(/^\$/, ""));
    const regex = new RegExp(`\\$(?:${functionNames.map(escapeRegex).join("|")})\\[[^\\[\\]]*(?:\\[[^\\[\\]]*\\][^\\[\\]]*)*\\]`, "g");
    let match;
    while ((match = regex.exec(text)) !== null) {
        const raw = match[0];
        const start = match.index;
        const end = match.index + raw.length;
        const parsed = parseFunction(raw, functionNames);
        if (!parsed)
            continue;
        const fn = metadata.find(f => {
            const base = f.name.startsWith("$") ? f.name : `$${f.name}`;
            return parsed.name === base;
        });
        if (!fn || !fn.args || !Array.isArray(fn.args))
            continue;
        for (let i = 0; i < parsed.args.length; i++) {
            const expected = normalizeType(fn.args[i]?.type ?? "any");
            const actual = resolveType(parsed.args[i].trim(), metadata);
            if (expected === "any" || actual === "any")
                continue;
            if (expected !== actual) {
                const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
                diagnostics.push(new vscode.Diagnostic(range, `Argument ${i + 1} of ${parsed.name} expects ${expected}, got ${actual}`, vscode.DiagnosticSeverity.Warning));
            }
        }
    }
    collection.set(document.uri, diagnostics);
}
