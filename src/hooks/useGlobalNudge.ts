import { useEffect, useCallback, useRef } from "react";
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

function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico", tag: `${title}-${Date.now()}` });
  } catch {}
}

/**
 * Global listener: plays sounds and notifications
 * regardless of which page the user is on.
 */
export function useGlobalNudge() {
  const currentUser = useCurrentUser();
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

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

  const playMsnOnlineSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/msn-online.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Chat messages listener
    const chatChannel = supabase
      .channel("global-nudge-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const row = payload.new as any;
          if (row.sender_id === currentUser.id) return;

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

    // Solicitações listener – sound + notification
    const solChannel = supabase
      .channel("global-sol-sound")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "solicitacoes" },
        (payload) => {
          const row = payload.new as any;
          const u = userRef.current;
          if (!u) return;
          if (row.solicitante_id === u.id) return;

          const isAdmin = u.administrador;
          const isDirector = u.diretoria?.length > 0 && row.diretor_area && u.diretoria.some((d: string) => d.toLowerCase() === row.diretor_area?.toLowerCase());
          const isLogistica = u.resolveLogisticaComprasGo || u.resolveLogisticaComprasSp;
          const isExpedicao = u.resolveExpedicaoGo || u.resolveExpedicaoSp;
          const isRH = u.resolveRecursosHumanosGo || u.resolveRecursosHumanosSp;
          const isCS = u.resolveCs;

          if (isAdmin || isDirector || isLogistica || isExpedicao || isRH || isCS) {
            playMsnOnlineSound();
            showBrowserNotification("Nova Solicitação", "Você recebeu uma nova Solicitação!!");
          }
        }
      )
      .subscribe();

    // Chamados TI listener – sound + notification
    const tiChannel = supabase
      .channel("global-ti-sound")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chamados_ti" },
        (payload) => {
          const row = payload.new as any;
          const u = userRef.current;
          if (!u) return;
          if (row.solicitante_id === u.id) return;

          if (u.administrador) {
            playMsnOnlineSound();
            showBrowserNotification("Novo Chamado de TI", "Você recebeu uma nova Solicitação!!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(solChannel);
      supabase.removeChannel(tiChannel);
    };
  }, [currentUser?.id, playNudgeSound, playMsnSound, playMsnOnlineSound]);
}
