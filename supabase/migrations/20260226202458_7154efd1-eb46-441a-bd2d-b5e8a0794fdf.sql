
-- Create chamados_ti table
CREATE TABLE public.chamados_ti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitante_id UUID REFERENCES public.usuarios(id),
  solicitante_nome TEXT NOT NULL,
  departamento TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL,
  sub_opcoes TEXT[] NOT NULL DEFAULT '{}',
  site_especifico TEXT DEFAULT '',
  site_suspeito TEXT DEFAULT '',
  aprovado_gestor TEXT DEFAULT '',
  novo_colaborador TEXT DEFAULT '',
  anydesk TEXT DEFAULT '',
  urgencia TEXT NOT NULL DEFAULT 'baixa',
  observacoes TEXT DEFAULT '',
  anexos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chamados_ti ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own chamados"
ON public.chamados_ti FOR SELECT
USING (
  solicitante_id = (SELECT id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1)
  OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND administrador = true)
);

CREATE POLICY "Users can create chamados"
ON public.chamados_ti FOR INSERT
WITH CHECK (
  solicitante_id = (SELECT id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1)
  OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND administrador = true)
);

CREATE POLICY "Admins can update chamados"
ON public.chamados_ti FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND administrador = true)
  OR solicitante_id = (SELECT id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Admins can delete chamados"
ON public.chamados_ti FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND administrador = true)
);

-- Trigger for updated_at
CREATE TRIGGER update_chamados_ti_updated_at
BEFORE UPDATE ON public.chamados_ti
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
