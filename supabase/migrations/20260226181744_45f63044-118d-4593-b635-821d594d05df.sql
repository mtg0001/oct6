
-- Add trash permissions to usuarios
ALTER TABLE public.usuarios ADD COLUMN pode_excluir_chamado boolean NOT NULL DEFAULT false;
ALTER TABLE public.usuarios ADD COLUMN pode_ver_lixeira boolean NOT NULL DEFAULT false;

-- Add soft-delete fields to solicitacoes
ALTER TABLE public.solicitacoes ADD COLUMN excluido boolean NOT NULL DEFAULT false;
ALTER TABLE public.solicitacoes ADD COLUMN excluido_em timestamp with time zone DEFAULT NULL;
ALTER TABLE public.solicitacoes ADD COLUMN excluido_por text NOT NULL DEFAULT '';

-- Update existing SELECT RLS policies to exclude soft-deleted records
-- We need to add "AND excluido = false" to all existing SELECT policies

-- Drop and recreate SELECT policies on solicitacoes to filter out deleted
DROP POLICY IF EXISTS "Admins read all solicitacoes" ON public.solicitacoes;
CREATE POLICY "Admins read all solicitacoes"
ON public.solicitacoes FOR SELECT
USING (is_admin(auth.uid()) AND excluido = false);

DROP POLICY IF EXISTS "Directors read assigned solicitacoes" ON public.solicitacoes;
CREATE POLICY "Directors read assigned solicitacoes"
ON public.solicitacoes FOR SELECT
USING (EXISTS (SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND solicitacoes.diretor_area = ANY(u.diretoria)) AND excluido = false);

DROP POLICY IF EXISTS "Resolvers read relevant solicitacoes" ON public.solicitacoes;
CREATE POLICY "Resolvers read relevant solicitacoes"
ON public.solicitacoes FOR SELECT
USING (EXISTS (SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND (
  (u.resolve_logistica_compras = true AND solicitacoes.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
  OR (u.resolve_expedicao = true AND solicitacoes.tipo = 'Materiais (Expedição)')
  OR (u.resolve_recursos_humanos = true AND solicitacoes.tipo = 'Novo Colaborador')
)) AND excluido = false);

DROP POLICY IF EXISTS "Unit viewers read solicitacoes" ON public.solicitacoes;
CREATE POLICY "Unit viewers read solicitacoes"
ON public.solicitacoes FOR SELECT
USING (EXISTS (SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND solicitacoes.unidade = ANY(u.visualiza_solicitacoes_unidades)) AND excluido = false);

DROP POLICY IF EXISTS "Users read own solicitacoes" ON public.solicitacoes;
CREATE POLICY "Users read own solicitacoes"
ON public.solicitacoes FOR SELECT
USING (solicitante_id = get_usuario_id_for_auth_user(auth.uid()) AND excluido = false);

-- New policy: users with pode_ver_lixeira can read deleted items
CREATE POLICY "Trash viewers read deleted solicitacoes"
ON public.solicitacoes FOR SELECT
USING (excluido = true AND EXISTS (SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND u.pode_ver_lixeira = true));

-- New policy: users with pode_excluir_chamado can soft-delete (update excluido fields)
-- Already covered by existing update policies (admin/resolver/director)
