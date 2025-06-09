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
exports.initForgeConfig = initForgeConfig;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function initForgeConfig() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("❌ No workspace folder found.");
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const vscodeDir = path.join(workspacePath, '.vscode');
    const configPath = path.join(vscodeDir, 'forgevsc.config.json');
    const templatePath = path.join(__dirname, '..', '..', 'config', 'forgevsc.config.json');
    try {
        if (!fs.existsSync(templatePath)) {
            vscode.window.showErrorMessage(`❌ Template config not found at ${templatePath}`);
            return;
        }
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir);
            vscode.window.showInformationMessage('📁 Created `.vscode` directory');
        }
        fs.copyFileSync(templatePath, configPath);
        vscode.window.showInformationMessage('✅ forgevsc.config.json copied to .vscode folder');
    }
    catch (err) {
        vscode.window.showErrorMessage(`❌ Failed to initialize config: ${err.message}`);
    }
}
