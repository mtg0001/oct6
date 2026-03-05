import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCurrentUser, useUsuarios } from "@/hooks/useUsuarios";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  FileText,
  Download,
  Mic,
  Play,
  Pause,
  ArrowLeft,
  MessageCircle,
  Eye,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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

// ─── Audio Player ───
function AudioPlayer({ src, isMine }: { src: string; isMine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => { setPlaying(false); setCurrentTime(0); };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause(); else audioRef.current.play().catch(() => {});
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", isMine ? "bg-white/20 hover:bg-white/30" : "bg-primary/20 hover:bg-primary/30")}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-1 bg-black/10 rounded-full overflow-hidden">
          <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[9px] opacity-70">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
      <Mic className="h-3 w-3 opacity-50 shrink-0" />
    </div>
  );
}

function AudioPlayerWrapper({ fileUrl, isMine }: { fileUrl: string; isMine: boolean }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (fileUrl.startsWith("http")) { setSignedUrl(fileUrl); return; }
    supabase.storage.from("chat-attachments").createSignedUrl(fileUrl, 3600).then(({ data }) => {
      if (data?.signedUrl) setSignedUrl(data.signedUrl);
    });
  }, [fileUrl]);
  if (!signedUrl) return <span className="text-xs opacity-50">Carregando áudio...</span>;
  return <AudioPlayer src={signedUrl} isMine={isMine} />;
}

