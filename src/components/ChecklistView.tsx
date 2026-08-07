"use client";

import { useState } from "react";
import { ChecklistSection } from "@/lib/storage";

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-28 overflow-hidden rounded-full border-[1.5px] border-black bg-white">
        <div className="h-full bg-black transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-black/60">
        {done}/{total}
      </span>
    </div>
  );
}

function AddItemForm({ onAdd }: { onAdd: (label: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-2 flex gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (v) onAdd(v);
        setValue("");
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ajouter un point de contrôle…"
        className="min-w-0 flex-1 rounded-md border-[1.5px] border-black/40 px-2 py-1 text-xs font-semibold outline-none focus:border-black"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md border-[1.5px] border-black px-2 py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-white"
      >
        Ajouter
      </button>
    </form>
  );
}

export function ChecklistView({
  sections,
  roles,
  onToggle,
  onRoleChange,
  onAddItem,
  onRemoveItem,
}: {
  sections: ChecklistSection[];
  roles: string[];
  onToggle: (sectionId: string, itemId: string) => void;
  onRoleChange: (sectionId: string, itemId: string, role: string) => void;
  onAddItem: (sectionId: string, label: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
}) {
  const allItems = sections.flatMap((s) => s.items);
  const totalDone = allItems.filter((i) => i.checked).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <div className="flex items-center justify-between rounded-xl border-[2.5px] border-black bg-white px-4 py-3 shadow-comic">
        <p className="font-display text-lg uppercase tracking-wide">Check-list essai caméra</p>
        <ProgressBar done={totalDone} total={allItems.length} />
      </div>

      {sections.map((section) => {
        const done = section.items.filter((i) => i.checked).length;
        return (
          <div key={section.id} className="rounded-xl border-[2.5px] border-black bg-white shadow-comic">
            <div className="flex items-center justify-between gap-2 border-b-[2.5px] border-black px-4 py-2.5">
              <p className="font-display truncate text-sm uppercase tracking-wide">
                {section.title}
                {section.quantity > 1 ? ` x${section.quantity}` : ""}
              </p>
              <ProgressBar done={done} total={section.items.length} />
            </div>
            <div className="flex flex-col divide-y-[1.5px] divide-black/10 px-4">
              {section.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(section.id, item.id)}
                    className="h-4 w-4 shrink-0 accent-black"
                  />
                  <span
                    className={`min-w-0 flex-1 text-sm font-semibold ${
                      item.checked ? "text-black/40 line-through" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                  <select
                    value={item.role}
                    onChange={(e) => onRoleChange(section.id, item.id, e.target.value)}
                    className="shrink-0 rounded-md border-[1.5px] border-black/40 bg-white px-1.5 py-1 text-[10px] font-bold uppercase outline-none focus:border-black"
                  >
                    <option value="">Non assigné</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onRemoveItem(section.id, item.id)}
                    title="Retirer ce point"
                    className="shrink-0 text-xs font-bold opacity-30 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t-[1.5px] border-black/10 px-4 pb-3">
              <AddItemForm onAdd={(label) => onAddItem(section.id, label)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
