import * as vscode from "vscode";
import { fetchFunctionMetadata, RawFunction } from "../utils/functionLoader";
import { parseExpression, ParsedFunction } from "../utils/parser";
import { getConfig } from "../config/getConfig";

const supportedLanguages = ["forgescript", "javascript", "typescript"];
let allMetadata: RawFunction[] = [];

function hasForgeCode(text: string): boolean {
  return /code\s*:\s*[`'"]/.test(text);
}

function validateFunction(
  func: ParsedFunction,
  meta: RawFunction,
  document: vscode.TextDocument,
  blockOffset: number,
  diagnostics: vscode.Diagnostic[],
  blockText: string
) {
  if (func.escaped) return;

  const rangeStart = blockOffset + func.rangeInBlock.start;
  const rangeEnd = blockOffset + func.rangeInBlock.end;
  const range = new vscode.Range(
    document.positionAt(rangeStart),
    document.positionAt(rangeEnd)
  );

  const realArgs = func.insides;
  const argDefs = meta.args ?? [];

  const hasBrackets = func.raw.includes("[") && func.raw.endsWith("]");
  const shouldEnforceArgs = meta.brackets || hasBrackets;

  if (argDefs.length === 0 && hasBrackets) {
    diagnostics.push(new vscode.Diagnostic(
      range,
      `Function $${func.name} cannot have brackets because it takes no arguments.`,
      vscode.DiagnosticSeverity.Error
    ));
    return;
  }

  if (meta.brackets && argDefs.some(arg => arg.required) && !hasBrackets) {
    diagnostics.push(new vscode.Diagnostic(
      range,
      `Function $${func.name} requires brackets because it has required arguments.`,
      vscode.DiagnosticSeverity.Error
    ));
    return;
  }

  if (shouldEnforceArgs) {
    const realArgCount = func.argCount;
    const maxArgs = argDefs.length;
    const hasRest = argDefs.at(-1)?.rest ?? false;

    let requiredCount = 0;
    for (const arg of argDefs) {
      if (arg.required) requiredCount++;
      else break;
    }

    if (realArgCount < requiredCount) {
      diagnostics.push(new vscode.Diagnostic(
        range,
        `Function $${func.name} requires at least ${requiredCount} argument(s), but got ${realArgCount}.`,
        vscode.DiagnosticSeverity.Error
      ));
    }

    if (realArgCount > maxArgs && !hasRest) {
      diagnostics.push(new vscode.Diagnostic(
        range,
        `Function $${func.name} received ${realArgCount} argument(s), but only ${maxArgs} expected.`,
        vscode.DiagnosticSeverity.Error
      ));
    }

    for (let i = 0; i < argDefs.length; i++) {
      const metaArg = argDefs[i];
      const realArg = realArgs[i];
      const isEmpty = realArg === undefined || realArg === null || realArg === "" || (typeof realArg === "string" && realArg.trim() === "");

      if (metaArg.required && isEmpty) {
        diagnostics.push(new vscode.Diagnostic(
          range,
          `Missing required argument: ${metaArg.name}`,
          vscode.DiagnosticSeverity.Error
        ));
      }
    }
  }

  for (const arg of realArgs) {
    if (typeof arg === "object") {
      if (Array.isArray(arg)) {
        for (const sub of arg) {
          if (typeof sub === "object" && "name" in sub) {
            const subMeta = allMetadata.find(m => m.name === `$${sub.name}` || m.aliases?.includes(`$${sub.name}`));
            if (subMeta) validateFunction(sub, subMeta, document, blockOffset, diagnostics, blockText);
          }
        }
      } else if ("name" in arg) {
        const subMeta = allMetadata.find(m => m.name === `$${arg.name}` || m.aliases?.includes(`$${arg.name}`));
        if (subMeta) validateFunction(arg, subMeta, document, blockOffset, diagnostics, blockText);
      }
    }
  }
}

function findMetadata(name: string) {
  return allMetadata.find(m => m.name === `$${name}` || m.aliases?.includes(`$${name}`));
}

export async function registerArgumentChecker(context: vscode.ExtensionContext) {
  allMetadata = await fetchFunctionMetadata();
  const diagnosticsCollection = vscode.languages.createDiagnosticCollection("forgescript");

  async function runDiagnostics(document: vscode.TextDocument) {
    if (!supportedLanguages.includes(document.languageId)) return;
    if (!getConfig("enabled")) return;
    if (!getConfig("diagnosticsEnabled")) return;

    const text = document.getText();
    if (!hasForgeCode(text)) {
      diagnosticsCollection.set(document.uri, []);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];

    try {
      const functions = parseExpression(text);
      const validFunctions = functions.filter(func => findMetadata(func.name));

      if (validFunctions.length === 0) {
        diagnosticsCollection.set(document.uri, []);
        return;
      }

      for (const func of validFunctions) {
        const meta = findMetadata(func.name);
        if (meta) validateFunction(func, meta, document, 0, diagnostics, text);
      }
    } catch (err) {
      const error = err as Error & { pos?: number };
      const position = document.positionAt(error.pos ?? 0);
      diagnostics.push(new vscode.Diagnostic(
        new vscode.Range(position, position),
        `Parse error: ${error.message}`,
        vscode.DiagnosticSeverity.Error
      ));
    }

    diagnosticsCollection.set(document.uri, diagnostics);
  }

  let debounceTimer: NodeJS.Timeout | null = null;
  function scheduleDiagnostics(document: vscode.TextDocument) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runDiagnostics(document), 1000);
  }

  vscode.workspace.textDocuments.forEach(runDiagnostics);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(runDiagnostics),
    vscode.workspace.onDidSaveTextDocument(runDiagnostics),
    vscode.workspace.onDidChangeTextDocument(e => scheduleDiagnostics(e.document)),
    diagnosticsCollection
  );
}