export default function HistoricoChats() {
  const currentUser = useCurrentUser();
  const usuarios = useUsuarios();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userConversations, setUserConversations] = useState<(Conversation & { partnerId: string; partnerNome: string; msgCount: number })[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [viewingPartnerId, setViewingPartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Only chat-enabled users
  const chatUsers = usuarios.filter((u) => u.podeUsarChat !== false && u.ativo);
  const filtered = chatUsers.filter((u) => u.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  // Load conversations for selected user
  const loadConversations = useCallback(async (userId: string) => {
    setLoadingConvos(true);
    try {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (!data) { setUserConversations([]); return; }

      const convosWithInfo = await Promise.all(
        (data as Conversation[]).map(async (c) => {
          const partnerId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
          const partner = usuarios.find((u) => u.id === partnerId);
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", c.id);
          return {
            ...c,
            partnerId,
            partnerNome: partner?.nome || "Usuário desconhecido",
            msgCount: count || 0,
          };
        })
      );
      setUserConversations(convosWithInfo.filter((c) => c.msgCount > 0));
    } finally {
      setLoadingConvos(false);
    }
  }, [usuarios]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMsgs(true);
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(5000);
      if (data) setMessages(data as Message[]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) loadConversations(selectedUserId);
  }, [selectedUserId, loadConversations]);

  useEffect(() => {
    if (activeConversation) loadMessages(activeConversation);
  }, [activeConversation, loadMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const selectedUser = selectedUserId ? usuarios.find((u) => u.id === selectedUserId) : null;
  const viewingPartner = viewingPartnerId ? usuarios.find((u) => u.id === viewingPartnerId) : null;

  // Check admin
  if (currentUser && !currentUser.administrador) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] h-[calc(100dvh-7rem)] min-h-0 rounded-lg overflow-hidden border border-border shadow-lg">
        {/* LEFT PANEL */}
        <div className={cn("bg-card flex-col h-full min-h-0 border-r border-border", activeConversation ? "hidden lg:flex" : "flex")}>
          {/* Header */}
          <div className="h-14 px-4 flex items-center gap-3 shrink-0" style={{ backgroundColor: "hsl(var(--destructive) / 0.08)" }}>
            {selectedUserId && (
              <button onClick={() => { setSelectedUserId(null); setUserConversations([]); setActiveConversation(null); setViewingPartnerId(null); setMessages([]); }} className="shrink-0">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <Eye className="h-5 w-5 text-destructive" />
            <span className="text-sm font-semibold text-foreground">
              {selectedUserId ? `Conversas de ${selectedUser?.nome?.split(" ")[0]}` : "Histórico de Chats"}
            </span>
          </div>

          {/* Search */}
          <div className="px-3 py-2 bg-card shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={selectedUserId ? "Buscar conversa..." : "Buscar usuário..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-xs pl-10 rounded-lg bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {!selectedUserId ? (
              /* User list */
              <div className="divide-y divide-border/50">
                {filtered.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUserId(u.id); setSearchTerm(""); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="shrink-0">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.nome} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-foreground text-sm font-bold">
                          {u.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{u.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.departamento}</p>
                    </div>
                    <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              /* Conversations list */
              <div className="divide-y divide-border/50">
                {loadingConvos ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
                ) : userConversations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</div>
                ) : (
                  userConversations
                    .filter((c) => c.partnerNome.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((c) => {
                      const partner = usuarios.find((u) => u.id === c.partnerId);
                      return (
                        <button
                          key={c.id}
                          onClick={() => { setActiveConversation(c.id); setViewingPartnerId(c.partnerId); }}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                            activeConversation === c.id && "bg-muted"
                          )}
                        >
                          <div className="shrink-0">
                            {partner?.avatarUrl ? (
                              <img src={partner.avatarUrl} alt={c.partnerNome} className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                                {c.partnerNome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{c.partnerNome}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.msgCount} mensagen{c.msgCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {format(new Date(c.updated_at), "dd/MM/yy")}
                          </span>
                        </button>
                      );
                    })
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT: Messages (read-only) */}
        <div className={cn("relative flex-col h-full min-h-0 overflow-hidden bg-card", activeConversation ? "flex" : "hidden lg:flex")}>
          {activeConversation && selectedUser && viewingPartner ? (
            <>
              {/* Header */}
              <div className="h-14 px-4 flex items-center gap-3 shrink-0" style={{ backgroundColor: "hsl(var(--destructive) / 0.08)" }}>
                <button onClick={() => { setActiveConversation(null); setViewingPartnerId(null); setMessages([]); }} className="lg:hidden shrink-0">
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {selectedUser.nome.split(" ")[0]} ↔ {viewingPartner.nome.split(" ")[0]}
                  </span>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] border-destructive/30 text-destructive gap-1">
                  <Eye className="h-3 w-3" /> Somente leitura
                </Badge>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-12 lg:px-16 py-4"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundColor: "hsl(var(--muted) / 0.3)",
                }}
              >
                <div className="space-y-1 max-w-3xl mx-auto">
                  {loadingMsgs ? (
                    <div className="h-full min-h-[220px] flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full min-h-[220px] flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Nenhuma mensagem nesta conversa.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === selectedUserId;
                      const senderUser = usuarios.find((u) => u.id === msg.sender_id);
                      const senderName = senderUser?.nome?.split(" ")[0] || "?";

                      if (msg.message_type === "nudge") {
                        return (
                          <div key={msg.id} className="flex justify-center py-1">
                            <span className="text-[11px] text-amber-600 font-medium bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-400 px-4 py-1 rounded-lg shadow-sm">
                              🫨 {senderName} chamou a atenção!
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "relative max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm",
                              isMine
                                ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground"
                                : "bg-card text-foreground"
                            )}
                            style={{ borderRadius: isMine ? "8px 0 8px 8px" : "0 8px 8px 8px" }}
                          >
                            {/* Tail */}
                            <div className={cn("absolute top-0 w-3 h-3 overflow-hidden", isMine ? "-right-2" : "-left-2")}>
                              <div className={cn("w-4 h-4 rotate-45 origin-bottom-left", isMine ? "bg-[#d9fdd3] dark:bg-[#005c4b]" : "bg-card")} />
                            </div>

                            {/* Sender name */}
                            <p className={cn("text-[11px] font-semibold mb-0.5", isMine ? "text-emerald-700 dark:text-emerald-300" : "text-primary")}>
                              {senderName}
                            </p>

                            {msg.message_type === "audio" && msg.file_url ? (
                              <AudioPlayerWrapper fileUrl={msg.file_url} isMine={isMine} />
                            ) : msg.message_type === "file" && msg.file_url ? (
                              <button
                                onClick={async () => {
                                  const isPath = msg.file_url && !msg.file_url.startsWith("http");
                                  if (isPath) {
                                    const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(msg.file_url!, 300);
                                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                    else toast.error("Erro ao abrir arquivo");
                                  } else {
                                    window.open(msg.file_url!, "_blank");
                                  }
                                }}
                                className="flex items-center gap-2 text-xs underline cursor-pointer text-foreground"
                              >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate">{msg.file_name || "Arquivo"}</span>
                                <Download className="h-3 w-3 shrink-0" />
                              </button>
                            ) : (
                              <p className="text-[13px] break-words whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[10px] opacity-50">
                                {format(new Date(msg.created_at), "HH:mm")}
                              </span>
                              {isMine && (
                                <span className={cn("text-[10px]", msg.read ? "text-blue-500" : "opacity-40")}>
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* No input bar - read only notice */}
              <div className="mt-auto shrink-0 px-4 py-3 flex items-center justify-center gap-2 border-t border-border bg-muted/50">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Modo somente leitura — histórico de conversas</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedUserId ? "Selecione uma conversa para visualizar" : "Selecione um usuário para ver suas conversas"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
