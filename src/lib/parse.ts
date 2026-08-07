import { EquipCategory, EquipRule, matchRule } from "./catalog";

export interface ParsedLine {
  id: string;
  raw: string;
  quantity: number;
  rule: EquipRule | null;
  /** pour les lignes non reconnues : catégorie choisie manuellement, ou null pour ignorer */
  manualCategory: EquipCategory | null;
}

const QTY_PREFIX = /^(\d+)\s*[x×]\s*(.+)$/i;
const QTY_SUFFIX = /^(.+?)\s*[x×]\s*(\d+)$/i;
const QTY_PARENS = /^(.+?)\s*\((\d+)\)$/;

export function parseEquipmentList(text: string): ParsedLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter((l) => l.length > 0);

  return lines.map((raw, i) => {
    let quantity = 1;
    let rest = raw;

    const prefix = rest.match(QTY_PREFIX);
    const suffix = rest.match(QTY_SUFFIX);
    const parens = rest.match(QTY_PARENS);
    if (prefix) {
      quantity = parseInt(prefix[1], 10);
      rest = prefix[2];
    } else if (parens) {
      quantity = parseInt(parens[2], 10);
      rest = parens[1];
    } else if (suffix) {
      quantity = parseInt(suffix[2], 10);
      rest = suffix[1];
    }

    const rule = matchRule(rest.toLowerCase());
    return {
      id: `line_${i}_${Math.random().toString(36).slice(2, 8)}`,
      raw: rest.trim() || raw,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      rule,
      manualCategory: null,
    };
  });
}

/** Lecture basique de fichier texte/CSV : garde la première colonne de chaque ligne CSV. */
export function extractTextFromFile(filename: string, content: string): string {
  if (/\.csv$/i.test(filename)) {
    return content
      .split(/\r?\n/)
      .map((line) => line.split(",")[0]?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
  }
  return content;
}
