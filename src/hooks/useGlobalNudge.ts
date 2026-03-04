import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useUsuarios";

// Simple event emitter for nudge shake
const nudgeListeners = new Set<() => void>();

export function onNudgeShake(cb: () => void) {
  nudgeListeners.add(cb);
  return () => { nudgeListeners.delete(cb); };
}

function emitNudgeShake() {
  nudgeListeners.forEach((cb) => cb());
}

/**
 * Global listener: plays nudge sound and emits shake event
 * regardless of which page the user is on.
 */
export function useGlobalNudge() {
  const currentUser = useCurrentUser();

  const playNudgeSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/nudge.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const playMsnSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/msn-alert.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel("global-nudge-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const row = payload.new as any;
          if (row.sender_id === currentUser.id) return;

          // Check if this user is a participant
          const { data } = await supabase
            .from("chat_conversations")
            .select("participant_1, participant_2")
            .eq("id", row.conversation_id)
            .single();

          if (!data) return;
          if (data.participant_1 !== currentUser.id && data.participant_2 !== currentUser.id) return;

          if (row.message_type === "nudge") {
            playNudgeSound();
            emitNudgeShake();
          } else {
            playMsnSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, playNudgeSound, playMsnSound]);
}
