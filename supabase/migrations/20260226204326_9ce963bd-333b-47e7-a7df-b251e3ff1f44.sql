
-- Create andamentos table specifically for chamados TI
CREATE TABLE public.andamentos_ti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados_ti(id) ON DELETE CASCADE,
  texto text NOT NULL,
  anexos text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.andamentos_ti ENABLE ROW LEVEL SECURITY;

-- Anyone who can view the chamado can read its andamentos
CREATE POLICY "Users read andamentos_ti"
  ON public.andamentos_ti FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chamados_ti c
      WHERE c.id = andamentos_ti.chamado_id
        AND (
          c.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
          OR is_admin(auth.uid())
        )
    )
  );

-- Anyone who can view the chamado can insert andamentos
CREATE POLICY "Users insert andamentos_ti"
  ON public.andamentos_ti FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chamados_ti c
      WHERE c.id = andamentos_ti.chamado_id
        AND (
          c.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
          OR is_admin(auth.uid())
        )
    )
  );
