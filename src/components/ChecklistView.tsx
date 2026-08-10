"use client";

import { useState } from "react";
import { ComicButton } from "@/components/ComicButton";
import { ChecklistSection } from "@/lib/storage";

const UNASSIGNED = "__unassigned__";

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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function RoleFilter({
  roles,
  selected,
  onChange,
}: {
  roles: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = [...roles, UNASSIGNED];
  const label = (r: string) => (r === UNASSIGNED ? "Non assigné" : r);

  const toggle = (r: string) => {
    onChange(selected.includes(r) ? selected.filter((x) => x !== r) : [...selected, r]);
  };

  return (
    <div className="relative shrink-0">
      <ComicButton onClick={() => setOpen((v) => !v)} variant={selected.length > 0 ? "solid" : "outline"}>
        Filtrer{selected.length > 0 ? ` (${selected.length})` : ""}
      </ComicButton>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white p-3 shadow-comic-lg">
          <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-wider">
            Afficher seulement
          </p>
          <div className="mb-2 flex flex-col gap-1.5">
            {options.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={selected.includes(r)}
                  onChange={() => toggle(r)}
                  className="h-3.5 w-3.5 accent-black"
                />
                {label(r)}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-[10px] font-bold underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              Tout afficher
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ChecklistView({
  sections,
  roles,
  onToggle,
  onRoleChange,
  onAddItem,
  onRemoveItem,
  onToggleCollapse,
}: {
  sections: ChecklistSection[];
  roles: string[];
  onToggle: (sectionId: string, itemId: string) => void;
  onRoleChange: (sectionId: string, itemId: string, role: string) => void;
  onAddItem: (sectionId: string, label: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
}) {
  const [filterRoles, setFilterRoles] = useState<string[]>([]);

  const matchesFilter = (role: string) =>
    filterRoles.length === 0 || filterRoles.includes(role || UNASSIGNED);

  const visibleSections = sections
    .map((section) => ({ section, items: section.items.filter((i) => matchesFilter(i.role)) }))
    .filter(({ items }) => filterRoles.length === 0 || items.length > 0);

  const allVisibleItems = visibleSections.flatMap(({ items }) => items);
  const totalDone = allVisibleItems.filter((i) => i.checked).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-2 rounded-xl border-[2.5px] border-black bg-white px-4 py-3 shadow-comic">
        <p className="font-display text-lg uppercase tracking-wide">Check-list essai caméra</p>
        <div className="flex items-center gap-3">
          <ProgressBar done={totalDone} total={allVisibleItems.length} />
          <RoleFilter roles={roles} selected={filterRoles} onChange={setFilterRoles} />
        </div>
      </div>

      {visibleSections.map(({ section, items }) => {
        const done = items.filter((i) => i.checked).length;
        const complete = items.length > 0 && done === items.length;
        const collapsed = !!section.collapsed;
        return (
          <div
            key={section.id}
            className={`rounded-xl border-[2.5px] border-black shadow-comic transition-colors ${
              complete ? "bg-green-100" : "bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleCollapse(section.id)}
              className="flex w-full items-center justify-between gap-2 border-black px-4 py-2.5 text-left"
              style={{ borderBottomWidth: collapsed ? 0 : 2.5 }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Chevron open={!collapsed} />
                <span className="font-display truncate text-sm uppercase tracking-wide">
                  {section.title}
                  {section.quantity > 1 ? ` x${section.quantity}` : ""}
                </span>
              </span>
              <ProgressBar done={done} total={items.length} />
            </button>
            {!collapsed && (
              <>
                <div className="flex flex-col divide-y-[1.5px] divide-black/10 px-4">
                  {items.map((item) => (
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
