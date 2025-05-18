import * as vscode from 'vscode';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fetch } from 'undici';

let globalContext: vscode.ExtensionContext;

export function initCache(context: vscode.ExtensionContext) {
  globalContext = context;
}

export function lastFetchTime(): number | undefined {
  return globalContext?.globalState.get('fs.lastFetch') ?? undefined;
}

export function updateFetchTime() {
  globalContext?.globalState.update('fs.lastFetch', Date.now());
}

export async function fetchWithCache(
  url: string,
  filename: string,
  force: boolean = false
): Promise<any> {
  const storagePath = globalContext.globalStorageUri.fsPath;
  const cacheDir = join(storagePath, 'cache');
  const filePath = join(cacheDir, filename);

  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  if (!force && existsSync(filePath)) {
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      return data;
    } catch (err) {
      console.warn(`⚠️ Failed to read cache for ${filename}, refetching...`);
    }
  }

  const res = await fetch(url);
  const json = await res.json();
  writeFileSync(filePath, JSON.stringify(json, null, 2));
  return json;
}