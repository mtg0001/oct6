-- Allow admins to permanently delete solicitacoes (for emptying trash)
CREATE POLICY "Admins can delete solicitacoes"
ON public.solicitacoes
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
