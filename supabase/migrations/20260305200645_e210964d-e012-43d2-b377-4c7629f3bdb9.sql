-- Allow admins to read all chat conversations
CREATE POLICY "Admins read all conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to read all chat messages
CREATE POLICY "Admins read all messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));