import * as vscode from "vscode";

export function openDocs() {
  const panel = vscode.window.createWebviewPanel(
    "botforgeDocs",
    "BotForge Documentation",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = `
    <style>body, html { margin: 0; padding: 0; height: 100%; }</style>
    <iframe src="https://docs.botforge.org" style="width:100%;height:100%;border:none;"></iframe>
  `;
}
