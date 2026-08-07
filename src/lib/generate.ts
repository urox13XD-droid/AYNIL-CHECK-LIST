import { CATEGORY_BASE_ITEMS, DEFAULT_ROLE_BY_CATEGORY, EquipCategory, GENERAL_ITEMS } from "./catalog";
import { ParsedLine } from "./parse";
import { ChecklistItemState, ChecklistSection } from "./storage";

function makeItem(label: string, role: string): ChecklistItemState {
  return { id: `item_${Math.random().toString(36).slice(2, 9)}`, label, checked: false, role };
}

interface Group {
  label: string;
  category: EquipCategory;
  items: string[];
  quantity: number;
}

export function generateSections(parsedLines: ParsedLine[]): ChecklistSection[] {
  const byKey = new Map<string, Group>();

  for (const line of parsedLines) {
    if (line.rule) {
      const key = `rule_${line.rule.id}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.quantity += line.quantity;
      } else {
        byKey.set(key, {
          label: line.rule.label,
          category: line.rule.category,
          items: [...CATEGORY_BASE_ITEMS[line.rule.category], ...(line.rule.items ?? [])],
          quantity: line.quantity,
        });
      }
    } else if (line.manualCategory) {
      byKey.set(`line_${line.id}`, {
        label: line.raw,
        category: line.manualCategory,
        items: [...CATEGORY_BASE_ITEMS[line.manualCategory]],
        quantity: line.quantity,
      });
    }
  }

  const sections: ChecklistSection[] = [];
  for (const [key, group] of byKey) {
    sections.push({
      id: `sec_${key}`,
      title: group.label,
      quantity: group.quantity,
      items: group.items.map((label) => makeItem(label, DEFAULT_ROLE_BY_CATEGORY[group.category])),
    });
  }

  sections.push({
    id: "sec_general",
    title: "Vérifications générales",
    quantity: 1,
    items: GENERAL_ITEMS.map((label) => makeItem(label, "")),
  });

  return sections;
}
