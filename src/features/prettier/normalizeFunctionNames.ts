import * as vscode from "vscode";
import { parseExpression } from "../utils/parser";
import { fetchFunctionMetadata, RawFunction } from "../utils/functionLoader";
import { getConfig } from "../config/getConfig";

function findOfficialPrefix(name: string, allMetadata: RawFunction[]): string | null {
  const lower = name.toLowerCase();

  const exact = allMetadata.find(
    m =>
      m.name.toLowerCase() === `$${lower}` ||
      m.aliases?.some(alias => alias.toLowerCase() === `$${lower}`)
  );
  if (exact) return exact.name.slice(1);

  const sortedMetadata = [...allMetadata].sort((a, b) => {
    const aLen = a.name.slice(1).length;
    const bLen = b.name.slice(1).length;
    return bLen - aLen;
  });

  for (const m of sortedMetadata) {
    const base = m.name.slice(1).toLowerCase();
    if (lower.startsWith(base)) return m.name.slice(1);

    const aliasMatch = m.aliases?.find(alias => {
      const aliasBase = alias.startsWith("$") ? alias.slice(1) : alias;
      return lower.startsWith(aliasBase.toLowerCase());
    });
    if (aliasMatch) return m.name.slice(1);
  }

  return null;
}

function fixFunctionNamesInText(
  text: string,
  allMetadata: RawFunction[]
): { updatedText: string; hasChanges: boolean } {
  const parsed = parseExpression(text);
  let offset = 0;
  let updatedText = text;
  let changed = false;

  function normalizeFunc(func: any) {
    if (func.escaped || !func.range) return;

    const originalName = func.name;
    const officialPrefix = findOfficialPrefix(originalName, allMetadata);
    if (!officialPrefix) return;

    const lowerOfficial = officialPrefix.toLowerCase();
    const lowerOriginal = originalName.toLowerCase();
    if (!lowerOriginal.startsWith(lowerOfficial)) return;

    const suffix = originalName.slice(lowerOfficial.length);
    const corrected = officialPrefix + suffix;

    const nameStart = func.range.start + offset;
    const nameEnd = func.range.end + offset;
    const current = updatedText.slice(nameStart, nameEnd);

    if (current !== corrected) {
      updatedText =
        updatedText.slice(0, nameStart) +
        corrected +
        updatedText.slice(nameEnd);

      offset += corrected.length - (nameEnd - nameStart);
      changed = true;
    }
  }

  function walk(funcs: any[]) {
    for (const func of funcs) {
      normalizeFunc(func);
      for (const arg of func.insides || []) {
        if (typeof arg === "object" && arg.name) {
          walk([arg]);
        }
        if (Array.isArray(arg)) {
          walk(arg.filter(e => typeof e === "object" && e.name));
        }
      }
    }
  }

  walk(parsed);

  return { updatedText, hasChanges: changed };
}

export async function registerFunctionNameNormalizer(context: vscode.ExtensionContext) {
  const allMetadata = await fetchFunctionMetadata();

  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument(async (e) => {
      if (!getConfig("Prettier")) return;

      const document = e.document;
      const text = document.getText();
      const { updatedText, hasChanges } = fixFunctionNamesInText(text, allMetadata);

      if (!hasChanges) return;

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );

      const edit = vscode.TextEdit.replace(fullRange, updatedText);
      e.waitUntil(Promise.resolve([edit]));
    })
  );
}