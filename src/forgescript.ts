import * as vscode from 'vscode';
import { fetch } from 'undici';

interface Arg {
  name: string;
  required?: boolean;
  description?: string;
}

interface FunctionData {
  name: string;
  description: string;
  version?: string;
  brackets?: boolean;
  args?: Arg[];
  _source?: 'ForgeScript' | 'ForgeDB' | 'ForgeCanvas' | string;
}

interface EventData {
  name: string;
  description?: string;
  version?: string;
  _source?: 'ForgeScript' | 'ForgeDB' | string;
}

let functionsData: FunctionData[] = [];
let completionItems: vscode.CompletionItem[] = [];
let typeCompletionItems: vscode.CompletionItem[] = [];
let autoCompletionEnabled = true;

const EXTENSIONS = [
  'https://raw.githubusercontent.com/tryforge/Forgedb/refs/heads/dev/metadata/functions.json',
  'https://raw.githubusercontent.com/tryforge/Forgecanvas/refs/heads/dev/metadata/functions.json'
];

function getSourceName(url: string): string {
  if (url.includes('Forgedb')) return 'ForgeDB';
  if (url.includes('Forgecanvas')) return 'ForgeCanvas';
  return 'ForgeScript';
}

async function fetchFunctions(): Promise<void> {
  try {
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
        if (func.args && func.args.length > 0) {
          const params = func.args.map((arg, i) => {
            const optional = arg.required ? '' : '?';
            return `\${${i + 1}:${arg.name}${optional}}`;
          }).join(';');
          snippet += `[${params}]`;
        } else {
          snippet += `[]`;
        }
      } else if (func.brackets === false) {
        if (func.args && func.args.length > 0) {
          const params = func.args.map((arg, i) => `\${${i + 1}:${arg.name}?}`).join(';');
          snippet += `[\${1:${params}}]`;
        } else {
          snippet += `[\${1:}]`;
        }
      } else {
        snippet = name;
      }

      item.insertText = new vscode.SnippetString(snippet);
      item.detail = func.description;

      const argsList = func.args?.map(arg =>
        `- \`${arg.name}\`${arg.required ? '' : ' _(optional)_'}: ${arg.description || ''}`
      ).join('\n') || 'None';

      const docString = `### ${func.name}\n\n${func.description}\n\n` +
        `**Package:** \`${func._source}\`\n` +
        `**Version:** \`${func.version ?? 'unknown'}\`\n` +
        `**Brackets:** \`${func.brackets === undefined ? 'none' : func.brackets ? 'required' : 'optional'}\`\n\n` +
        `**Arguments:**\n${argsList}`;

      const markdown = new vscode.MarkdownString(docString);
      markdown.isTrusted = true;
      item.documentation = markdown;

      return item;
    });

  } catch (error) {
    console.error('Error fetching functions:', error);
  }
}

async function fetchEvents(): Promise<void> {
  try {
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

      item.documentation = new vscode.MarkdownString(
        `### ${evt.name}\n\n${evt.description ?? ''}\n\n` +
        `**Package:** \`${evt._source}\`\n` +
        `**Version:** \`${evt.version ?? 'unknown'}\``
      );

      return item;
    });

  } catch (error) {
    console.error('Error fetching events:', error);
  }
}

function isInTemplateString(document: vscode.TextDocument, position: vscode.Position): boolean {
  const text = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
  const backticks = (text.match(/`/g) || []).length;
  return backticks % 2 === 1;
}

function shouldProvideForJsTs(document: vscode.TextDocument, position: vscode.Position): boolean {
  const fileName = document.fileName;
  if (fileName.endsWith('.fs.js') || fileName.endsWith('.fs.ts')) return true;
  if ((fileName.endsWith('.js') || fileName.endsWith('.ts')) && position) {
    return isInTemplateString(document, position);
  }
  return false;
}

export function activate(context: vscode.ExtensionContext): void {
  fetchFunctions();
  fetchEvents();

  const fsProvider = vscode.languages.registerCompletionItemProvider(
    ['fs', 'javascript', 'typescript'],
    {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        if (!autoCompletionEnabled) return undefined;
        if (document.languageId === 'fs' || shouldProvideForJsTs(document, position)) {
          const linePrefix = document.lineAt(position).text.substr(0, position.character);
          const wordMatch = linePrefix.match(/\$[a-zA-Z0-9_]*$/);
          if (!wordMatch) return undefined;
          return completionItems;
        }
        return undefined;
      }
    },
    '$'
  );

  const typeProvider = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript', 'fs'],
    {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        if (!autoCompletionEnabled) return undefined;
        if (document.languageId === 'fs' || shouldProvideForJsTs(document, position)) {
          const line = document.lineAt(position).text;
          const prefix = line.substring(0, position.character);
          const regex = /type\s*[:=]\s*["']?[a-zA-Z0-9_]*$/;
          if (!regex.test(prefix)) return undefined;
          return typeCompletionItems;
        }
        return undefined;
      }
    },
    '"', "'"
  );

  const diagnosticCollection = vscode.languages.createDiagnosticCollection('forgescript');

  const diagnosticCheck = vscode.workspace.onDidChangeTextDocument(event => {
    if (!autoCompletionEnabled) return;
    const document = event.document;
    const text = document.getText();

    if (!(document.languageId === 'fs' || document.fileName.endsWith('.fs.js') || document.fileName.endsWith('.fs.ts'))) return;

    const diagnostics: vscode.Diagnostic[] = [];

    functionsData.forEach(func => {
      if (!func.args || func.args.length === 0 || !func.brackets) return;

      const requiredArgs = func.args.filter(arg => arg.required);
      const totalArgs = func.args.length;

      const regex = new RegExp(`\\${func.name}\\[([^\\]]*)\\]`, 'g');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const provided = match[1].split(';').filter(Boolean);
        const start = document.positionAt(match.index);
        const end = document.positionAt(match.index + match[0].length);

        if (provided.length < requiredArgs.length) {
          diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(start, end),
            `${func.name} is missing required parameters. Expected ${requiredArgs.length}, got ${provided.length}.`,
            vscode.DiagnosticSeverity.Error
          ));
        } else if (provided.length > totalArgs) {
          diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(start, end),
            `${func.name} has too many parameters. Expected max ${totalArgs}, got ${provided.length}.`,
            vscode.DiagnosticSeverity.Error
          ));
        }
      }
    });

    diagnosticCollection.set(document.uri, diagnostics);
  });

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

export function deactivate(): void {}