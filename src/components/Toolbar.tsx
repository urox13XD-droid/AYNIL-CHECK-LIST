"use client";

import { useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { ComicButton } from "@/components/ComicButton";
import { ChecklistProject } from "@/lib/storage";

export function Toolbar({
  title,
  onTitleChange,
  onNew,
  onSave,
  onExportJson,
  onImportJson,
  onPrint,
  projects,
  onOpenProject,
  onDeleteProject,
  roles,
  onRolesChange,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  onNew: () => void;
  onSave: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onPrint: () => void;
  projects: ChecklistProject[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  roles: string[];
  onRolesChange: (roles: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

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

      <div className="relative shrink-0">
        <ComicButton onClick={() => setRolesOpen((v) => !v)} title="Gérer les rôles">
          Rôles
        </ComicButton>
        {rolesOpen && (
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white p-3 shadow-comic-lg">
            <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-wider">
              Rôles disponibles
            </p>
            <div className="mb-2 flex flex-col gap-1">
              {roles.map((r) => (
                <div key={r} className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="truncate">{r}</span>
                  <button
                    className="shrink-0 font-bold opacity-50 hover:opacity-100"
                    title="Supprimer"
                    onClick={() => onRolesChange(roles.filter((x) => x !== r))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                const v = newRole.trim();
                if (v && !roles.includes(v)) onRolesChange([...roles, v]);
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

      <div className="relative shrink-0">
        <ComicButton onClick={() => setMenuOpen((v) => !v)} title="Check-lists enregistrées">
          Ouvrir
        </ComicButton>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border-[2.5px] border-black bg-white shadow-comic-lg">
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

      <ComicButton onClick={onNew}>Nouveau</ComicButton>

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
      <ComicButton onClick={() => fileRef.current?.click()}>Importer</ComicButton>
      <ComicButton onClick={onExportJson}>Export JSON</ComicButton>
      <ComicButton onClick={onPrint}>Imprimer / PDF</ComicButton>
      <ComicButton onClick={onSave} variant="solid">
        Sauvegarder
      </ComicButton>
    </header>
  );
}
