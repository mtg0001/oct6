
-- 1. Add user_id to usuarios linking to auth.users
ALTER TABLE public.usuarios ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;

-- 2. Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Security definer function to get current usuario user_id match
CREATE OR REPLACE FUNCTION public.get_usuario_id_for_auth_user(_auth_uid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.usuarios WHERE user_id = _auth_uid LIMIT 1
$$;

-- 5. Security definer to check if current auth user is admin in usuarios
CREATE OR REPLACE FUNCTION public.is_admin(_auth_uid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE user_id = _auth_uid AND administrador = true
  )
$$;

-- 6. Drop login and senha columns
ALTER TABLE public.usuarios DROP COLUMN login;
ALTER TABLE public.usuarios DROP COLUMN senha;

-- 7. Drop all old permissive RLS policies on usuarios
DROP POLICY IF EXISTS "Authenticated users can read usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can update usuarios" ON public.usuarios;

-- 8. New RLS policies for usuarios
-- Users can read their own record
CREATE POLICY "Users read own record" ON public.usuarios
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all records
CREATE POLICY "Admins read all usuarios" ON public.usuarios
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Only admins can insert usuarios
CREATE POLICY "Admins insert usuarios" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Users can update their own non-privileged fields; admins can update anyone
CREATE POLICY "Users update own or admin updates any" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 9. Drop all old permissive RLS policies on solicitacoes
DROP POLICY IF EXISTS "Authenticated users can read solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Authenticated users can insert solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Authenticated users can update solicitacoes" ON public.solicitacoes;

-- 10. New RLS policies for solicitacoes
-- Users can read their own requests
CREATE POLICY "Users read own solicitacoes" ON public.solicitacoes
  FOR SELECT TO authenticated
  USING (solicitante_id = public.get_usuario_id_for_auth_user(auth.uid()));

-- Admins can read all
CREATE POLICY "Admins read all solicitacoes" ON public.solicitacoes
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Department resolvers can read relevant requests
CREATE POLICY "Resolvers read relevant solicitacoes" ON public.solicitacoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.user_id = auth.uid()
      AND (
        (u.resolve_logistica_compras = true AND tipo IN (
          'Serviço de Diarista', 'Aluguel de Banheiro', 'Locação de Veículos', 'Frete',
          'Gerador', 'Hospedagem', 'Passagens', 'Tendas', 'Plataforma Elevatória',
          'Equipamentos de TI', 'Materiais de Escritório', 'Materiais (Compras)'
        ))
        OR (u.resolve_expedicao = true AND tipo = 'Materiais (Expedição)')
        OR (u.resolve_recursos_humanos = true AND tipo = 'Novo Colaborador')
      )
    )
  );

-- Directors can read requests assigned to them
CREATE POLICY "Directors read assigned solicitacoes" ON public.solicitacoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.user_id = auth.uid()
      AND diretor_area = ANY(u.diretoria)
    )
  );

-- Unit viewers can read requests from their units
CREATE POLICY "Unit viewers read solicitacoes" ON public.solicitacoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.user_id = auth.uid()
      AND unidade = ANY(u.visualiza_solicitacoes_unidades)
    )
  );

-- Authenticated users can insert (linked to their own id)
CREATE POLICY "Users insert own solicitacoes" ON public.solicitacoes
  FOR INSERT TO authenticated
  WITH CHECK (solicitante_id = public.get_usuario_id_for_auth_user(auth.uid()));

-- Admins and resolvers can update
CREATE POLICY "Admins update solicitacoes" ON public.solicitacoes
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Resolvers update relevant solicitacoes" ON public.solicitacoes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.user_id = auth.uid()
      AND (
        (u.resolve_logistica_compras = true AND tipo IN (
          'Serviço de Diarista', 'Aluguel de Banheiro', 'Locação de Veículos', 'Frete',
          'Gerador', 'Hospedagem', 'Passagens', 'Tendas', 'Plataforma Elevatória',
          'Equipamentos de TI', 'Materiais de Escritório', 'Materiais (Compras)'
        ))
        OR (u.resolve_expedicao = true AND tipo = 'Materiais (Expedição)')
        OR (u.resolve_recursos_humanos = true AND tipo = 'Novo Colaborador')
      )
    )
  );

-- Directors can update assigned requests
CREATE POLICY "Directors update assigned solicitacoes" ON public.solicitacoes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.user_id = auth.uid()
      AND diretor_area = ANY(u.diretoria)
    )
  );

-- 11. Drop and recreate andamentos policies
DROP POLICY IF EXISTS "Authenticated users can read andamentos" ON public.andamentos;
DROP POLICY IF EXISTS "Authenticated users can insert andamentos" ON public.andamentos;

-- Andamentos readable if user can read the parent solicitacao
CREATE POLICY "Users read andamentos for accessible solicitacoes" ON public.andamentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.solicitacoes s
      WHERE s.id = solicitacao_id
      AND (
        s.solicitante_id = public.get_usuario_id_for_auth_user(auth.uid())
        OR public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.usuarios u WHERE u.user_id = auth.uid()
          AND (
            (u.resolve_logistica_compras = true AND s.tipo IN (
              'Serviço de Diarista', 'Aluguel de Banheiro', 'Locação de Veículos', 'Frete',
              'Gerador', 'Hospedagem', 'Passagens', 'Tendas', 'Plataforma Elevatória',
              'Equipamentos de TI', 'Materiais de Escritório', 'Materiais (Compras)'
            ))
            OR (u.resolve_expedicao = true AND s.tipo = 'Materiais (Expedição)')
            OR (u.resolve_recursos_humanos = true AND s.tipo = 'Novo Colaborador')
            OR s.diretor_area = ANY(u.diretoria)
            OR s.unidade = ANY(u.visualiza_solicitacoes_unidades)
          )
        )
      )
    )
  );

-- Andamentos insertable by anyone who can see the solicitacao
CREATE POLICY "Users insert andamentos for accessible solicitacoes" ON public.andamentos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.solicitacoes s
      WHERE s.id = solicitacao_id
      AND (
        s.solicitante_id = public.get_usuario_id_for_auth_user(auth.uid())
        OR public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.usuarios u WHERE u.user_id = auth.uid()
          AND (
            (u.resolve_logistica_compras = true AND s.tipo IN (
              'Serviço de Diarista', 'Aluguel de Banheiro', 'Locação de Veículos', 'Frete',
              'Gerador', 'Hospedagem', 'Passagens', 'Tendas', 'Plataforma Elevatória',
              'Equipamentos de TI', 'Materiais de Escritório', 'Materiais (Compras)'
            ))
            OR (u.resolve_expedicao = true AND s.tipo = 'Materiais (Expedição)')
            OR (u.resolve_recursos_humanos = true AND s.tipo = 'Novo Colaborador')
            OR s.diretor_area = ANY(u.diretoria)
          )
        )
      )
    )
  );

-- 12. RLS policies for user_roles (only admins manage, users read own)
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- 13. Create trigger to auto-create usuario record on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (user_id, nome, email, departamento)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email, 'ADMINISTRATIVO');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
