"use client";

import { useState } from "react";
import { ComicButton } from "@/components/ComicButton";
import { SyncStatus } from "@/lib/useSharedSession";

const STATUS_LABEL: Record<SyncStatus, string> = {
  offline: "Hors ligne",
  connecting: "Synchronisation…",
  synced: "Synchronisé",
  error: "Erreur de synchro",
};

const STATUS_DOT: Record<SyncStatus, string> = {
  offline: "bg-black/30",
  connecting: "bg-amber-500 animate-pulse",
  synced: "bg-green-600",
  error: "bg-red-600",
};

export function SharedSessionBar({
  sessionName,
  status,
  error,
  onJoin,
  onLeave,
}: {
  sessionName: string | null;
  status: SyncStatus;
  error: string | null;
  onJoin: (name: string) => void;
  onLeave: () => void;
}) {
  const [draft, setDraft] = useState("");

  if (sessionName) {
    return (
      <div className="no-print flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b-[2.5px] border-black bg-black/5 px-4 py-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs font-bold uppercase tracking-wide">
          Session partagée : <span className="font-mono normal-case">{sessionName}</span>
        </span>
        <span className="text-[10px] font-semibold text-black/50">{STATUS_LABEL[status]}</span>
        {error && <span className="text-[10px] font-semibold text-red-600">{error}</span>}
        <ComicButton onClick={onLeave} className="ml-auto">
          Quitter la session
        </ComicButton>
      </div>
    );
  }

  return (
    <form
      className="no-print flex items-center gap-2 border-b-[2.5px] border-black bg-black/5 px-4 py-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const v = draft.trim();
        if (v) onJoin(v);
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Session partagée</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Nom de session (ex. tournage-toto)"
        className="min-w-0 max-w-xs flex-1 rounded-md border-[1.5px] border-black/40 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-black"
      />
      <ComicButton type="submit">Rejoindre / Créer</ComicButton>
      {error && <span className="text-[10px] font-semibold text-red-600">{error}</span>}
    </form>
  );
}
