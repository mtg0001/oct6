
-- Add soft-delete columns to chamados_ti
ALTER TABLE public.chamados_ti
  ADD COLUMN IF NOT EXISTS excluido boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS excluido_em timestamptz,
  ADD COLUMN IF NOT EXISTS excluido_por text NOT NULL DEFAULT '';

-- Allow delete for users with pode_excluir_chamado
CREATE POLICY "Users can delete chamados_ti"
  ON public.chamados_ti
  FOR DELETE
  TO authenticated
  USING (true);
