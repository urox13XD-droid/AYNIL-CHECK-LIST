"use client";

import { useState } from "react";
import { SyncStatus } from "@/lib/useSharedSession";

/** ComicButton's look at a smaller scale, for the compact controls in the Toolbar */
function CompactButton({ children, type = "button", onClick }: { children: React.ReactNode; type?: "button" | "submit"; onClick?: () => void }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="shrink-0 rounded-md border-[1.5px] border-black bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black transition hover:bg-black hover:text-white active:translate-x-[1px] active:translate-y-[1px]"
    >
      {children}
    </button>
  );
}

const STATUS_DOT: Record<SyncStatus, string> = {
  offline: "bg-black/30",
  connecting: "bg-amber-500 animate-pulse",
  synced: "bg-green-600",
  error: "bg-red-600",
};

const STATUS_LABEL: Record<SyncStatus, string> = {
  offline: "Hors ligne",
  connecting: "Synchronisation…",
  synced: "Synchronisé",
  error: "Erreur de synchro",
};

/** compact, sits inline at the right edge of the Toolbar — same spot/scale as the shared-session controls on AYNIL Condition Report */
export function SharedSessionBar({
  sessionName,
  sessionCode,
  status,
  error,
  onJoin,
  onLeave,
}: {
  sessionName: string | null;
  sessionCode: string | null;
  status: SyncStatus;
  error: string | null;
  onJoin: (name: string, code?: string) => void;
  onLeave: () => void;
}) {
  const [draftName, setDraftName] = useState("");
  const [draftCode, setDraftCode] = useState("");

  if (sessionName) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} title={STATUS_LABEL[status]} />
        <span className="max-w-[100px] truncate font-mono text-[11px] font-bold" title={sessionName}>
          {sessionName}
        </span>
        {sessionCode && (
          <span className="rounded-md border-[1.5px] border-black bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider">
            {sessionCode}
          </span>
        )}
        {error && (
          <span className="max-w-[140px] truncate text-[10px] font-semibold text-red-600" title={error}>
            {error}
          </span>
        )}
        <CompactButton onClick={onLeave}>Quitter</CompactButton>
      </div>
    );
  }

  return (
    <form
      className="flex shrink-0 items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const name = draftName.trim();
        const code = draftCode.trim();
        if (name) onJoin(name, code || undefined);
      }}
    >
      <input
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        placeholder="Session (ex. tournage)"
        className="w-32 min-w-0 rounded-md border-[1.5px] border-black/30 bg-white px-2 py-1 text-[10px] font-semibold outline-none focus:border-black"
      />
      <input
        value={draftCode}
        onChange={(e) => setDraftCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder="Code"
        title="Laisse vide pour générer un code automatiquement, ou choisis-en un toi-même"
        inputMode="numeric"
        className="w-12 shrink-0 rounded-md border-[1.5px] border-black/30 bg-white px-2 py-1 text-center font-mono text-[10px] font-semibold outline-none focus:border-black"
      />
      <CompactButton type="submit">Rejoindre / Créer</CompactButton>
      {error && (
        <span className="max-w-[140px] truncate text-[10px] font-semibold text-red-600" title={error}>
          {error}
        </span>
      )}
    </form>
  );
}
