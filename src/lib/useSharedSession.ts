"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { ChecklistSection } from "./storage";

export interface SharedPayload {
  title: string;
  rawText: string;
  sections: ChecklistSection[];
}

export type SyncStatus = "offline" | "connecting" | "synced" | "error";

const PUSH_DEBOUNCE_MS = 700;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 3-digit code, always in [100, 999] so it never has a leading zero */
function generateCode(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function useSharedSession(current: SharedPayload, applyRemote: (payload: SharedPayload) => void) {
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("offline");
  const [error, setError] = useState<string | null>(null);

  const lastSyncedJson = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const leave = useCallback(() => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    lastSyncedJson.current = null;
    setSessionName(null);
    setSessionCode(null);
    setRowId(null);
    setStatus("offline");
    setError(null);
  }, []);

  const join = useCallback(
    async (rawName: string, rawCode?: string) => {
      if (!supabase) {
        setError("Le partage n'est pas configuré sur ce déploiement.");
        setStatus("error");
        return;
      }
      const slug = slugify(rawName);
      if (!slug) return;
      const code = rawCode?.trim();
      if (code && !/^\d{3}$/.test(code)) {
        setError("Le code doit être composé de 3 chiffres.");
        setStatus("error");
        return;
      }

      setStatus("connecting");
      setError(null);

      try {
        let id: string;
        let finalCode: string;

        if (code) {
          // a code was chosen by hand — use it as-is, whether that session already exists
          // (join it) or not (create it under exactly that code)
          id = `${slug}-${code}`;
          finalCode = code;
        } else {
          // no code given — pick a fresh one at random, so two different teams naming
          // their session the same thing never collide by chance
          let attempts = 0;
          for (;;) {
            finalCode = generateCode();
            id = `${slug}-${finalCode}`;
            const { data: clash } = await supabase.from("checklist_sessions").select("id").eq("id", id).maybeSingle();
            if (!clash) break;
            attempts += 1;
            if (attempts > 20) {
              setError("Impossible de générer un code de session, réessaie.");
              setStatus("error");
              return;
            }
          }
        }

        const { data: existing, error: fetchError } = await supabase
          .from("checklist_sessions")
          .select("data")
          .eq("id", id)
          .maybeSingle();

        if (fetchError) {
          setError(fetchError.message);
          setStatus("error");
          return;
        }

        if (existing) {
          const payload = existing.data as SharedPayload;
          lastSyncedJson.current = JSON.stringify(payload);
          applyRemote(payload);
        } else {
          const payload = current;
          const { error: insertError } = await supabase.from("checklist_sessions").insert({ id, data: payload });
          if (insertError) {
            setError(insertError.message);
            setStatus("error");
            return;
          }
          lastSyncedJson.current = JSON.stringify(payload);
        }

        const channel = supabase
          .channel(`checklist_session_${id}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "checklist_sessions", filter: `id=eq.${id}` },
            (change) => {
              const incoming = (change.new as { data: SharedPayload }).data;
              const json = JSON.stringify(incoming);
              if (json === lastSyncedJson.current) return; // our own write echoed back
              lastSyncedJson.current = json;
              applyRemote(incoming);
            }
          )
          .subscribe();
        channelRef.current = channel;

        setRowId(id);
        setSessionName(slug);
        setSessionCode(finalCode);
        setStatus("synced");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de joindre le serveur de partage.");
        setStatus("error");
      }
    },
    [applyRemote, current]
  );

  // debounced push whenever local state drifts from what's on the server
  useEffect(() => {
    const client = supabase;
    if (!rowId || !client) return;
    const json = JSON.stringify(current);
    if (json === lastSyncedJson.current) return;

    const t = setTimeout(async () => {
      try {
        const { error: updateError } = await client.from("checklist_sessions").update({ data: current }).eq("id", rowId);
        lastSyncedJson.current = json;
        setStatus(updateError ? "error" : "synced");
        if (updateError) setError(updateError.message);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Impossible d'envoyer les modifications.");
      }
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [rowId, current]);

  // leave the channel behind on unmount
  useEffect(() => () => {
    if (channelRef.current) supabase?.removeChannel(channelRef.current);
  }, []);

  return { sessionName, sessionCode, status, error, join, leave };
}
