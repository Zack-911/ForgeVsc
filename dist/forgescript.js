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
const fetchers_1 = require("./core/fetchers");
const completion_1 = require("./features/completion/completion");
const diagnostics_1 = require("./features/diagnostic/diagnostics");
let autoCompletionEnabled = true;
async function activate(context) {
    await (0, fetchers_1.fetchFunctions)();
    await (0, fetchers_1.fetchEvents)();
    const getStatus = () => autoCompletionEnabled;
    const [fsProvider, typeProvider] = (0, completion_1.registerCompletionProviders)(getStatus);
    const [diagnosticCheck, diagnosticCollection] = (0, diagnostics_1.registerDiagnostics)(getStatus);
    const enableCmd = vscode.commands.registerCommand('forgescript.enableAutocomplete', () => {
        autoCompletionEnabled = true;
        vscode.window.showInformationMessage('ForgeScript Autocomplete enabled');
    });
    const disableCmd = vscode.commands.registerCommand('forgescript.disableAutocomplete', () => {
        autoCompletionEnabled = false;
        vscode.window.showInformationMessage('ForgeScript Autocomplete disabled');
    });
    context.subscriptions.push(fsProvider, typeProvider, enableCmd, disableCmd, diagnosticCheck, diagnosticCollection);
}
function deactivate() { }
