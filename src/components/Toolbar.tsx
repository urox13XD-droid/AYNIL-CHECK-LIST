"use client";

import { useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { ComicButton } from "@/components/ComicButton";
import { ROLE_COLOR_PALETTE, Role } from "@/lib/storage";
import { useClickOutside } from "@/lib/useClickOutside";

export type ExportMode = "blank" | "full";

/** small colored square next to a role's name; clicking it opens a compact preset-color picker (an 8th slot opens a native color dialog for a custom color) */
function RoleColorPicker({ role, onChange }: { role: Role; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const pick = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        title="Choisir une couleur"
        onClick={() => setOpen((v) => !v)}
        style={{ backgroundColor: role.color }}
        className="h-5 w-5 shrink-0 rounded-md border-[1.5px] border-black"
      />
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-36 rounded-lg border-[2px] border-black bg-white p-2 shadow-comic-lg">
          <div className="grid grid-cols-4 gap-1.5">
            {ROLE_COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => pick(c)}
                style={{ backgroundColor: c, boxShadow: role.color === c ? "0 0 0 2px #000" : undefined }}
                className="h-7 w-7 rounded-md border border-black/30"
              />
            ))}
            <button
              type="button"
              title="Autre couleur…"
              onClick={() => customInputRef.current?.click()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-black/30 bg-[conic-gradient(from_0deg,red,yellow,lime,cyan,blue,magenta,red)] text-[10px] font-black text-white"
              style={{ textShadow: "0 0 2px rgba(0,0,0,0.8)" }}
            >
              +
            </button>
          </div>
          <input
            ref={customInputRef}
            type="color"
            value={role.color}
            onChange={(e) => pick(e.target.value)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

export function Toolbar({
  title,
  onTitleChange,
  onNew,
  onSave,
  onExportProject,
  onImportJson,
  onPrint,
  onLoadMasterChecklist,
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
  roles: Role[];
  onRolesChange: (roles: Role[]) => void;
  /** stacks title and actions on two rows, actions in a horizontally scrollable strip, so a phone-width screen doesn't have to fit everything at once */
  isMobile?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  const rolesRef = useClickOutside<HTMLDivElement>(rolesOpen, () => setRolesOpen(false));
  const exportRef = useClickOutside<HTMLDivElement>(exportOpen, () => setExportOpen(false));

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
    <div ref={rolesRef} className="relative shrink-0">
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
              <div key={r.name} className="flex flex-col gap-1.5 border-b-[1.5px] border-black/10 pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <RoleColorPicker
                    role={r}
                    onChange={(color) => onRolesChange(roles.map((x) => (x.name === r.name ? { ...x, color } : x)))}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-bold">{r.name}</span>
                </div>
                <div className="relative">
                  <input
                    value={r.assigneeName ?? ""}
                    onChange={(e) =>
                      onRolesChange(
                        roles.map((x) => (x.name === r.name ? { ...x, assigneeName: e.target.value } : x))
                      )
                    }
                    placeholder="Nom"
                    className="w-full rounded-md border-[1.5px] border-black/30 px-2 py-1 pr-6 text-[11px] font-semibold outline-none focus:border-black"
                  />
                  {!!r.assigneeName && (
                    <button
                      type="button"
                      title="Effacer le nom"
                      onClick={() =>
                        onRolesChange(roles.map((x) => (x.name === r.name ? { ...x, assigneeName: "" } : x)))
                      }
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-40 hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
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

  const exportMenu = (align: "left" | "right") => (
    <div ref={exportRef} className="relative shrink-0">
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

  const openButton = (
    <>
      {importInput}
      <ComicButton onClick={() => fileRef.current?.click()} title="Ouvrir un fichier .json">
        Ouvrir
      </ComicButton>
    </>
  );

  const printButtons = (
    <>
      <ComicButton onClick={onPrint} title="Imprimer la check-list">
        Imprimer
      </ComicButton>
      <ComicButton onClick={onPrint} title="Enregistrer en PDF">
        PDF
      </ComicButton>
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
          {openButton}
          <ComicButton onClick={onNew}>Nouveau</ComicButton>
          <ComicButton onClick={onLoadMasterChecklist}>Master Checklist</ComicButton>
          {exportMenu("left")}
          {printButtons}
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
      {openButton}
      <ComicButton onClick={onNew}>Nouveau</ComicButton>
      <ComicButton onClick={onLoadMasterChecklist}>Master Checklist</ComicButton>
      {exportMenu("right")}
      {printButtons}
    </header>
  );
}
