"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import { arrayMove } from "@dnd-kit/sortable";
import { Toolbar } from "@/components/Toolbar";
import { ImportPanel } from "@/components/ImportPanel";
import { ChecklistView } from "@/components/ChecklistView";
import { SharedSessionBar } from "@/components/SharedSessionBar";
import { ComicButton } from "@/components/ComicButton";
import { DEFAULT_ROLES } from "@/lib/catalog";
import { generateSections } from "@/lib/generate";
import { buildMasterChecklist } from "@/lib/masterChecklist";
import { ParsedLine, parseEquipmentList } from "@/lib/parse";
import {
  ChecklistProject,
  ChecklistSection,
  deleteProject,
  listProjects,
  loadCurrent,
  loadRoles,
  newProjectId,
  saveCurrent,
  saveRoles,
  upsertProject,
} from "@/lib/storage";
import { SharedPayload, useSharedSession } from "@/lib/useSharedSession";
import { useIsMobile } from "@/lib/useIsMobile";

interface Session {
  loaded: boolean;
  projectId: string;
  title: string;
  rawText: string;
  parsedLines: ParsedLine[] | null;
  sections: ChecklistSection[];
}

const EMPTY_SESSION: Omit<Session, "loaded" | "projectId"> = {
  title: "Nouvelle check-list",
  rawText: "",
  parsedLines: null,
  sections: [],
};

