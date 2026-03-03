import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCurrentUser, useUsuarios } from "@/hooks/useUsuarios";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Paperclip,
  Send,
  Smile,
  Zap,
  Search,
  X,
  FileText,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import {
  usePresences,
  getPresenceStatus,
  getPresenceLastSeen,
  getStatusColor,
  getStatusLabel,
  type Presence,
} from "@/hooks/usePresence";

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  read: boolean;
  created_at: string;
}

// ─── Emoji picker data ───
const EMOJI_LIST = [
  "😀","😂","😍","🥰","😎","🤩","😢","😡","👍","👎",
  "❤️","🔥","🎉","✅","⭐","💯","🙏","👏","🤝","💪",
  "😴","🤔","😱","🥳","😈","💀","🤡","🙄","😤","🫡",
];

const Chat = () => {
  const currentUser = useCurrentUser();
  const usuarios = useUsuarios();
  const presences = usePresences();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [nudging, setNudging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load conversations ───
  useEffect(() => {
    if (!currentUser?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order("updated_at", { ascending: false });
      if (data) setConversations(data as Conversation[]);
    };
    load();
  }, [currentUser?.id]);

  // ─── Load messages for active conversation ───
  useEffect(() => {
    if (!activeConversation) return;
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeConversation)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    load();
    // Mark as read
    if (currentUser?.id) {
      supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("conversation_id", activeConversation)
        .neq("sender_id", currentUser.id)
        .eq("read", false)
        .then();
    }
    // Realtime
    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${activeConversation}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        // Nudge effect
        if (newMsg.message_type === "nudge" && newMsg.sender_id !== currentUser?.id) {
          triggerNudge();
        }
        // Mark as read
        if (newMsg.sender_id !== currentUser?.id) {
          supabase.from("chat_messages").update({ read: true }).eq("id", newMsg.id).then();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversation, currentUser?.id]);

  // ─── Auto-scroll ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Open/create conversation ───
  const openConversation = useCallback(async (partnerId: string) => {
    if (!currentUser?.id) return;
    setChatPartnerId(partnerId);
    // Check existing
    const p1 = [currentUser.id, partnerId].sort();
    const existing = conversations.find(
      (c) => [c.participant_1, c.participant_2].sort().join() === p1.join()
    );
    if (existing) {
      setActiveConversation(existing.id);
      return;
    }
    // Create new
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ participant_1: p1[0], participant_2: p1[1] })
      .select()
      .single();
    if (data) {
      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveConversation(data.id);
    }
    if (error) toast.error("Erro ao abrir conversa");
  }, [currentUser?.id, conversations]);

  // ─── Send message ───
  const sendMessage = async (type: string = "text", content?: string, fileUrl?: string, fileName?: string) => {
    if (!activeConversation || !currentUser?.id) return;
    const text = content || messageText.trim();
    if (type === "text" && !text) return;
    await supabase.from("chat_messages").insert({
      conversation_id: activeConversation,
      sender_id: currentUser.id,
      content: text,
      message_type: type,
      file_url: fileUrl || null,
      file_name: fileName || null,
    });
    // Update conversation timestamp
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConversation);
    if (type === "text") setMessageText("");
    setShowEmojis(false);
  };

  // ─── Send file ───
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    const path = `${currentUser.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (error) { toast.error("Erro ao enviar arquivo"); return; }
    // Store the storage path (not public URL) since bucket is private
    await sendMessage("file", file.name, path, file.name);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Nudge ───
  const triggerNudge = () => {
    setNudging(true);
    // Play MSN nudge sound
    try {
      const audio = new Audio("/sounds/nudge.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
    setTimeout(() => setNudging(false), 500);
  };
  const sendNudge = () => sendMessage("nudge", "🔔 Chamou sua atenção!");

  // ─── Helpers ───
  const getStatus = (usuarioId: string) => getPresenceStatus(presences, usuarioId);
  const getLastSeen = (usuarioId: string) => getPresenceLastSeen(presences, usuarioId);

  const formatLastSeen = (usuarioId: string) => {
    const lastSeen = getLastSeen(usuarioId);
    if (!lastSeen) return "";
    return format(new Date(lastSeen), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const otherUsers = usuarios.filter((u) => u.id !== currentUser?.id && u.ativo);
  const onlineUsers = otherUsers.filter((u) => getStatus(u.id) !== "offline");
  const offlineUsers = otherUsers.filter((u) => getStatus(u.id) === "offline");

  const filteredOnline = onlineUsers.filter((u) => u.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOffline = offlineUsers.filter((u) => u.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const partnerUser = chatPartnerId ? usuarios.find((u) => u.id === chatPartnerId) : null;

  return (
    <AppLayout>
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3 h-[calc(100vh-7rem)]",
        nudging && "animate-nudge"
      )}>
        {/* ─── LEFT: Online Users Panel ─── */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              Contatos
            </h2>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs pl-8"
              />
            </div>
          </div>

          {/* User list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* Online section */}
              {filteredOnline.length > 0 && (
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider px-2 py-1">
                  Online ({filteredOnline.length})
                </p>
              )}
              {filteredOnline.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openConversation(u.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full p-2 rounded-lg text-left transition-all duration-200",
                    "hover:bg-accent/50",
                    chatPartnerId === u.id && "bg-primary/10 border border-primary/30"
                  )}
                >
                  <div className="relative shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.nome} className="h-9 w-9 rounded-full object-cover border-2 border-card shadow-sm" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-card shadow-sm">
                        {u.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card", getStatusColor(getStatus(u.id)))} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{u.nome}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {getStatusLabel(getStatus(u.id))}
                      {formatLastSeen(u.id) && <span className="ml-1 opacity-70">· {formatLastSeen(u.id)}</span>}
                    </p>
                  </div>
                </button>
              ))}

              {/* Offline section */}
              {filteredOffline.length > 0 && (
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 mt-2">
                  Offline ({filteredOffline.length})
                </p>
              )}
              {filteredOffline.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openConversation(u.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full p-2 rounded-lg text-left transition-all duration-200 opacity-50",
                    "hover:bg-accent/50 hover:opacity-80",
                    chatPartnerId === u.id && "bg-primary/10 border border-primary/30 opacity-100"
                  )}
                >
                  <div className="relative shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.nome} className="h-9 w-9 rounded-full object-cover border-2 border-card" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border-2 border-card">
                        {u.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card", getStatusColor("offline"))} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{u.nome}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Visto por último: {formatLastSeen(u.id) || "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ─── RIGHT: Chat Area ─── */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {activeConversation && partnerUser ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    {partnerUser.avatarUrl ? (
                      <img src={partnerUser.avatarUrl} alt={partnerUser.nome} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {partnerUser.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card", getStatusColor(getStatus(partnerUser.id)))} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{partnerUser.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {getStatusLabel(getStatus(partnerUser.id))}
                      {getStatus(partnerUser.id) === "offline" && formatLastSeen(partnerUser.id) && (
                        <span className="ml-1">· Visto {formatLastSeen(partnerUser.id)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setActiveConversation(null); setChatPartnerId(null); }} className="lg:hidden">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === currentUser?.id;
                    if (msg.message_type === "nudge") {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-3 py-1 rounded-full animate-pulse">
                            🔔 {isMine ? "Você chamou a atenção" : `${partnerUser?.nome?.split(" ")[0]} chamou sua atenção!`}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 shadow-sm",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-accent text-accent-foreground rounded-bl-md"
                        )}>
                          {msg.message_type === "file" && msg.file_url ? (
                            <button
                              onClick={async () => {
                                // file_url stores the storage path; generate a signed URL
                                const isPath = msg.file_url && !msg.file_url.startsWith("http");
                                if (isPath) {
                                  const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(msg.file_url!, 300);
                                  if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                  else toast.error("Erro ao abrir arquivo");
                                } else {
                                  window.open(msg.file_url!, "_blank");
                                }
                              }}
                              className={cn("flex items-center gap-2 text-xs underline cursor-pointer", isMine ? "text-primary-foreground" : "text-foreground")}
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="truncate">{msg.file_name || "Arquivo"}</span>
                              <Download className="h-3 w-3 shrink-0" />
                            </button>
                          ) : (
                            <p className="text-xs break-words whitespace-pre-wrap">{msg.content}</p>
                          )}
                          <p className={cn(
                            "text-[9px] mt-1",
                            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Emoji picker */}
              {showEmojis && (
                <div className="border-t border-border p-2 bg-card">
                  <div className="flex flex-wrap gap-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { setMessageText((prev) => prev + emoji); setShowEmojis(false); }}
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="p-3 border-t border-border bg-card/80">
                {/* Textarea for message */}
                <textarea
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  className="w-full min-h-[80px] max-h-[160px] resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-2"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {/* Emoji button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setShowEmojis(!showEmojis)}
                      title="Emojis"
                    >
                      <Smile className="h-4 w-4 text-amber-500" />
                    </Button>

                    {/* Nudge button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={sendNudge}
                      title="Chamar atenção"
                    >
                      <Zap className="h-4 w-4 text-orange-500" />
                    </Button>

                    {/* File upload */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      title="Enviar arquivo"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Send button */}
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => sendMessage()}
                    disabled={!messageText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Chat Octarte</h3>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Selecione um contato na lista ao lado para iniciar uma conversa em tempo real.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nudge animation style */}
      <style>{`
        @keyframes nudge-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-nudge {
          animation: nudge-shake 0.5s ease-in-out;
        }
      `}</style>
    </AppLayout>
  );
};

export default Chat;
