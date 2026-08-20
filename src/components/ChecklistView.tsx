"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ComicButton } from "@/components/ComicButton";
import { ChecklistItemState, ChecklistSection } from "@/lib/storage";

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

function GripIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
      <circle cx="7" cy="4" r="1.4" />
      <circle cx="13" cy="4" r="1.4" />
      <circle cx="7" cy="10" r="1.4" />
      <circle cx="13" cy="10" r="1.4" />
      <circle cx="7" cy="16" r="1.4" />
      <circle cx="13" cy="16" r="1.4" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
      <path
        d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v7A1.5 1.5 0 0 1 15.5 13H8.2L4.5 16v-3H4.5A1.5 1.5 0 0 1 3 11.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
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

function ItemRow({
  sectionId,
  item,
  roles,
  reorderDisabled,
  commentOpen,
  isMobile,
  justDraggedRef,
  onToggle,
  onRoleChange,
  onRemoveItem,
  onCommentChange,
  onToggleComment,
}: {
  sectionId: string;
  item: ChecklistItemState;
  roles: string[];
  reorderDisabled: boolean;
  commentOpen: boolean;
  isMobile: boolean;
  justDraggedRef: React.RefObject<string | null>;
  onToggle: (sectionId: string, itemId: string) => void;
  onRoleChange: (sectionId: string, itemId: string, role: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onCommentChange: (sectionId: string, itemId: string, comment: string) => void;
  onToggleComment: (itemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: reorderDisabled,
  });
  const hasComment = !!item.comment?.trim();
  // desktop: the whole row is the drag target; mobile keeps a dedicated handle so touch-scrolling still works
  const rowDragProps = isMobile ? {} : { ...attributes, ...listeners };
  const handleDragProps = isMobile ? { ...attributes, ...listeners } : {};

  // dropping a row often ends the pointer back over the checkbox/label, which the browser then
  // reads as a genuine click — swallow that one click so reordering never toggles the item
  const swallowClickIfJustDragged = (e: React.MouseEvent) => {
    if (justDraggedRef.current === item.id) {
      justDraggedRef.current = null;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...rowDragProps}
      onClickCapture={swallowClickIfJustDragged}
      className={`group touch-none ${
        !isMobile && !reorderDisabled ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "relative z-10 -mx-2 rounded-lg bg-white px-2 shadow-comic-lg" : ""}`}
    >
      <div className={isMobile ? "flex flex-col gap-1 py-1.5" : "flex items-center gap-2 py-1"}>
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            {...handleDragProps}
            className={`shrink-0 touch-none text-black/30 ${
              reorderDisabled
                ? "cursor-not-allowed opacity-20"
                : isMobile
                  ? "cursor-grab hover:text-black active:cursor-grabbing"
                  : "cursor-default opacity-40"
            }`}
            title={reorderDisabled ? "Désactivez le filtre pour réorganiser" : "Glisser la ligne pour réordonner"}
            disabled={reorderDisabled || !isMobile}
          >
            <GripIcon />
          </button>
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 select-none py-1.5">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(sectionId, item.id)}
              className="h-5 w-5 shrink-0 accent-black"
            />
            <span
              className={`min-w-0 flex-1 text-sm font-semibold ${item.checked ? "text-black/40 line-through" : ""}`}
            >
              {item.label}
            </span>
          </label>
          {!isMobile && (
            <>
              <select
                value={item.role}
                onChange={(e) => onRoleChange(sectionId, item.id, e.target.value)}
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
                onClick={() => onToggleComment(item.id)}
                title="Commentaire"
                className={`shrink-0 transition-opacity ${
                  hasComment || commentOpen
                    ? "text-black opacity-100"
                    : "text-black opacity-0 group-hover:opacity-60 hover:!opacity-100"
                }`}
              >
                <CommentIcon />
              </button>
              <button
                onClick={() => onRemoveItem(sectionId, item.id)}
                title="Retirer ce point"
                className="shrink-0 text-xs font-bold opacity-30 hover:opacity-100"
              >
                ✕
              </button>
            </>
          )}
        </div>
        {isMobile && (
          <div className="flex items-center gap-2 pl-6">
            <select
              value={item.role}
              onChange={(e) => onRoleChange(sectionId, item.id, e.target.value)}
              className="min-w-0 flex-1 rounded-md border-[1.5px] border-black/40 bg-white px-1.5 py-1 text-[10px] font-bold uppercase outline-none focus:border-black"
            >
              <option value="">Non assigné</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              onClick={() => onToggleComment(item.id)}
              title="Commentaire"
              className={`shrink-0 ${hasComment || commentOpen ? "text-black" : "text-black/40"}`}
            >
              <CommentIcon />
            </button>
            <button
              onClick={() => onRemoveItem(sectionId, item.id)}
              title="Retirer ce point"
              className="shrink-0 text-xs font-bold text-black/30"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {commentOpen && (
        <div className="mb-2 pl-6">
          <textarea
            autoFocus
            value={item.comment ?? ""}
            onChange={(e) => onCommentChange(sectionId, item.id, e.target.value)}
            placeholder="Commentaire…"
            rows={2}
            className="w-full resize-none rounded-md border-[1.5px] border-black/40 px-2 py-1.5 text-xs font-semibold outline-none focus:border-black"
          />
        </div>
      )}
      {!commentOpen && hasComment && (
        <p className="mb-2 pl-6 text-xs italic text-black/50">{item.comment}</p>
      )}
    </div>
  );
}

function SectionCard({
  section,
  number,
  items,
  roles,
  complete,
  reorderDisabled,
  forceCollapsed,
  justDraggedSectionRef,
  openComments,
  isMobile,
  onToggle,
  onRoleChange,
  onAddItem,
  onRemoveItem,
  onToggleCollapse,
  onCommentChange,
  onToggleComment,
  onReorderItems,
}: {
  section: ChecklistSection;
  number: number;
  items: ChecklistItemState[];
  roles: string[];
  complete: boolean;
  reorderDisabled: boolean;
  forceCollapsed: boolean;
  justDraggedSectionRef: React.RefObject<string | null>;
  openComments: Set<string>;
  isMobile: boolean;
  onToggle: (sectionId: string, itemId: string) => void;
  onRoleChange: (sectionId: string, itemId: string, role: string) => void;
  onAddItem: (sectionId: string, label: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
  onCommentChange: (sectionId: string, itemId: string, comment: string) => void;
  onToggleComment: (itemId: string) => void;
  onReorderItems: (sectionId: string, activeId: string, overId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: reorderDisabled,
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const done = items.filter((i) => i.checked).length;
  const collapsed = forceCollapsed || !!section.collapsed;
  // desktop: the whole header bar is the drag target; mobile keeps a dedicated handle so touch-scrolling still works
  const headerDragProps = isMobile ? {} : { ...attributes, ...listeners };
  const handleDragProps = isMobile ? { ...attributes, ...listeners } : {};
  const justDraggedItemRef = useRef<string | null>(null);

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    justDraggedItemRef.current = String(active.id);
    setTimeout(() => {
      if (justDraggedItemRef.current === String(active.id)) justDraggedItemRef.current = null;
    }, 0);
    if (!over || active.id === over.id) return;
    onReorderItems(section.id, String(active.id), String(over.id));
  };

  // same click-after-drop swallow as items, applied to the collapse toggle
  const handleCollapseClick = () => {
    if (justDraggedSectionRef.current === section.id) {
      justDraggedSectionRef.current = null;
      return;
    }
    onToggleCollapse(section.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border-[2.5px] border-black transition-colors ${
        isDragging ? "relative z-20 shadow-comic-lg" : "shadow-comic"
      } ${complete ? "bg-green-100" : "bg-white"}`}
    >
      <div
        {...headerDragProps}
        className={`flex touch-none items-center gap-2 border-black px-3 py-2.5 ${
          !isMobile && !reorderDisabled ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={{ borderBottomWidth: collapsed ? 0 : 2.5 }}
      >
        <button
          type="button"
          {...handleDragProps}
          className={`shrink-0 touch-none text-black/40 ${
            reorderDisabled
              ? "cursor-not-allowed opacity-20"
              : isMobile
                ? "cursor-grab hover:text-black active:cursor-grabbing"
                : "cursor-default opacity-40"
          }`}
          title={reorderDisabled ? "Désactivez le filtre pour réorganiser" : "Glisser la section pour réordonner"}
          disabled={reorderDisabled || !isMobile}
        >
          <GripIcon />
        </button>
        <button
          type="button"
          onClick={handleCollapseClick}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Chevron open={!collapsed} />
            <span className="font-display truncate text-sm uppercase tracking-wide">
              {number}. {section.title}
              {section.quantity > 1 ? ` x${section.quantity}` : ""}
            </span>
          </span>
          <ProgressBar done={done} total={items.length} />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="flex flex-col divide-y-[1.5px] divide-black/10 px-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    sectionId={section.id}
                    item={item}
                    roles={roles}
                    reorderDisabled={reorderDisabled}
                    commentOpen={openComments.has(item.id)}
                    isMobile={isMobile}
                    justDraggedRef={justDraggedItemRef}
                    onToggle={onToggle}
                    onRoleChange={onRoleChange}
                    onRemoveItem={onRemoveItem}
                    onCommentChange={onCommentChange}
                    onToggleComment={onToggleComment}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <div className="border-t-[1.5px] border-black/10 px-4 pb-3">
            <AddItemForm onAdd={(label) => onAddItem(section.id, label)} />
          </div>
        </>
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
  onCommentChange,
  onReorderSections,
  onReorderItems,
  isMobile = false,
}: {
  sections: ChecklistSection[];
  roles: string[];
  onToggle: (sectionId: string, itemId: string) => void;
  onRoleChange: (sectionId: string, itemId: string, role: string) => void;
  onAddItem: (sectionId: string, label: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
  onCommentChange: (sectionId: string, itemId: string, comment: string) => void;
  onReorderSections: (activeId: string, overId: string) => void;
  onReorderItems: (sectionId: string, activeId: string, overId: string) => void;
  isMobile?: boolean;
}) {
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [sectionDragActive, setSectionDragActive] = useState(false);
  const justDraggedSectionRef = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const toggleComment = (itemId: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const matchesFilter = (role: string) =>
    filterRoles.length === 0 || filterRoles.includes(role || UNASSIGNED);

  // numbers reflect each section's position in the underlying (unfiltered) order, so they
  // stay correct even while a role filter hides some sections, and follow the section when dragged
  const sectionNumbers = new Map(sections.map((s, i) => [s.id, i + 1]));

  const visibleSections = sections
    .map((section) => ({ section, items: section.items.filter((i) => matchesFilter(i.role)) }))
    .filter(({ items }) => filterRoles.length === 0 || items.length > 0);

  const allVisibleItems = visibleSections.flatMap(({ items }) => items);
  const totalDone = allVisibleItems.filter((i) => i.checked).length;
  const reorderDisabled = filterRoles.length > 0;

  // collapsing every section while one is being dragged avoids the layout jumping around when a
  // collapsed section passes over an expanded one (their heights can differ by a lot)
  const handleSectionDragStart = (event: DragStartEvent) => {
    justDraggedSectionRef.current = String(event.active.id);
    setSectionDragActive(true);
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setSectionDragActive(false);
    setTimeout(() => {
      if (justDraggedSectionRef.current === String(active.id)) justDraggedSectionRef.current = null;
    }, 0);
    if (!over || active.id === over.id) return;
    onReorderSections(String(active.id), String(over.id));
  };

  const handleSectionDragCancel = () => {
    setSectionDragActive(false);
    justDraggedSectionRef.current = null;
  };

  return (
    <div className={`mx-auto flex max-w-3xl flex-col gap-5 ${isMobile ? "p-3" : "p-6"}`}>
      <div className="flex items-center justify-between gap-2 rounded-xl border-[2.5px] border-black bg-white px-4 py-3 shadow-comic">
        <p className="font-display text-lg uppercase tracking-wide">Check-list essai caméra</p>
        <div className="flex items-center gap-3">
          <ProgressBar done={totalDone} total={allVisibleItems.length} />
          <RoleFilter roles={roles} selected={filterRoles} onChange={setFilterRoles} />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleSectionDragStart}
        onDragEnd={handleSectionDragEnd}
        onDragCancel={handleSectionDragCancel}
      >
        <SortableContext items={visibleSections.map(({ section }) => section.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-5">
            {visibleSections.map(({ section, items }) => (
              <SectionCard
                key={section.id}
                section={section}
                number={sectionNumbers.get(section.id)!}
                items={items}
                roles={roles}
                complete={items.length > 0 && items.filter((i) => i.checked).length === items.length}
                reorderDisabled={reorderDisabled}
                forceCollapsed={sectionDragActive}
                justDraggedSectionRef={justDraggedSectionRef}
                openComments={openComments}
                isMobile={isMobile}
                onToggle={onToggle}
                onRoleChange={onRoleChange}
                onAddItem={onAddItem}
                onRemoveItem={onRemoveItem}
                onToggleCollapse={onToggleCollapse}
                onCommentChange={onCommentChange}
                onToggleComment={toggleComment}
                onReorderItems={onReorderItems}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
