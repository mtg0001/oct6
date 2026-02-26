
-- Tabela de presença online
CREATE TABLE public.user_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'busy', 'away', 'offline')),
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(usuario_id)
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read presence"
  ON public.user_presence FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users update own presence"
  ON public.user_presence FOR UPDATE
  USING (usuario_id = get_usuario_id_for_auth_user(auth.uid()));

CREATE POLICY "Users insert own presence"
  ON public.user_presence FOR INSERT
  WITH CHECK (usuario_id = get_usuario_id_for_auth_user(auth.uid()));

CREATE POLICY "Users delete own presence"
  ON public.user_presence FOR DELETE
  USING (usuario_id = get_usuario_id_for_auth_user(auth.uid()));

-- Tabela de conversas (para agrupar mensagens entre 2 usuários)
CREATE TABLE public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read own conversations"
  ON public.chat_conversations FOR SELECT
  USING (
    participant_1 = get_usuario_id_for_auth_user(auth.uid()) OR
    participant_2 = get_usuario_id_for_auth_user(auth.uid())
  );

CREATE POLICY "Authenticated users create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (
    participant_1 = get_usuario_id_for_auth_user(auth.uid()) OR
    participant_2 = get_usuario_id_for_auth_user(auth.uid())
  );

-- Tabela de mensagens do chat
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'nudge', 'emoji')),
  file_url text,
  file_name text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.participant_1 = get_usuario_id_for_auth_user(auth.uid()) OR c.participant_2 = get_usuario_id_for_auth_user(auth.uid()))
    )
  );

CREATE POLICY "Sender inserts messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = get_usuario_id_for_auth_user(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.participant_1 = get_usuario_id_for_auth_user(auth.uid()) OR c.participant_2 = get_usuario_id_for_auth_user(auth.uid()))
    )
  );

CREATE POLICY "Participants update messages (read status)"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.participant_1 = get_usuario_id_for_auth_user(auth.uid()) OR c.participant_2 = get_usuario_id_for_auth_user(auth.uid()))
    )
  );

-- Trigger para updated_at na conversations
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX idx_user_presence_usuario ON public.user_presence(usuario_id);
CREATE INDEX idx_chat_conversations_participants ON public.chat_conversations(participant_1, participant_2);

-- Storage bucket para anexos do chat
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

CREATE POLICY "Authenticated users upload chat files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view chat files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

-- Enable realtime para mensagens e presença
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
