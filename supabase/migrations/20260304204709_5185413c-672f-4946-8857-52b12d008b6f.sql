
-- Update RLS policies to allow RH resolvers to see and manage "Materiais de Escritório"

-- 1. Solicitacoes SELECT for Resolvers
DROP POLICY IF EXISTS "Resolvers read relevant solicitacoes" ON public.solicitacoes;
CREATE POLICY "Resolvers read relevant solicitacoes" ON public.solicitacoes
FOR SELECT TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.user_id = auth.uid() AND (
      (((u.resolve_logistica_compras_go AND solicitacoes.unidade = 'goiania') OR
        (u.resolve_logistica_compras_sp AND solicitacoes.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
       AND (
         ((solicitacoes.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
          AND solicitacoes.setor_atual = ANY(ARRAY['','logistica']))
         OR solicitacoes.setor_atual = 'logistica_encaminhado'
       ))
      OR (((u.resolve_expedicao_go AND solicitacoes.unidade = 'goiania') OR
           (u.resolve_expedicao_sp AND solicitacoes.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
          AND solicitacoes.tipo = 'Materiais (Expedição)'
          AND solicitacoes.setor_atual = ANY(ARRAY['','expedicao_devolvido']))
      OR (((u.resolve_recursos_humanos_go AND solicitacoes.unidade = 'goiania') OR
           (u.resolve_recursos_humanos_sp AND solicitacoes.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
          AND (
            solicitacoes.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI'])
            OR solicitacoes.setor_atual = 'rh_encaminhado'
            OR (solicitacoes.tipo = 'Materiais de Escritório' AND solicitacoes.setor_atual = ANY(ARRAY['rh','rh_aprovado_escritorio','rh_reprovado_escritorio']))
          ))
    )
  )) AND excluido = false
);

-- 2. Solicitacoes UPDATE for Resolvers
DROP POLICY IF EXISTS "Resolvers update relevant solicitacoes" ON public.solicitacoes;
CREATE POLICY "Resolvers update relevant solicitacoes" ON public.solicitacoes
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.user_id = auth.uid() AND (
      (((u.resolve_logistica_compras_go AND solicitacoes.unidade = 'goiania') OR
        (u.resolve_logistica_compras_sp AND solicitacoes.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
       AND (
         ((solicitacoes.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
          AND solicitacoes.setor_atual = ANY(ARRAY['','logistica']))
         OR solicitacoes.setor_atual = 'logistica_encaminhado'
       ))
      OR (((u.resolve_expedicao_go AND solicitacoes.unidade = 'goiania') OR
           (u.resolve_expedicao_sp AND solicitacoes.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
          AND solicitacoes.tipo = 'Materiais (Expedição)'
          AND solicitacoes.setor_atual = ANY(ARRAY['','expedicao_devolvido']))
      OR (((u.resolve_recursos_humanos_go AND solicitacoes.unidade = 'goiania') OR
           (u.resolve_recursos_humanos_sp AND solicitacoes.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
          AND (
            solicitacoes.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI'])
            OR solicitacoes.setor_atual = 'rh_encaminhado'
            OR (solicitacoes.tipo = 'Materiais de Escritório' AND solicitacoes.setor_atual = ANY(ARRAY['rh','rh_aprovado_escritorio','rh_reprovado_escritorio']))
          ))
    )
  )
);

-- 3. Andamentos SELECT
DROP POLICY IF EXISTS "Users read andamentos for accessible solicitacoes" ON public.andamentos;
CREATE POLICY "Users read andamentos for accessible solicitacoes" ON public.andamentos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM solicitacoes s
    WHERE s.id = andamentos.solicitacao_id AND (
      s.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
      OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.user_id = auth.uid() AND (
          (((u.resolve_logistica_compras_go AND s.unidade = 'goiania') OR
            (u.resolve_logistica_compras_sp AND s.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
           AND (
             ((s.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
              AND s.setor_atual = ANY(ARRAY['','logistica']))
             OR s.setor_atual = 'logistica_encaminhado'
           ))
          OR (((u.resolve_expedicao_go AND s.unidade = 'goiania') OR
               (u.resolve_expedicao_sp AND s.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
              AND s.tipo = 'Materiais (Expedição)'
              AND s.setor_atual = ANY(ARRAY['','expedicao_devolvido']))
          OR (((u.resolve_recursos_humanos_go AND s.unidade = 'goiania') OR
               (u.resolve_recursos_humanos_sp AND s.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
              AND (
                s.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI'])
                OR s.setor_atual = 'rh_encaminhado'
                OR (s.tipo = 'Materiais de Escritório' AND s.setor_atual = ANY(ARRAY['rh','rh_aprovado_escritorio','rh_reprovado_escritorio']))
              ))
          OR s.diretor_area = ANY(u.diretoria)
          OR s.unidade = ANY(u.visualiza_solicitacoes_unidades)
        )
      )
    )
  )
);

-- 4. Andamentos INSERT
DROP POLICY IF EXISTS "Users insert andamentos for accessible solicitacoes" ON public.andamentos;
CREATE POLICY "Users insert andamentos for accessible solicitacoes" ON public.andamentos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM solicitacoes s
    WHERE s.id = andamentos.solicitacao_id AND (
      s.solicitante_id = get_usuario_id_for_auth_user(auth.uid())
      OR is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.user_id = auth.uid() AND (
          (((u.resolve_logistica_compras_go AND s.unidade = 'goiania') OR
            (u.resolve_logistica_compras_sp AND s.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
           AND (
             ((s.tipo = ANY(ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Passagens','Tendas','Plataforma Elevatória','Equipamentos de TI','Materiais de Escritório','Materiais (Compras)']))
              AND s.setor_atual = ANY(ARRAY['','logistica']))
             OR s.setor_atual = 'logistica_encaminhado'
           ))
          OR (((u.resolve_expedicao_go AND s.unidade = 'goiania') OR
               (u.resolve_expedicao_sp AND s.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
              AND s.tipo = 'Materiais (Expedição)'
              AND s.setor_atual = ANY(ARRAY['','expedicao_devolvido']))
          OR (((u.resolve_recursos_humanos_go AND s.unidade = 'goiania') OR
               (u.resolve_recursos_humanos_sp AND s.unidade = ANY(ARRAY['mairipora','pinheiros','sao-paulo'])))
              AND (
                s.tipo = ANY(ARRAY['Novo Colaborador','Uniformes e EPI'])
                OR s.setor_atual = 'rh_encaminhado'
                OR (s.tipo = 'Materiais de Escritório' AND s.setor_atual = ANY(ARRAY['rh','rh_aprovado_escritorio','rh_reprovado_escritorio']))
              ))
          OR s.diretor_area = ANY(u.diretoria)
        )
      )
    )
  )
);
