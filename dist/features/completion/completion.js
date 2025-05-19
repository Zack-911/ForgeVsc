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
exports.registerCompletionProviders = registerCompletionProviders;
const vscode = __importStar(require("vscode"));
const utils_1 = require("../../core/utils");
const fetchers_1 = require("../../core/fetchers");
function registerCompletionProviders(autoCompletionEnabledRef) {
    const fsProvider = vscode.languages.registerCompletionItemProvider(['fs'], {
        provideCompletionItems(document, position) {
            if (!autoCompletionEnabledRef())
                return;
            if (document.languageId === 'fs' || (0, utils_1.shouldProvideForJsTs)(document, position)) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.match(/\$[a-zA-Z0-9_]*$/))
                    return;
                return fetchers_1.completionItems;
            }
        }
    }, '$');
    const typeProvider = vscode.languages.registerCompletionItemProvider(['fs'], {
        provideCompletionItems(document, position) {
            if (!autoCompletionEnabledRef())
                return;
            if (document.languageId === 'fs' || (0, utils_1.shouldProvideForJsTs)(document, position)) {
                const line = document.lineAt(position).text;
                const prefix = line.substring(0, position.character);
                if (!/type\s*[:=]\s*["']?[a-zA-Z0-9_]*$/.test(prefix))
                    return;
                return fetchers_1.typeCompletionItems;
            }
        }
    }, '"', "'");
    return [fsProvider, typeProvider];
}
