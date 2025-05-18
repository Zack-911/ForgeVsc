import * as vscode from 'vscode';
import { fetchWithCache } from './fetchWithCache';
import { FunctionData, EventData } from './types';
import { getSourceName } from './utils';

export let functionsData: FunctionData[] = [];
export let completionItems: vscode.CompletionItem[] = [];
export let typeCompletionItems: vscode.CompletionItem[] = [];

const FUNCTION_URLS = [
  'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/functions.json',
  'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/functions.json',
  'https://raw.githubusercontent.com/tryforge/Forgecanvas/refs/heads/dev/metadata/functions.json'
];

const EVENT_URLS = [
  'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/events.json',
  'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/events.json'
];

const kindMap: Record<string, vscode.CompletionItemKind> = {
  'ForgeScript': vscode.CompletionItemKind.Function,
  'ForgeDB': vscode.CompletionItemKind.Module,
  'ForgeCanvas': vscode.CompletionItemKind.Interface
};

function isFunctionArray(data: unknown): data is FunctionData[] {
  return Array.isArray(data) && data.every(fn => typeof fn.name === 'string');
}

function isEventArray(data: unknown): data is EventData[] {
  return Array.isArray(data) && data.every(evt => typeof evt.name === 'string');
}

function normalizeSourceName(source: string): keyof typeof kindMap {
  const s = source.toLowerCase();
  if (s.includes('forgescript')) return 'ForgeScript';
  if (s.includes('forgedb')) return 'ForgeDB';
  if (s.includes('forgecanvas')) return 'ForgeCanvas';
  return 'ForgeScript'; // fallback default
}

export async function fetchFunctions(force: boolean = false): Promise<void> {
  const allFunctions: FunctionData[] = [];

  const fetches = FUNCTION_URLS.map(async (url) => {
    const name = url.split('/').slice(-3).join('_');
    const json = await fetchWithCache(url, `functions_${name}.json`, force);
    if (!isFunctionArray(json)) return;

    const rawSource = getSourceName(url);
    const source = normalizeSourceName(rawSource);

    json.forEach(func => func._source = source);
    allFunctions.push(...json);
  });

  await Promise.all(fetches);

  functionsData = allFunctions;

  completionItems = allFunctions.map((func) => {
    const item = new vscode.CompletionItem(
      func.name,
      kindMap[func._source ?? 'ForgeScript']
    );

    const name = func.name.replace('$', '');
    let snippet = name;

    if (func.brackets === true) {
      snippet += `[${(func.args || []).map((arg, i) =>
        `\${${i + 1}:${arg.name}${arg.required ? '' : '?'}}`
      ).join(';')}]`;
    } else if (func.brackets === false) {
      snippet += `[\${1:${(func.args || []).map((arg, i) =>
        `\${${i + 1}:${arg.name}?}`
      ).join(';')}}]`;
    }

    item.insertText = new vscode.SnippetString(snippet);

    const argsList = func.args?.map(arg =>
      `- \`${arg.name}\`${arg.required ? '' : ' _(optional)_'}: ${arg.description || ''}`
    ).join('\n') || 'None';

    const doc = new vscode.MarkdownString(
      `### ${func.name}\n\n${func.description}\n\n` +
      `**Package:** \`${func._source}\`\n` +
      `**Version:** \`${func.version ?? 'unknown'}\`\n` +
      `**Brackets:** \`${func.brackets === undefined ? 'none' : func.brackets ? 'required' : 'optional'}\`\n\n` +
      `**Arguments:**\n${argsList}`
    );

    doc.isTrusted = true;
    item.documentation = doc;

    return item;
  });
}

export async function fetchEvents(force: boolean = false): Promise<void> {
  const allEvents: EventData[] = [];

  const fetches = EVENT_URLS.map(async (url) => {
    const name = url.split('/').slice(-3).join('_');
    const json = await fetchWithCache(url, `events_${name}.json`, force);
    if (!isEventArray(json)) return;

    const rawSource = getSourceName(url);
    const source = normalizeSourceName(rawSource);

    json.forEach(evt => evt._source = source);
    allEvents.push(...json);
  });

  await Promise.all(fetches);

  typeCompletionItems = allEvents.map(evt => {
    const item = new vscode.CompletionItem(evt.name, vscode.CompletionItemKind.Event);
    item.insertText = `"${evt.name}"`;

    const doc = new vscode.MarkdownString(
      `### ${evt.name}\n\n${evt.description ?? ''}\n\n` +
      `**Package:** \`${evt._source}\`\n` +
      `**Version:** \`${evt.version ?? 'unknown'}\``
    );

    doc.isTrusted = true;
    item.documentation = doc;

    return item;
  });
}

export async function forceRefetchFunctions() {
  await fetchFunctions(true);
  await fetchEvents(true);
}