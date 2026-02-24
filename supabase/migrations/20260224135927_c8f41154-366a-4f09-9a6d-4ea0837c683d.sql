
-- Add must_change_password flag to usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true;

-- Update existing usuarios to not require password change (they may not have auth yet)
UPDATE public.usuarios SET must_change_password = false;
