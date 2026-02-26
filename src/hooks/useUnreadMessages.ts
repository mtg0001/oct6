import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useUsuarios";

export function useUnreadMessages() {
  const currentUser = useCurrentUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;

    const load = async () => {
      // Get all conversations for this user
      const { data: convos } = await supabase
        .from("chat_conversations")
        .select("id")
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`);

      if (!convos || convos.length === 0) {
        setUnreadCount(0);
        return;
      }

      const convoIds = convos.map((c) => c.id);

      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .neq("sender_id", currentUser.id)
        .eq("read", false);

      setUnreadCount(count || 0);
    };

    load();

    // Listen for new messages
    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  return unreadCount;
}
