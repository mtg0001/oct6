import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useUsuarios";

export type PresenceStatus = "online" | "busy" | "away" | "offline";

export interface Presence {
  usuario_id: string;
  status: string;
  last_seen: string;
}

const HEARTBEAT_INTERVAL = 30_000; // 30s
const OFFLINE_THRESHOLD = 90_000; // 90s (allow some latency margin)

let _manualStatus: PresenceStatus = "online";
let _statusListeners: (() => void)[] = [];

function notifyStatusListeners() {
  _statusListeners.forEach((l) => l());
}

export function setManualStatus(status: PresenceStatus) {
  _manualStatus = status;
  notifyStatusListeners();
}

export function getManualStatus() {
  return _manualStatus;
}

/**
 * Global presence: sets user online on mount, heartbeats every 30s, goes offline on unmount.
 * Should be used ONCE in AppLayout.
 */
export function useGlobalPresence() {
  const currentUser = useCurrentUser();
  const [myStatus, setMyStatus] = useState<PresenceStatus>(_manualStatus);

  // Listen to manual status changes
  useEffect(() => {
    const listener = () => setMyStatus(_manualStatus);
    _statusListeners.push(listener);
    return () => {
      _statusListeners = _statusListeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const upsert = async () => {
      await supabase.from("user_presence").upsert(
        {
          usuario_id: currentUser.id,
          status: _manualStatus,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "usuario_id" }
      );
    };

    upsert();
    const interval = setInterval(upsert, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
      supabase.from("user_presence").upsert(
        {
          usuario_id: currentUser.id,
          status: "offline",
          last_seen: new Date().toISOString(),
        },
        { onConflict: "usuario_id" }
      );
    };
  }, [currentUser?.id, myStatus]);

  return myStatus;
}

/**
 * Hook to load and subscribe to all user presences (for Chat page).
 */
export function usePresences() {
  const [presences, setPresences] = useState<Presence[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("user_presence").select("*");
      if (data) setPresences(data as Presence[]);
    };
    load();
    const channel = supabase
      .channel("presence-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return presences;
}

export function getPresenceStatus(presences: Presence[], usuarioId: string): PresenceStatus {
  const p = presences.find((pr) => pr.usuario_id === usuarioId);
  if (!p) return "offline";
  const diff = Date.now() - new Date(p.last_seen).getTime();
  if (diff > OFFLINE_THRESHOLD) return "offline";
  return p.status as PresenceStatus;
}

export function getPresenceLastSeen(presences: Presence[], usuarioId: string): string | null {
  const p = presences.find((pr) => pr.usuario_id === usuarioId);
  return p?.last_seen || null;
}

export function getStatusColor(status: string) {
  switch (status) {
    case "online": return "bg-green-500";
    case "busy": return "bg-amber-500";
    case "away": return "bg-yellow-500";
    default: return "bg-muted";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "online": return "Online";
    case "busy": return "Ocupado";
    case "away": return "Ausente";
    default: return "Offline";
  }
}
