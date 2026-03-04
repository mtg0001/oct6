import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCurrentUser, useUsuarios } from "@/hooks/useUsuarios";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Smile,
  Search,
  X,
  FileText,
  Download,
  Mic,
  Play,
  Pause,
  Plus,
  Image,
  File,
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

const EMOJI_LIST = [
  "😀","😂","😍","🥰","😎","🤩","😢","😡","👍","👎",
  "❤️","🔥","🎉","✅","⭐","💯","🙏","👏","🤝","💪",
  "😴","🤔","😱","🥳","😈","💀","🤡","🙄","😤","🫡",
];

// ─── Audio Player Component ───
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
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play().catch(() => {}); }
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [nudging, setNudging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (currentUser?.id) {
      supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("conversation_id", activeConversation)
        .neq("sender_id", currentUser.id)
        .eq("read", false)
        .then();
    }
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
        if (newMsg.message_type === "nudge" && newMsg.sender_id !== currentUser?.id) {
          triggerNudge();
        }
        if (newMsg.sender_id !== currentUser?.id) {
          supabase.from("chat_messages").update({ read: true }).eq("id", newMsg.id).then();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversation, currentUser?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, activeConversation]);

  const openConversation = useCallback(async (partnerId: string) => {
    if (!currentUser?.id) {
      toast.error("Aguarde, carregando seu usuário...");
      return;
    }

    setChatPartnerId(partnerId);
    const pair = [currentUser.id, partnerId].sort();
    const findByPair = (list: Conversation[]) =>
      list.find((c) => [c.participant_1, c.participant_2].sort().join() === pair.join());

    const localConversation = findByPair(conversations);
    if (localConversation) {
      setActiveConversation(localConversation.id);
      return;
    }

    try {
      const orFilter = `and(participant_1.eq.${pair[0]},participant_2.eq.${pair[1]}),and(participant_1.eq.${pair[1]},participant_2.eq.${pair[0]})`;

      const { data: existingRows, error: existingError } = await supabase
        .from("chat_conversations")
        .select("*")
        .or(orFilter)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (existingError) throw existingError;

      const existingFromDb = (existingRows?.[0] ?? null) as Conversation | null;
      if (existingFromDb) {
        setConversations((prev) =>
          prev.some((c) => c.id === existingFromDb.id) ? prev : [existingFromDb, ...prev]
        );
        setActiveConversation(existingFromDb.id);
        return;
      }

      const { data: newConversation, error: createError } = await supabase
        .from("chat_conversations")
        .insert({ participant_1: pair[0], participant_2: pair[1] })
        .select()
        .single();

      if (createError) throw createError;

      if (newConversation) {
        setConversations((prev) => [newConversation as Conversation, ...prev]);
        setActiveConversation(newConversation.id);
      }
    } catch (err: any) {
      console.error("Erro ao abrir conversa:", err);
      toast.error("Não foi possível abrir a conversa.");
    }
  }, [currentUser?.id, conversations]);

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
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConversation);
    if (type === "text") setMessageText("");
    setShowEmojis(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    const path = `${currentUser.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (error) { toast.error("Erro ao enviar arquivo"); return; }
    await sendMessage("file", file.name, path, file.name);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
    setShowAttachMenu(false);
  };

  // ─── Voice Recording ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) return; // too short
        if (!currentUser?.id) return;
        const fileName = `audio_${Date.now()}.webm`;
        const path = `${currentUser.id}/${fileName}`;
        const { error } = await supabase.storage.from("chat-attachments").upload(path, blob);
        if (error) { toast.error("Erro ao enviar áudio"); return; }
        await sendMessage("audio", "🎤 Mensagem de voz", path, fileName);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error("Permissão de microfone negada");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const triggerNudge = () => {
    setNudging(true);
    try {
      const audio = new Audio("/sounds/nudge.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
    setTimeout(() => setNudging(false), 500);
  };
  const sendNudge = () => sendMessage("nudge", "🫨 Chamou sua atenção!");

  const getStatus = (usuarioId: string) => getPresenceStatus(presences, usuarioId);
  const getLastSeen = (usuarioId: string) => getPresenceLastSeen(presences, usuarioId);
  const formatLastSeen = (usuarioId: string) => {
    const lastSeen = getLastSeen(usuarioId);
    if (!lastSeen) return "";
    return format(new Date(lastSeen), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const otherUsers = usuarios.filter((u) => u.id !== currentUser?.id && u.ativo);
  const onlineUsers = otherUsers.filter((u) => getStatus(u.id) !== "offline");
  const offlineUsers = otherUsers.filter((u) => getStatus(u.id) === "offline");
  const filteredOnline = onlineUsers.filter((u) => u.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOffline = offlineUsers.filter((u) => u.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const partnerUser = chatPartnerId ? usuarios.find((u) => u.id === chatPartnerId) : null;

  // Get last message preview for contact list
  const getLastMessage = (partnerId: string) => {
    const p1 = [currentUser?.id, partnerId].sort();
    const conv = conversations.find(c => [c.participant_1, c.participant_2].sort().join() === p1.join());
    if (!conv) return null;
    const convMsgs = messages.filter(m => m.conversation_id === conv.id);
    return convMsgs.length > 0 ? convMsgs[convMsgs.length - 1] : null;
  };

  return (
    <AppLayout>
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-[360px_1fr] h-[calc(100vh-7rem)] rounded-lg overflow-hidden border border-border shadow-lg",
        nudging && "animate-nudge"
      )}>
        {/* ─── LEFT: WhatsApp-style contact panel ─── */}
        <div className="bg-card flex flex-col border-r border-border">
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between" style={{ backgroundColor: "hsl(var(--primary) / 0.08)" }}>
            <div className="flex items-center gap-3">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                  {currentUser?.nome?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-foreground">Conversas</span>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar ou começar uma nova conversa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-xs pl-10 rounded-lg bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Contact list */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/50">
              {/* Online */}
              {filteredOnline.length > 0 && (
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                    Online ({filteredOnline.length})
                  </span>
                </div>
              )}
              {filteredOnline.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openConversation(u.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    chatPartnerId === u.id && "bg-muted"
                  )}
                >
                  <div className="relative shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.nome} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-foreground text-sm font-bold">
                        {u.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <span className={cn("absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card", getStatusColor(getStatus(u.id)))} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{u.nome}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatLastSeen(u.id) ? format(new Date(getLastSeen(u.id)!), "HH:mm") : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getStatusLabel(getStatus(u.id))}
                    </p>
                  </div>
                </button>
              ))}

              {/* Offline */}
              {filteredOffline.length > 0 && (
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Offline ({filteredOffline.length})
                  </span>
                </div>
              )}
              {filteredOffline.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openConversation(u.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 opacity-60 hover:opacity-80",
                    chatPartnerId === u.id && "bg-muted opacity-100"
                  )}
                >
                  <div className="relative shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.nome} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                        {u.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{u.nome}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatLastSeen(u.id) ? format(new Date(getLastSeen(u.id)!), "HH:mm") : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      Visto por último: {formatLastSeen(u.id) || "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ─── RIGHT: Chat Area with WhatsApp wallpaper ─── */}
        <div className="flex flex-col min-h-0 overflow-hidden bg-card">
          {activeConversation && partnerUser ? (
            <>
              {/* Chat header - WhatsApp style */}
              <div className="h-14 px-4 flex items-center justify-between shrink-0" style={{ backgroundColor: "hsl(var(--primary) / 0.08)" }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setActiveConversation(null); setChatPartnerId(null); }} className="lg:hidden mr-1">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div className="relative">
                    {partnerUser.avatarUrl ? (
                      <img src={partnerUser.avatarUrl} alt={partnerUser.nome} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-foreground text-sm font-bold">
                        {partnerUser.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card", getStatusColor(getStatus(partnerUser.id)))} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{partnerUser.nome}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {getStatusLabel(getStatus(partnerUser.id))}
                      {getStatus(partnerUser.id) === "offline" && formatLastSeen(partnerUser.id) && (
                        <span> · Visto {formatLastSeen(partnerUser.id)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              {/* Messages area with WhatsApp wallpaper */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-12 lg:px-16 py-4"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundColor: "hsl(var(--muted) / 0.3)",
                }}
              >
                <div className="space-y-1 max-w-3xl mx-auto">
                  {messages.length === 0 ? (
                    <div className="min-h-[50vh] flex items-center justify-center px-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Nenhuma mensagem ainda com {partnerUser.nome.split(" ")[0]}. Envie a primeira mensagem abaixo.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === currentUser?.id;
                      if (msg.message_type === "nudge") {
                        return (
                          <div key={msg.id} className="flex justify-center py-1">
                            <span className="text-[11px] text-amber-600 font-medium bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-400 px-4 py-1 rounded-lg shadow-sm">
                              🫨 {isMine ? "Você chamou a atenção" : `${partnerUser?.nome?.split(" ")[0]} chamou sua atenção!`}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "relative max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm",
                            isMine
                              ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground"
                              : "bg-card text-foreground"
                          )}
                            style={{ borderRadius: isMine ? "8px 0 8px 8px" : "0 8px 8px 8px" }}
                          >
                            {/* WhatsApp-style tail */}
                            <div className={cn(
                              "absolute top-0 w-3 h-3 overflow-hidden",
                              isMine ? "-right-2" : "-left-2"
                            )}>
                              <div className={cn(
                                "w-4 h-4 rotate-45 origin-bottom-left",
                                isMine
                                  ? "bg-[#d9fdd3] dark:bg-[#005c4b]"
                                  : "bg-card"
                              )} />
                            </div>

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

              {/* Emoji picker */}
              {showEmojis && (
                <div className="shrink-0 border-t border-border p-2 bg-card">
                  <div className="flex flex-wrap gap-1 max-w-3xl mx-auto">
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

              {/* Input area - WhatsApp style */}
              <div className="shrink-0 px-4 py-2 flex items-center gap-2" style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}>
                {isRecording ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive" onClick={cancelRecording}>
                      <X className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-card rounded-full">
                      <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm text-destructive font-medium">{formatRecordingTime(recordingTime)}</span>
                      <span className="text-xs text-muted-foreground">Gravando...</span>
                    </div>
                    <Button size="icon" className="h-10 w-10 rounded-full shrink-0 bg-primary" onClick={stopRecording}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setShowAttachMenu(!showAttachMenu)}>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                          <button
                            onClick={() => { photoInputRef.current?.click(); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <Image className="h-4 w-4 text-primary" />
                            Fotos e vídeos
                          </button>
                          <button
                            onClick={() => { fileInputRef.current?.click(); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <File className="h-4 w-4 text-primary" />
                            Documentos
                          </button>
                        </div>
                      )}
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={sendNudge} title="Chamar atenção">
                      <span className="text-lg">🫨</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setShowEmojis(!showEmojis)}>
                      <Smile className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div className="flex-1">
                      <Input
                        placeholder="Digite uma mensagem"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        className="h-10 rounded-lg border-0 bg-card text-sm focus-visible:ring-1"
                      />
                    </div>
                    {messageText.trim() ? (
                      <Button size="icon" className="h-10 w-10 rounded-full shrink-0 bg-primary" onClick={() => sendMessage()}>
                        <Send className="h-5 w-5" />
                      </Button>
                    ) : (
                      <Button size="icon" className="h-10 w-10 rounded-full shrink-0 bg-primary" onClick={startRecording}>
                        <Mic className="h-5 w-5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center text-center"
              style={{ backgroundColor: "hsl(var(--muted) / 0.15)" }}
            >
              <div className="mb-6">
                <div className="h-48 w-48 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Send className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-light text-foreground mb-2">Chat Octarte</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Envie e receba mensagens em tempo real. Selecione um contato para começar.
                </p>
              </div>
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

// Helper component to load signed URL for audio
function AudioPlayerWrapper({ fileUrl, isMine }: { fileUrl: string; isMine: boolean }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  useEffect(() => {
    const load = async () => {
      const isPath = fileUrl && !fileUrl.startsWith("http");
      if (isPath) {
        const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(fileUrl, 3600);
        if (data?.signedUrl) setSignedUrl(data.signedUrl);
      } else {
        setSignedUrl(fileUrl);
      }
    };
    load();
  }, [fileUrl]);
  if (!signedUrl) return <span className="text-xs opacity-50">Carregando áudio...</span>;
  return <AudioPlayer src={signedUrl} isMine={isMine} />;
}

export default Chat;
