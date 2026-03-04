import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useUsuarios";

export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function useRealtimeNotifications() {
  const currentUser = useCurrentUser();
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

  useEffect(() => {
    if (!currentUser?.id) return;

    // Listen for new solicitações
    const solChannel = supabase
      .channel("notif-solicitacoes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "solicitacoes" },
        (payload) => {
          const row = payload.new as any;
          const u = userRef.current;
          if (!u) return;
          // Don't notify the person who created it
          if (row.solicitante_id === u.id) return;

          const isAdmin = u.administrador;
          const isDirector = u.diretoria?.length > 0 && row.diretor_area && u.diretoria.some((d: string) => d.toLowerCase() === row.diretor_area?.toLowerCase());
          const isLogistica = (u.resolveLogisticaComprasGo || u.resolveLogisticaComprasSp);
          const isExpedicao = (u.resolveExpedicaoGo || u.resolveExpedicaoSp);
          const isRH = (u.resolveRecursosHumanosGo || u.resolveRecursosHumanosSp);
          const isCS = u.resolveCs;

          if (isAdmin || isDirector || isLogistica || isExpedicao || isRH || isCS) {
            showNotification(
              "Nova Solicitação",
              `${row.solicitante || "Alguém"} abriu uma solicitação de ${row.tipo || "serviço"}`
            );
          }
        }
      )
      .subscribe();

    // Listen for new chamados TI
    const tiChannel = supabase
      .channel("notif-chamados-ti")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chamados_ti" },
        (payload) => {
          const row = payload.new as any;
          const u = userRef.current;
          if (!u) return;
          if (row.solicitante_id === u.id) return;

          if (u.administrador) {
            showNotification(
              "Novo Chamado de TI",
              `${row.solicitante_nome || "Alguém"} abriu um chamado: ${row.categoria || ""}`
            );
          }
        }
      )
      .subscribe();

    // Listen for new chat messages
    const chatChannel = supabase
      .channel("notif-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as any;
          const u = userRef.current;
          if (!u) return;
          if (row.sender_id === u.id) return;

          // Only notify if this user is a participant
          supabase
            .from("chat_conversations")
            .select("participant_1, participant_2")
            .eq("id", row.conversation_id)
            .single()
            .then(async ({ data }) => {
              if (!data) return;
              if (data.participant_1 === u.id || data.participant_2 === u.id) {
                // Fetch sender name
                const senderId = row.sender_id;
                const { data: senderData } = await supabase
                  .from("usuarios")
                  .select("nome")
                  .eq("id", senderId)
                  .single();
                const senderName = senderData?.nome || "Alguém";
                const msgPreview = row.message_type === "nudge" ? "te enviou um nudge! 💥" : (row.content?.substring(0, 50) || "Nova mensagem");
                showNotification(senderName, msgPreview);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(solChannel);
      supabase.removeChannel(tiChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [currentUser?.id]);
}

function showNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: `${title}-${Date.now()}`,
    });
  } catch {
    // Notification API not available (e.g. mobile)
  }
}
