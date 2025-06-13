import * as vscode from "vscode";
import { openDocs } from "./openDocs";
import { openSlashCommand } from "./openSlashCommand";
import { openPermission } from "./openPermissionGenerator";
import { openIndexGen } from "./openIndexGen";

export function registerWebviewCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("forge.docs", openDocs),
    vscode.commands.registerCommand("forge.slashCommand", openSlashCommand),
    vscode.commands.registerCommand("forge.permission", openPermission),
    vscode.commands.registerCommand("forge.indexGen", openIndexGen)
  );
}
