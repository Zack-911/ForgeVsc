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
exports.registerSyntaxHighlightWatcher = registerSyntaxHighlightWatcher;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const updateTheme_1 = require("./updateTheme");
function hasForgeConfig(workspacePath) {
    return fs.existsSync(path.join(workspacePath, '.vscode', 'forgevsc.config.json'));
}
function registerSyntaxHighlightWatcher(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders?.length)
        return;
    const workspacePath = workspaceFolders[0].uri.fsPath;
    if (!hasForgeConfig(workspacePath)) {
        vscode.window.showErrorMessage('❌ Missing .vscode/forgevsc.config.json. Use the init command to generate it.');
        return;
    }
    const watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/forgevsc.config.json');
    const onConfigChange = async () => {
        await (0, updateTheme_1.updateSyntaxHighlighting)();
        const choice = await vscode.window.showInformationMessage('Syntax highlighting updated. Reload window for full effect?', 'Reload Now');
        if (choice === 'Reload Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    };
    watcher.onDidCreate(onConfigChange);
    watcher.onDidChange(onConfigChange);
    context.subscriptions.push(watcher);
    context.subscriptions.push(vscode.commands.registerCommand('forgevsc.reloadSyntax', async () => {
        await (0, updateTheme_1.updateSyntaxHighlighting)();
        vscode.window.showInformationMessage('Syntax highlighting manually reloaded. Reload window for full effect.');
    }));
}
