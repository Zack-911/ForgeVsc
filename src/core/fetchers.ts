import { fetch } from 'undici';
import * as vscode from 'vscode';
import { FunctionData, EventData } from './types';
import { getSourceName } from './utils';

export let functionsData: FunctionData[] = [];
export let completionItems: vscode.CompletionItem[] = [];
export let typeCompletionItems: vscode.CompletionItem[] = [];

const EXTENSIONS = [
  'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/functions.json',
  'https://raw.githubusercontent.com/tryforge/Forgecanvas/refs/heads/dev/metadata/functions.json'
];

export async function fetchFunctions() {
  const urls = [
    'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/functions.json',
    ...EXTENSIONS
  ];

  const allFunctions: FunctionData[] = [];

  for (const url of urls) {
    const res = await fetch(url);
    const json = await res.json() as FunctionData[];
    const source = getSourceName(url);
    json.forEach(func => func._source = source);
    allFunctions.push(...json);
  }

  functionsData = allFunctions;

  completionItems = allFunctions.map((func) => {
    const kindMap: Record<string, vscode.CompletionItemKind> = {
      'ForgeScript': vscode.CompletionItemKind.Function,
      'ForgeDB': vscode.CompletionItemKind.Module,
      'ForgeCanvas': vscode.CompletionItemKind.Interface
    };

    const item = new vscode.CompletionItem(func.name, kindMap[func._source ?? ''] || vscode.CompletionItemKind.Function);
    const name = func.name.replace('$', '');
    let snippet = name;

    if (func.brackets === true) {
      snippet += `[${(func.args || []).map((arg, i) => `\${${i + 1}:${arg.name}${arg.required ? '' : '?'}}`).join(';')}]`;
    } else if (func.brackets === false) {
      snippet += `[\${1:${(func.args || []).map((arg, i) => `\${${i + 1}:${arg.name}?}`).join(';')}}]`;
    }

    item.insertText = new vscode.SnippetString(snippet);
    item.detail = func.description;
    const argsList = func.args?.map(arg => `- \`${arg.name}\`${arg.required ? '' : ' _(optional)_'}: ${arg.description || ''}`).join('\n') || 'None';
    const doc = new vscode.MarkdownString(`### ${func.name}\n\n${func.description}\n\n**Package:** \`${func._source}\`\n**Version:** \`${func.version ?? 'unknown'}\`\n**Brackets:** \`${func.brackets === undefined ? 'none' : func.brackets ? 'required' : 'optional'}\`\n\n**Arguments:**\n${argsList}`);
    doc.isTrusted = true;
    item.documentation = doc;
    return item;
  });
}

export async function fetchEvents() {
  const urls = [
    'https://raw.githubusercontent.com/tryforge/ForgeScript/refs/heads/dev/metadata/events.json',
    'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/events.json'
  ];

  const allEvents: EventData[] = [];

  for (const url of urls) {
    const res = await fetch(url);
    const json = await res.json() as EventData[];
    const source = getSourceName(url);
    json.forEach(evt => evt._source = source);
    allEvents.push(...json);
  }

  typeCompletionItems = allEvents.map(evt => {
    const item = new vscode.CompletionItem(evt.name, vscode.CompletionItemKind.Event);
    item.detail = evt.description;
    item.insertText = `"${evt.name}"`;
    item.documentation = new vscode.MarkdownString(`### ${evt.name}\n\n${evt.description ?? ''}\n\n**Package:** \`${evt._source}\`\n**Version:** \`${evt.version ?? 'unknown'}\``);
    return item;
  });
}
