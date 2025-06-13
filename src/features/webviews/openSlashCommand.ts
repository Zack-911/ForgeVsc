import * as vscode from "vscode";

export function openSlashCommand() {
  const panel = vscode.window.createWebviewPanel(
    "SlashCommandGenerator",
    "Slash Command Generator",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = `
    <style>body, html { margin: 0; padding: 0; height: 100%; }</style>
    <iframe src="https://tools.botforge.org/appbuilder" style="width:100%;height:100%;border:none;"></iframe>
  `;
}
