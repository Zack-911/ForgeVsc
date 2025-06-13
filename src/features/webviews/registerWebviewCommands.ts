import * as vscode from "vscode";
import { openDocs } from "./openDocs";
import { openSlashCommand } from "./openSlashCommand";
import { openPermission } from "./openPermissionGenerator";

export function registerWebviewCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("forge.docs", openDocs),
    vscode.commands.registerCommand("forge.slashCommand", openSlashCommand),
    vscode.commands.registerCommand("forge.permission", openPermission)
  );
}
