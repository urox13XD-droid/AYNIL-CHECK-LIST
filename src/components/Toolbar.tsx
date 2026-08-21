"use client";

import { useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { ComicButton } from "@/components/ComicButton";
import { ChecklistProject, ROLE_COLOR_PALETTE, Role } from "@/lib/storage";

export type ExportMode = "blank" | "full";

export function Toolbar({
  title,
  onTitleChange,
  onNew,
  onSave,
  onExportProject,
  onImportJson,
  onPrint,
  onLoadMasterChecklist,
  projects,
  onOpenProject,
  onDeleteProject,
  roles,
  onRolesChange,
  isMobile = false,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  onNew: () => void;
  onSave: () => void;
  onExportProject: (mode: ExportMode) => void;
  onImportJson: (file: File) => void;
  onPrint: () => void;
  onLoadMasterChecklist: () => void;
  projects: ChecklistProject[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  roles: Role[];
  onRolesChange: (roles: Role[]) => void;
  /** stacks title and actions on two rows, actions in a horizontally scrollable strip, so a phone-width screen doesn't have to fit everything at once */
  isMobile?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  const importInput = (
    <input
      ref={fileRef}
      type="file"
      accept="application/json"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onImportJson(file);
        e.target.value = "";
      }}
    />
  );

  const rolesMenu = (align: "left" | "right") => (
    <div className="relative shrink-0">
      <ComicButton onClick={() => setRolesOpen((v) => !v)} title="Gérer les rôles">
        Rôles
      </ComicButton>
      {rolesOpen && (
        <div className={`absolute ${align}-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white p-3 shadow-comic-lg`}>
          <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-wider">
            Rôles disponibles
          </p>
          <div className="mb-2 flex flex-col gap-2">
            {roles.map((r) => (
              <div key={r.name} className="flex flex-col gap-1 border-b-[1.5px] border-black/10 pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={r.color}
                    title="Couleur du poste"
                    onChange={(e) =>
                      onRolesChange(roles.map((x) => (x.name === r.name ? { ...x, color: e.target.value } : x)))
                    }
                    className="h-6 w-6 shrink-0 cursor-pointer rounded border-[1.5px] border-black p-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-bold">{r.name}</span>
                  <button
                    className="shrink-0 font-bold opacity-50 hover:opacity-100"
                    title="Supprimer"
                    onClick={() => onRolesChange(roles.filter((x) => x.name !== r.name))}
                  >
                    ✕
                  </button>
                </div>
                <input
                  value={r.assigneeName ?? ""}
                  onChange={(e) =>
                    onRolesChange(
                      roles.map((x) => (x.name === r.name ? { ...x, assigneeName: e.target.value } : x))
                    )
                  }
                  placeholder="Nom de la personne (ex : Magalie)"
                  className="w-full rounded-md border-[1.5px] border-black/30 px-2 py-1 text-[11px] font-semibold outline-none focus:border-black"
                />
              </div>
            ))}
          </div>
          <form
            className="flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              const v = newRole.trim();
              if (v && !roles.some((x) => x.name === v)) {
                onRolesChange([...roles, { name: v, color: ROLE_COLOR_PALETTE[roles.length % ROLE_COLOR_PALETTE.length] }]);
              }
              setNewRole("");
            }}
          >
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Nouveau rôle…"
              className="min-w-0 flex-1 rounded-md border-[2px] border-black px-2 py-1 text-xs font-semibold outline-none"
            />
            <ComicButton type="submit">Ajouter</ComicButton>
          </form>
        </div>
      )}
    </div>
  );

  const openMenu = (align: "left" | "right") => (
    <div className="relative shrink-0">
      <ComicButton onClick={() => setMenuOpen((v) => !v)} title="Check-lists enregistrées">
        Ouvrir
      </ComicButton>
      {menuOpen && (
        <div className={`absolute ${align}-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white shadow-comic-lg`}>
          <div className="max-h-72 overflow-y-auto">
            {projects.length === 0 && (
              <p className="p-3 text-xs font-semibold text-black/50">
                Aucune check-list enregistrée.
              </p>
            )}
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2 text-xs last:border-b-0 hover:bg-black hover:text-white"
              >
                <button
                  className="min-w-0 flex-1 truncate text-left font-bold"
                  onClick={() => {
                    onOpenProject(p.id);
                    setMenuOpen(false);
                  }}
                >
                  {p.name}
                </button>
                <button
                  className="shrink-0 font-bold opacity-60 hover:opacity-100"
                  title="Supprimer"
                  onClick={() => onDeleteProject(p.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const exportMenu = (align: "left" | "right") => (
    <div className="relative shrink-0">
      <ComicButton onClick={() => setExportOpen((v) => !v)} title="Exporter le projet">
        Export Project
      </ComicButton>
      {exportOpen && (
        <div className={`absolute ${align}-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white p-1.5 shadow-comic-lg`}>
          <button
            className="w-full rounded-md px-2.5 py-2 text-left hover:bg-black hover:text-white"
            onClick={() => {
              onExportProject("blank");
              setExportOpen(false);
            }}
          >
            <span className="font-display block text-xs uppercase tracking-wide">Blank Export</span>
            <span className="block text-[10px] font-semibold opacity-60">
              Structure seule — sans cases cochées, couleurs ni commentaires
            </span>
          </button>
          <button
            className="w-full rounded-md px-2.5 py-2 text-left hover:bg-black hover:text-white"
            onClick={() => {
              onExportProject("full");
              setExportOpen(false);
            }}
          >
            <span className="font-display block text-xs uppercase tracking-wide">Full Export</span>
            <span className="block text-[10px] font-semibold opacity-60">Tout, dans l&apos;état actuel</span>
          </button>
        </div>
      )}
    </div>
  );

  const actionButtons = (align: "left" | "right") => (
    <>
      <ComicButton onClick={onNew}>Nouveau</ComicButton>
      <ComicButton onClick={onLoadMasterChecklist}>Master Checklist</ComicButton>
      {importInput}
      <ComicButton onClick={() => fileRef.current?.click()}>Importer</ComicButton>
      {exportMenu(align)}
      <ComicButton onClick={onPrint}>Imprimer / PDF</ComicButton>
      <ComicButton onClick={onSave} variant="solid">
        Sauvegarder
      </ComicButton>
    </>
  );

  if (isMobile) {
    return (
      <header className="no-print flex flex-col gap-2 border-b-[3px] border-black bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <Logo subtitle="CHECK LIST" />
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="font-display min-w-0 flex-1 rounded-lg border-[2px] border-black bg-white px-2.5 py-1.5 text-sm font-bold outline-none focus:shadow-comic-sm"
            placeholder="Nom du tournage…"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {rolesMenu("left")}
          {openMenu("left")}
          {actionButtons("left")}
        </div>
      </header>
    );
  }

  return (
    <header className="no-print flex items-center gap-4 border-b-[3px] border-black bg-white px-4 py-2.5">
      <Logo subtitle="CHECK LIST" />

      <div className="mx-2 h-10 w-[2.5px] shrink-0 bg-black/10" />

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="font-display min-w-0 flex-1 rounded-lg border-[2px] border-black bg-white px-3 py-1.5 text-sm font-bold outline-none focus:shadow-comic-sm"
        placeholder="Nom du tournage…"
      />

      {rolesMenu("right")}
      {openMenu("right")}
      {actionButtons("right")}
    </header>
  );
}
