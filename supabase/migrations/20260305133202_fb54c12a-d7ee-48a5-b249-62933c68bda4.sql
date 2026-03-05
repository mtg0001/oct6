
-- Table for PJ collaborators
CREATE TABLE public.colaboradores_pj (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ativo',
  dados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for CLT collaborators
CREATE TABLE public.colaboradores_clt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ativo',
  dados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.colaboradores_pj ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores_clt ENABLE ROW LEVEL SECURITY;

-- RLS policies: authenticated users can read/write
CREATE POLICY "Authenticated users can read colaboradores_pj"
  ON public.colaboradores_pj FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert colaboradores_pj"
  ON public.colaboradores_pj FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update colaboradores_pj"
  ON public.colaboradores_pj FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete colaboradores_pj"
  ON public.colaboradores_pj FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read colaboradores_clt"
  ON public.colaboradores_clt FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert colaboradores_clt"
  ON public.colaboradores_clt FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update colaboradores_clt"
  ON public.colaboradores_clt FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete colaboradores_clt"
  ON public.colaboradores_clt FOR DELETE TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_colaboradores_pj_updated_at
  BEFORE UPDATE ON public.colaboradores_pj
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colaboradores_clt_updated_at
  BEFORE UPDATE ON public.colaboradores_clt
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
