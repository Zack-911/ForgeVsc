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
exports.activateLanguageSwitcher = activateLanguageSwitcher;
const vscode = __importStar(require("vscode"));
const ts = __importStar(require("typescript"));
const LSwitcherUtils_1 = require("./LSwitcherUtils");
function activateLanguageSwitcher(context) {
    function shouldSwitch(doc) {
        const { enableCommentDetection, enableObjectDetection, enableKeyDetection } = (0, LSwitcherUtils_1.getConfig)();
        if (!['javascript', 'typescript'].includes(doc.languageId))
            return false;
        if (doc.languageId === 'fs')
            return false;
        if ((0, LSwitcherUtils_1.isDisabled)(doc))
            return false;
        const text = doc.getText();
        if (enableCommentDetection && text.startsWith('// @forgescript'))
            return true;
        if (enableObjectDetection || enableKeyDetection) {
            try {
                const source = ts.createSourceFile(doc.fileName, text, ts.ScriptTarget.Latest, true);
                for (const stmt of source.statements) {
                    if (ts.isExportAssignment(stmt) && ts.isObjectLiteralExpression(stmt.expression)) {
                        const props = stmt.expression.properties.map(p => p.name?.getText().toLowerCase() || '');
                        if (props.includes('code')) {
                            if (enableKeyDetection && (props.includes('type') || props.includes('data')))
                                return true;
                            if (enableObjectDetection && !(props.includes('type') || props.includes('data')))
                                return true;
                        }
                    }
                }
            }
            catch { }
        }
        return false;
    }
    async function trySwitch(doc) {
        if (shouldSwitch(doc)) {
            await vscode.languages.setTextDocumentLanguage(doc, 'fs');
            console.log(`[ForgeScript] Language set to fs for ${doc.fileName}`);
        }
    }
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(trySwitch), vscode.workspace.onDidChangeTextDocument(e => trySwitch(e.document)));
    if (vscode.window.activeTextEditor)
        trySwitch(vscode.window.activeTextEditor.document);
    context.subscriptions.push(vscode.commands.registerCommand('forgescript.configureLanguageDetection', async () => {
        const doc = vscode.window.activeTextEditor?.document;
        const root = doc ? vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath : undefined;
        const cfg = (0, LSwitcherUtils_1.getConfig)();
        const options = [
            { label: 'Toggle //@forgescript comment', key: 'enableCommentDetection' },
            { label: 'Toggle object detection (module.exports)', key: 'enableObjectDetection' },
            { label: 'Toggle type/code/data detection', key: 'enableKeyDetection' },
            { label: 'Enable all detection', key: 'enableAll' },
            { label: 'Disable all detection', key: 'disableAll' },
            { label: 'Toggle detection for this file', key: 'file' },
            { label: 'Toggle detection for this project', key: 'project' },
            { label: 'Toggle global switcher', key: 'global' }
        ];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select a detection toggle',
        });
        if (!selection)
            return;
        switch (selection.key) {
            case 'enableAll':
                (0, LSwitcherUtils_1.updateConfig)({
                    enableCommentDetection: true,
                    enableObjectDetection: true,
                    enableKeyDetection: true
                }).then(() => vscode.window.showInformationMessage('ForgeScript: All detection enabled.'));
                break;
            case 'disableAll':
                (0, LSwitcherUtils_1.updateConfig)({
                    enableCommentDetection: false,
                    enableObjectDetection: false,
                    enableKeyDetection: false
                }).then(() => vscode.window.showInformationMessage('ForgeScript: All detection disabled.'));
                break;
            case 'global':
                (0, LSwitcherUtils_1.updateConfig)({ disableAll: !cfg.disableAll }).then(() => vscode.window.showInformationMessage(`ForgeScript: Global switcher ${cfg.disableAll ? 'enabled' : 'disabled'}.`));
                break;
            case 'file':
                if (!doc)
                    return;
                const filePath = doc.uri.fsPath;
                const isFileDisabled = cfg.disabledFiles.includes(filePath);
                const newFileList = isFileDisabled
                    ? cfg.disabledFiles.filter(f => f !== filePath)
                    : [...cfg.disabledFiles, filePath];
                (0, LSwitcherUtils_1.updateConfig)({ disabledFiles: newFileList }).then(() => vscode.window.showInformationMessage(`ForgeScript: File detection ${isFileDisabled ? 'enabled' : 'disabled'}.`));
                break;
            case 'project':
                if (!root)
                    return;
                const isProjectDisabled = cfg.disabledProjects.includes(root);
                const newProjectList = isProjectDisabled
                    ? cfg.disabledProjects.filter(p => p !== root)
                    : [...cfg.disabledProjects, root];
                (0, LSwitcherUtils_1.updateConfig)({ disabledProjects: newProjectList }).then(() => vscode.window.showInformationMessage(`ForgeScript: Project detection ${isProjectDisabled ? 'enabled' : 'disabled'}.`));
                break;
            default: {
                const key = selection.key;
                const newVal = !cfg[key];
                (0, LSwitcherUtils_1.updateConfig)({ [key]: newVal }).then(() => vscode.window.showInformationMessage(`ForgeScript: ${selection.label} ${newVal ? 'enabled' : 'disabled'}.`));
            }
        }
    }));
}
