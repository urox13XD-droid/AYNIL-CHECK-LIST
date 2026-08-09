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

export function useSharedSession(current: SharedPayload, applyRemote: (payload: SharedPayload) => void) {
  const [sessionName, setSessionName] = useState<string | null>(null);
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
    setStatus("offline");
    setError(null);
  }, []);

  const join = useCallback(
    async (rawName: string) => {
      if (!supabase) {
        setError("Le partage n'est pas configuré sur ce déploiement.");
        setStatus("error");
        return;
      }
      const id = slugify(rawName);
      if (!id) return;

      setStatus("connecting");
      setError(null);

      try {
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

        setSessionName(id);
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
    if (!sessionName || !client) return;
    const json = JSON.stringify(current);
    if (json === lastSyncedJson.current) return;

    const t = setTimeout(async () => {
      try {
        const { error: updateError } = await client.from("checklist_sessions").update({ data: current }).eq("id", sessionName);
        lastSyncedJson.current = json;
        setStatus(updateError ? "error" : "synced");
        if (updateError) setError(updateError.message);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Impossible d'envoyer les modifications.");
      }
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [sessionName, current]);

  // leave the channel behind on unmount
  useEffect(() => () => {
    if (channelRef.current) supabase?.removeChannel(channelRef.current);
  }, []);

  return { sessionName, status, error, join, leave };
}
