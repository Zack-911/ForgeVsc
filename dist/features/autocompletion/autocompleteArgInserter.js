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
exports.insertFunctionWithArgs = insertFunctionWithArgs;
const vscode = __importStar(require("vscode"));
const functionLoader_1 = require("../utils/functionLoader");
async function insertFunctionWithArgs() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const position = editor.selection.active;
    const document = editor.document;
    const line = document.lineAt(position.line).text;
    const textBeforeCursor = line.substring(0, position.character);
    // Extract function name from text before cursor (like $onlyIf)
    const match = /\$([a-zA-Z0-9_]+)$/.exec(textBeforeCursor);
    if (!match)
        return;
    const functionName = `$${match[1]}`;
    const metadata = await (0, functionLoader_1.fetchFunctionMetadata)();
    const fn = metadata.find(f => (f.name === functionName || `$${f.name}` === functionName));
    if (!fn)
        return;
    const insertArgs = (fn.args || []).map(arg => {
        const base = arg.name || "arg";
        const isOptional = !arg.required;
        const isRest = arg.rest === true;
        if (isRest && isOptional)
            return `...${base}?`;
        if (isRest)
            return `...${base}`;
        if (isOptional)
            return `${base}?`;
        return base;
    }).join(";");
    await editor.edit(editBuilder => {
        // Delete the function name typed so far and insert full snippet with brackets
        const startPos = position.with(position.line, position.character - match[0].length);
        editBuilder.delete(new vscode.Range(startPos, position));
        editBuilder.insert(startPos, `${functionName}[${insertArgs}]`);
    });
    // Move cursor inside the brackets, after first arg or at start if no args
    const newPos = editor.selection.active.with(position.line, position.character - match[0].length + functionName.length + 1);
    editor.selection = new vscode.Selection(newPos, newPos);
}