export default function Home() {
  const [session, setSession] = useState<Session>({
    loaded: false,
    projectId: "",
    ...EMPTY_SESSION,
  });
  const [projects, setProjects] = useState<ChecklistProject[]>([]);
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const current = loadCurrent();
    const initial: Omit<Session, "loaded"> = current
      ? {
          projectId: current.id,
          title: current.name,
          rawText: current.rawText,
          parsedLines: null,
          sections: current.sections,
        }
      : { projectId: newProjectId(), ...EMPTY_SESSION };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store (localStorage) on mount
    setSession({ loaded: true, ...initial });
    setProjects(listProjects());
    setRoles(loadRoles(DEFAULT_ROLES));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const setTitle = useCallback((title: string) => {
    setSession((s) => ({ ...s, title }));
  }, []);

  const setRawText = useCallback((rawText: string) => {
    setSession((s) => ({ ...s, rawText }));
  }, []);

  const handleAnalyze = useCallback(() => {
    setSession((s) => ({ ...s, parsedLines: parseEquipmentList(s.rawText) }));
  }, []);

  const handleUpdateLine = useCallback((id: string, patch: Partial<ParsedLine>) => {
    setSession((s) => ({
      ...s,
      parsedLines: s.parsedLines?.map((l) => (l.id === id ? { ...l, ...patch } : l)) ?? null,
    }));
  }, []);

  const handleGenerate = useCallback(() => {
    setSession((s) => (s.parsedLines ? { ...s, sections: generateSections(s.parsedLines) } : s));
  }, []);

  const handleLoadMasterChecklist = useCallback(() => {
    if (
      session.sections.length > 0 &&
      !window.confirm("Charger la Master Checklist ? La check-list actuelle sera remplacée.")
    ) {
      return;
    }
    setSession((s) => ({ ...s, sections: buildMasterChecklist() }));
  }, [session.sections.length]);

  const updateSections = useCallback((updater: (sections: ChecklistSection[]) => ChecklistSection[]) => {
    setSession((s) => ({ ...s, sections: updater(s.sections) }));
  }, []);

  const handleToggle = useCallback(
    (sectionId: string, itemId: string) => {
      updateSections((sections) =>
        sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const items = sec.items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it));
          const wasComplete = sec.items.length > 0 && sec.items.every((it) => it.checked);
          const isComplete = items.length > 0 && items.every((it) => it.checked);
          // auto-collapse the moment a section is fully checked off; leave the
          // collapsed state alone otherwise, so reopening it manually sticks
          const collapsed = !wasComplete && isComplete ? true : sec.collapsed;
          return { ...sec, items, collapsed };
        })
      );
    },
    [updateSections]
  );

  const handleToggleSectionCollapse = useCallback(
    (sectionId: string) => {
      updateSections((sections) =>
        sections.map((sec) => (sec.id !== sectionId ? sec : { ...sec, collapsed: !sec.collapsed }))
      );
    },
    [updateSections]
  );

  const handleRoleChange = useCallback(
    (sectionId: string, itemId: string, role: string) => {
      updateSections((sections) =>
        sections.map((sec) =>
          sec.id !== sectionId
            ? sec
            : { ...sec, items: sec.items.map((it) => (it.id === itemId ? { ...it, role } : it)) }
        )
      );
    },
    [updateSections]
  );

  const handleAddItem = useCallback(
    (sectionId: string, label: string) => {
      updateSections((sections) =>
        sections.map((sec) =>
          sec.id !== sectionId
            ? sec
            : {
                ...sec,
                items: [
                  ...sec.items,
                  { id: `item_${Math.random().toString(36).slice(2, 9)}`, label, checked: false, role: "" },
                ],
              }
        )
      );
    },
    [updateSections]
  );

  const handleRemoveItem = useCallback(
    (sectionId: string, itemId: string) => {
      updateSections((sections) =>
        sections.map((sec) => (sec.id !== sectionId ? sec : { ...sec, items: sec.items.filter((it) => it.id !== itemId) }))
      );
    },
    [updateSections]
  );

  const handleCommentChange = useCallback(
    (sectionId: string, itemId: string, comment: string) => {
      updateSections((sections) =>
        sections.map((sec) =>
          sec.id !== sectionId
            ? sec
            : { ...sec, items: sec.items.map((it) => (it.id === itemId ? { ...it, comment } : it)) }
        )
      );
    },
    [updateSections]
  );

  const handleReorderSections = useCallback(
    (activeId: string, overId: string) => {
      updateSections((sections) => {
        const oldIndex = sections.findIndex((sec) => sec.id === activeId);
        const newIndex = sections.findIndex((sec) => sec.id === overId);
        if (oldIndex === -1 || newIndex === -1) return sections;
        return arrayMove(sections, oldIndex, newIndex);
      });
    },
    [updateSections]
  );

  const handleReorderItems = useCallback(
    (sectionId: string, activeId: string, overId: string) => {
      updateSections((sections) =>
        sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const oldIndex = sec.items.findIndex((it) => it.id === activeId);
          const newIndex = sec.items.findIndex((it) => it.id === overId);
          if (oldIndex === -1 || newIndex === -1) return sec;
          return { ...sec, items: arrayMove(sec.items, oldIndex, newIndex) };
        })
      );
    },
    [updateSections]
  );

  const buildProject = useCallback(
    (): ChecklistProject => ({
      id: session.projectId,
      name: session.title,
      rawText: session.rawText,
      sections: session.sections,
      updatedAt: Date.now(),
    }),
    [session.projectId, session.title, session.rawText, session.sections]
  );

  const handleSave = useCallback(() => {
    const project = buildProject();
    saveCurrent(project);
    upsertProject(project);
    setProjects(listProjects());
    setToast("Check-list sauvegardée");
  }, [buildProject]);

  const handleNew = useCallback(() => {
    if (
      session.sections.length > 0 &&
      !window.confirm("Créer une nouvelle check-list ? Les modifications non sauvegardées seront perdues.")
    ) {
      return;
    }
    setSession({ loaded: true, projectId: newProjectId(), ...EMPTY_SESSION });
  }, [session.sections.length]);

  const handleOpenProject = useCallback((id: string) => {
    const project = listProjects().find((p) => p.id === id);
    if (!project) return;
    setSession({
      loaded: true,
      projectId: project.id,
      title: project.name,
      rawText: project.rawText,
      parsedLines: null,
      sections: project.sections,
    });
    saveCurrent(project);
  }, []);

  const handleDeleteProject = useCallback(
    (id: string) => {
      if (!window.confirm("Supprimer cette check-list sauvegardée ?")) return;
      deleteProject(id);
      setProjects(listProjects());
      if (id === session.projectId) setToast("Check-list supprimée");
    },
    [session.projectId]
  );

  const handleExportJson = useCallback(() => {
    const project = buildProject();
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.trim().replace(/\s+/g, "_") || "checklist"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildProject, session.title]);

  const handleImportJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const project = JSON.parse(String(reader.result)) as ChecklistProject;
        if (!Array.isArray(project.sections)) throw new Error("invalid");
        setSession({
          loaded: true,
          projectId: project.id || newProjectId(),
          title: project.name || "Check-list importée",
          rawText: project.rawText ?? "",
          parsedLines: null,
          sections: project.sections,
        });
        setToast("Check-list importée");
      } catch {
        window.alert("Fichier invalide.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleRolesChange = useCallback((next: string[]) => {
    setRoles(next);
    saveRoles(next);
  }, []);

  const applyRemoteChecklist = useCallback((payload: SharedPayload) => {
    setSession((s) => ({ ...s, title: payload.title, rawText: payload.rawText, sections: payload.sections }));
  }, []);

  const sharedPayload = useMemo<SharedPayload>(
    () => ({ title: session.title, rawText: session.rawText, sections: session.sections }),
    [session.title, session.rawText, session.sections]
  );
  const shared = useSharedSession(sharedPayload, applyRemoteChecklist);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocusMode((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!session.loaded) return null;

  return (
    <div className="flex h-screen flex-col bg-white">
      {!focusMode && (
        <Toolbar
          title={session.title}
          onTitleChange={setTitle}
          onNew={handleNew}
          onSave={handleSave}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onPrint={handlePrint}
          onLoadMasterChecklist={handleLoadMasterChecklist}
          projects={projects}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
          roles={roles}
          onRolesChange={handleRolesChange}
          isMobile={isMobile}
        />
      )}
      {!focusMode && (
        <SharedSessionBar
          sessionName={shared.sessionName}
          status={shared.status}
          error={shared.error}
          onJoin={shared.join}
          onLeave={shared.leave}
        />
      )}
      <div className={`relative flex min-h-0 flex-1 ${isMobile ? "flex-col overflow-y-auto" : ""}`}>
        {isMobile ? (
          <ImportPanel
            rawText={session.rawText}
            onRawTextChange={setRawText}
            onAnalyze={handleAnalyze}
            parsedLines={session.parsedLines}
            onUpdateLine={handleUpdateLine}
            onGenerate={handleGenerate}
            isMobile
            hasChecklist={session.sections.length > 0}
          />
        ) : (
          <>
            {!sidebarCollapsed && (
              <ImportPanel
                rawText={session.rawText}
                onRawTextChange={setRawText}
                onAnalyze={handleAnalyze}
                parsedLines={session.parsedLines}
                onUpdateLine={handleUpdateLine}
                onGenerate={handleGenerate}
                isMobile={false}
                hasChecklist={session.sections.length > 0}
              />
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Afficher la liste de matériel" : "Réduire la liste de matériel"}
              className="no-print flex w-5 shrink-0 items-center justify-center border-r-[3px] border-black bg-white text-black/40 hover:bg-black hover:text-white"
            >
              <span className={`inline-block text-xs transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}>
                ‹
              </span>
            </button>
          </>
        )}
        <main className={isMobile ? "min-w-0" : "min-w-0 flex-1 overflow-y-auto"}>
          {session.sections.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center gap-4 p-10 text-center ${isMobile ? "min-h-[40vh]" : "h-full"}`}
            >
              <p className="font-display max-w-sm text-lg uppercase leading-snug text-black/30">
                Analysez une liste de matériel pour générer la check-list d&apos;essai caméra
              </p>
              <p className="text-xs font-semibold text-black/40">— ou —</p>
              <ComicButton onClick={handleLoadMasterChecklist} variant="solid">
                Charger la Master Checklist
              </ComicButton>
            </div>
          ) : (
            <ChecklistView
              sections={session.sections}
              roles={roles}
              onToggle={handleToggle}
              onRoleChange={handleRoleChange}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onToggleCollapse={handleToggleSectionCollapse}
              onCommentChange={handleCommentChange}
              onReorderSections={handleReorderSections}
              onReorderItems={handleReorderItems}
              isMobile={isMobile}
            />
          )}
        </main>
        <button
          type="button"
          onClick={() => setFocusMode((v) => !v)}
          title={focusMode ? "Quitter le plein écran (Ctrl/Cmd+F)" : "Plein écran (Ctrl/Cmd+F)"}
          className="no-print fixed bottom-11 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border-[2.5px] border-black bg-white shadow-comic-sm transition hover:bg-black hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          {focusMode ? (
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path
                d="M8 3H3v5M12 3h5v5M8 17H3v-5M12 17h5v-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path
                d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <div className="no-print pointer-events-none fixed bottom-2 right-3 z-10 flex items-center gap-1.5 opacity-60">
          <span className="text-[10px] font-semibold text-black">Powered by</span>
          <NextImage src="/logo-transpa.png" alt="Transpa" width={917} height={162} className="h-3 w-auto" />
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border-[2.5px] border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-comic">
          {toast}
        </div>
      )}
    </div>
  );
}
