
-- Tabela de usuários do sistema (gestão interna)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  departamento TEXT NOT NULL,
  unidade_padrao TEXT NOT NULL DEFAULT 'GOIÂNIA',
  ativo BOOLEAN NOT NULL DEFAULT true,
  administrador BOOLEAN NOT NULL DEFAULT false,
  nova_solicitacao_unidades TEXT[] NOT NULL DEFAULT '{}',
  resolve_expedicao BOOLEAN NOT NULL DEFAULT false,
  resolve_logistica_compras BOOLEAN NOT NULL DEFAULT false,
  resolve_recursos_humanos BOOLEAN NOT NULL DEFAULT false,
  diretoria TEXT[] NOT NULL DEFAULT '{}',
  servicos_permitidos TEXT[] NOT NULL DEFAULT '{}',
  visualiza_solicitacoes_unidades TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de solicitações
CREATE TABLE public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  unidade TEXT NOT NULL,
  evento TEXT NOT NULL DEFAULT '',
  departamento TEXT NOT NULL DEFAULT '',
  solicitante TEXT NOT NULL DEFAULT '',
  solicitante_id UUID REFERENCES public.usuarios(id),
  prioridade TEXT NOT NULL DEFAULT 'normal',
  cargo TEXT NOT NULL DEFAULT '',
  unidade_destino TEXT NOT NULL DEFAULT '',
  departamento_destino TEXT NOT NULL DEFAULT '',
  diretor_area TEXT NOT NULL DEFAULT '',
  tipo_vaga TEXT NOT NULL DEFAULT '',
  nome_substituido TEXT NOT NULL DEFAULT '',
  justificativa TEXT NOT NULL DEFAULT '',
  formacao TEXT NOT NULL DEFAULT '',
  experiencia TEXT NOT NULL DEFAULT '',
  conhecimentos TEXT NOT NULL DEFAULT '',
  faixa_salarial_de TEXT NOT NULL DEFAULT '',
  faixa_salarial_ate TEXT NOT NULL DEFAULT '',
  tipo_contrato TEXT NOT NULL DEFAULT '',
  horario_de TEXT NOT NULL DEFAULT '',
  horario_ate TEXT NOT NULL DEFAULT '',
  caracteristicas JSONB NOT NULL DEFAULT '{}',
  observacoes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado_diretor','aprovado','reprovado','resolvido','cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de andamentos
CREATE TABLE public.andamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  anexos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX idx_solicitacoes_tipo ON public.solicitacoes(tipo);
CREATE INDEX idx_solicitacoes_solicitante_id ON public.solicitacoes(solicitante_id);
CREATE INDEX idx_solicitacoes_diretor_area ON public.solicitacoes(diretor_area);
CREATE INDEX idx_andamentos_solicitacao_id ON public.andamentos(solicitacao_id);

-- RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.andamentos ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can CRUD (internal system behind auth)
CREATE POLICY "Authenticated users can read usuarios" ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert usuarios" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update usuarios" ON public.usuarios FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert solicitacoes" ON public.solicitacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update solicitacoes" ON public.solicitacoes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read andamentos" ON public.andamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert andamentos" ON public.andamentos FOR INSERT TO authenticated WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed admin user
INSERT INTO public.usuarios (nome, email, login, senha, departamento, unidade_padrao, ativo, administrador, nova_solicitacao_unidades, resolve_expedicao, resolve_logistica_compras, resolve_recursos_humanos, diretoria, servicos_permitidos, visualiza_solicitacoes_unidades)
VALUES (
  'Admin Octarte', 'admin@octarte.com', 'admin.octarte', 'admin123',
  'TECNOLOGIA DA INFORMAÇÃO', 'GOIÂNIA', true, true,
  ARRAY['SÃO PAULO','GOIÂNIA'], true, true, true,
  ARRAY['Osorio','Jessica','Soraya','Danielle'],
  ARRAY['Serviço de Diarista','Aluguel de Banheiro','Locação de Veículos','Frete','Gerador','Hospedagem','Tendas','Plataforma Elevatória','Passagens','Equipamentos de TI','Manutenção Predial','Uniformes e EPI','Materiais de Escritório','Materiais (Expedição)','Materiais (Compras)','Negociação de Mão de Obra','Novo Colaborador'],
  ARRAY['GOIÂNIA','SÃO PAULO']
);
