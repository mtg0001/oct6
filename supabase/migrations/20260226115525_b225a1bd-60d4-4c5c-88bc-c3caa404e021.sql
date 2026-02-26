-- Allow all authenticated users to read all usuarios (needed for chat contacts)
CREATE POLICY "Authenticated users read all usuarios for chat"
ON public.usuarios
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow participants to update conversation timestamps
CREATE POLICY "Participants update own conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  (participant_1 = get_usuario_id_for_auth_user(auth.uid()))
  OR (participant_2 = get_usuario_id_for_auth_user(auth.uid()))
);
