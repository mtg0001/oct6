-- Allow participants to delete their own conversations (for duplicate cleanup)
CREATE POLICY "Participants delete own conversations"
ON public.chat_conversations
FOR DELETE
TO authenticated
USING (
  (participant_1 = get_usuario_id_for_auth_user(auth.uid()))
  OR (participant_2 = get_usuario_id_for_auth_user(auth.uid()))
);