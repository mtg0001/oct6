
-- Add pode_usar_chat column (default true so existing users keep chat access)
ALTER TABLE public.usuarios ADD COLUMN pode_usar_chat boolean NOT NULL DEFAULT true;

-- Remove pode_ver_cad column
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS pode_ver_cad;
