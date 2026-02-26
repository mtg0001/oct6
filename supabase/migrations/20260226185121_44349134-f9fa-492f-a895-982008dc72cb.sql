
-- Add setor_atual column to track forwarding workflow
ALTER TABLE public.solicitacoes ADD COLUMN setor_atual text NOT NULL DEFAULT '';

-- Update Resolvers read policy to handle forwarded items
DROP POLICY IF EXISTS "Resolvers read relevant solicitacoes" ON public.solicitacoes;
CREATE POLICY "Resolvers read relevant solicitacoes" ON public.solicitacoes
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND (
      -- Logística: original items + forwarded expedition items
      (
        ((u.resolve_logistica_compras_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND (
          (solicitacoes.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']) AND solicitacoes.setor_atual IN ('', 'logistica'))
          OR solicitacoes.setor_atual = 'logistica_encaminhado'
        )
      )
      -- Expedição: original + returned items (not while at director or logística)
      OR (
        ((u.resolve_expedicao_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_expedicao_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = 'Materiais (Expedição)'
        AND solicitacoes.setor_atual IN ('', 'expedicao_devolvido')
      )
      -- RH: original + forwarded expedition items
      OR (
        ((u.resolve_recursos_humanos_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND (
          (solicitacoes.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI']))
          OR solicitacoes.setor_atual = 'rh_encaminhado'
        )
      )
    )
  )) AND excluido = false
);

-- Update Resolvers update policy
DROP POLICY IF EXISTS "Resolvers update relevant solicitacoes" ON public.solicitacoes;
CREATE POLICY "Resolvers update relevant solicitacoes" ON public.solicitacoes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND (
      (
        ((u.resolve_logistica_compras_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND (
          (solicitacoes.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']) AND solicitacoes.setor_atual IN ('', 'logistica'))
          OR solicitacoes.setor_atual = 'logistica_encaminhado'
        )
      )
      OR (
        ((u.resolve_expedicao_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_expedicao_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND solicitacoes.tipo = 'Materiais (Expedição)'
        AND solicitacoes.setor_atual IN ('', 'expedicao_devolvido')
      )
      OR (
        ((u.resolve_recursos_humanos_go AND solicitacoes.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND solicitacoes.unidade = 'sao-paulo'))
        AND (
          (solicitacoes.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI']))
          OR solicitacoes.setor_atual = 'rh_encaminhado'
        )
      )
    )
  )
);

-- Update andamentos read policy
DROP POLICY IF EXISTS "Users read andamentos for accessible solicitacoes" ON public.andamentos;
CREATE POLICY "Users read andamentos for accessible solicitacoes" ON public.andamentos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM solicitacoes s WHERE s.id = andamentos.solicitacao_id AND (
      s.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
      OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND (
          (
            ((u.resolve_logistica_compras_go AND s.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND s.unidade = 'sao-paulo'))
            AND (
              (s.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']) AND s.setor_atual IN ('', 'logistica'))
              OR s.setor_atual = 'logistica_encaminhado'
            )
          )
          OR (
            ((u.resolve_expedicao_go AND s.unidade = 'goiania') OR (u.resolve_expedicao_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = 'Materiais (Expedição)'
            AND s.setor_atual IN ('', 'expedicao_devolvido')
          )
          OR (
            ((u.resolve_recursos_humanos_go AND s.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND s.unidade = 'sao-paulo'))
            AND (
              (s.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI']))
              OR s.setor_atual = 'rh_encaminhado'
            )
          )
          OR s.diretor_area = ANY(u.diretoria)
          OR s.unidade = ANY(u.visualiza_solicitacoes_unidades)
        )
      )
    )
  )
);

-- Update andamentos insert policy
DROP POLICY IF EXISTS "Users insert andamentos for accessible solicitacoes" ON public.andamentos;
CREATE POLICY "Users insert andamentos for accessible solicitacoes" ON public.andamentos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM solicitacoes s WHERE s.id = andamentos.solicitacao_id AND (
      s.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
      OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM usuarios u WHERE u.user_id = auth.uid() AND (
          (
            ((u.resolve_logistica_compras_go AND s.unidade = 'goiania') OR (u.resolve_logistica_compras_sp AND s.unidade = 'sao-paulo'))
            AND (
              (s.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']) AND s.setor_atual IN ('', 'logistica'))
              OR s.setor_atual = 'logistica_encaminhado'
            )
          )
          OR (
            ((u.resolve_expedicao_go AND s.unidade = 'goiania') OR (u.resolve_expedicao_sp AND s.unidade = 'sao-paulo'))
            AND s.tipo = 'Materiais (Expedição)'
            AND s.setor_atual IN ('', 'expedicao_devolvido')
          )
          OR (
            ((u.resolve_recursos_humanos_go AND s.unidade = 'goiania') OR (u.resolve_recursos_humanos_sp AND s.unidade = 'sao-paulo'))
            AND (
              (s.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI']))
              OR s.setor_atual = 'rh_encaminhado'
            )
          )
          OR s.diretor_area = ANY(u.diretoria)
        )
      )
    )
  )
);
