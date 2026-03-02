
-- Add permission flag for TI ticket creation
ALTER TABLE public.usuarios ADD COLUMN pode_abrir_chamado boolean NOT NULL DEFAULT false;

-- Store SharePoint folder path for each TI ticket
ALTER TABLE public.chamados_ti ADD COLUMN sharepoint_pasta text NOT NULL DEFAULT '';
