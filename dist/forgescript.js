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
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const init_1 = require("./features/config/init");
const updateThemeWatcher_1 = require("./features/theming/updateThemeWatcher");
const autocompleteFunctions_1 = require("./features/autocompletion/autocompleteFunctions");
const autocompleteEvents_1 = require("./features/autocompletion/autocompleteEvents");
const hover_1 = require("./features/hover/hover");
const signature_1 = require("./features/intellisense/signature");
const updateTheme_1 = require("./features/theming/updateTheme");
const argumentChecker_1 = require("./features/diagnostics/argumentChecker");
const registerWebviewCommands_1 = require("./features/webviews/registerWebviewCommands");
async function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('forge-vsc.initConfig', init_1.initForgeConfig));
    context.subscriptions.push(vscode.commands.registerCommand('forge-vsc.reloadSyntaxHighlighting', async () => {
        (0, updateTheme_1.updateSyntaxHighlighting)();
        const choice = await vscode.window.showInformationMessage('Syntax highlighting updated. Reload window for full effect?', 'Reload Now');
        if (choice === 'Reload Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    }));
    (0, updateThemeWatcher_1.registerSyntaxHighlightWatcher)(context);
    (0, hover_1.registerHoverProvider)(context);
    (0, signature_1.registerSignatureHelpProvider)(context);
    (0, argumentChecker_1.registerArgumentChecker)(context);
    (0, registerWebviewCommands_1.registerWebviewCommands)(context);
    const autocompleteFunctionProvider = vscode.languages.registerCompletionItemProvider([
        { language: 'javascript' },
        { language: 'typescript' }
    ], {
        async provideCompletionItems(document, position) {
            const line = document.lineAt(position).text.substring(0, position.character);
            const match = line.match(/\$(\w*)$/);
            if (!match)
                return undefined;
            const partial = match[1] || "";
            const items = await (0, autocompleteFunctions_1.getAutocompleteFunctionsItems)();
            return items.filter(item => item.label.startsWith(`$${partial}`));
        }
    }, '$');
    context.subscriptions.push(autocompleteFunctionProvider);
    const autocompleteEventProvider = vscode.languages.registerCompletionItemProvider([
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
    context.subscriptions.push(autocompleteEventProvider);
    console.log('🎉 Forge VSC Extension is now active!');
}
function deactivate() {
    console.log('👋 Forge VSC Extension has been deactivated.');
}
