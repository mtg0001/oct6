
-- 1. Drop ALL policies that reference old columns
DROP POLICY IF EXISTS "Resolvers read relevant solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Resolvers update relevant solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users read andamentos for accessible solicitacoes" ON public.andamentos;
DROP POLICY IF EXISTS "Users insert andamentos for accessible solicitacoes" ON public.andamentos;

-- 2. Add new columns
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS resolve_expedicao_go boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolve_expedicao_sp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolve_logistica_compras_go boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolve_logistica_compras_sp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolve_recursos_humanos_go boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolve_recursos_humanos_sp boolean NOT NULL DEFAULT false;

-- 3. Migrate data
UPDATE public.usuarios SET
  resolve_expedicao_go = resolve_expedicao,
  resolve_expedicao_sp = resolve_expedicao,
  resolve_logistica_compras_go = resolve_logistica_compras,
  resolve_logistica_compras_sp = resolve_logistica_compras,
  resolve_recursos_humanos_go = resolve_recursos_humanos,
  resolve_recursos_humanos_sp = resolve_recursos_humanos;

-- 4. Drop old columns
ALTER TABLE public.usuarios
  DROP COLUMN resolve_expedicao,
  DROP COLUMN resolve_logistica_compras,
  DROP COLUMN resolve_recursos_humanos;

-- 5. Recreate policies with new columns
CREATE POLICY "Resolvers read relevant solicitacoes"
ON public.solicitacoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.user_id = auth.uid() AND (
      (((u.resolve_logistica_compras_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
      OR (((u.resolve_expedicao_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_expedicao_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = 'Materiais (Expedição)')
      OR (((u.resolve_recursos_humanos_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = 'Novo Colaborador')
    )
  ) AND excluido = false
);

CREATE POLICY "Resolvers update relevant solicitacoes"
ON public.solicitacoes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.user_id = auth.uid() AND (
      (((u.resolve_logistica_compras_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
      OR (((u.resolve_expedicao_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_expedicao_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = 'Materiais (Expedição)')
      OR (((u.resolve_recursos_humanos_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = 'Novo Colaborador')
    )
  )
);

CREATE POLICY "Users read andamentos for accessible solicitacoes"
ON public.andamentos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solicitacoes s WHERE s.id = andamentos.solicitacao_id AND (
      s.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
      OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.usuarios u WHERE u.user_id = auth.uid() AND (
          (((u.resolve_logistica_compras_go AND s.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
          OR (((u.resolve_expedicao_go AND s.unidade = 'goiania') OR (u.resolve_expedicao_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = 'Materiais (Expedição)')
          OR (((u.resolve_recursos_humanos_go AND s.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = 'Novo Colaborador')
          OR s.diretor_area = ANY(u.diretoria)
          OR s.unidade = ANY(u.visualiza_solicitacoes_unidades)
        )
      )
    )
  )
);

CREATE POLICY "Users insert andamentos for accessible solicitacoes"
ON public.andamentos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.solicitacoes s WHERE s.id = andamentos.solicitacao_id AND (
      s.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
      OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.usuarios u WHERE u.user_id = auth.uid() AND (
          (((u.resolve_logistica_compras_go AND s.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
          OR (((u.resolve_expedicao_go AND s.unidade = 'goiania') OR (u.resolve_expedicao_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = 'Materiais (Expedição)')
          OR (((u.resolve_recursos_humanos_go AND s.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = 'Novo Colaborador')
          OR s.diretor_area = ANY(u.diretoria)
        )
      )
    )
  )
);
