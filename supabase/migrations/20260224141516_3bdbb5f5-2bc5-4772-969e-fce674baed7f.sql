
-- Input validation triggers for solicitacoes and andamentos
CREATE OR REPLACE FUNCTION public.validate_solicitacao()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_column_size(NEW.caracteristicas) > 100000 THEN
    RAISE EXCEPTION 'caracteristicas exceeds size limit';
  END IF;
  IF length(NEW.observacoes) > 10000 THEN
    RAISE EXCEPTION 'observacoes exceeds size limit';
  END IF;
  IF length(NEW.justificativa) > 10000 THEN
    RAISE EXCEPTION 'justificativa exceeds size limit';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_solicitacao_before_insert_update
  BEFORE INSERT OR UPDATE ON public.solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.validate_solicitacao();

-- Validate andamentos
CREATE OR REPLACE FUNCTION public.validate_andamento()
RETURNS TRIGGER AS $$
BEGIN
  IF length(NEW.texto) > 10000 THEN
    RAISE EXCEPTION 'texto exceeds size limit';
  END IF;
  IF array_length(NEW.anexos, 1) > 20 THEN
    RAISE EXCEPTION 'too many anexos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_andamento_before_insert_update
  BEFORE INSERT OR UPDATE ON public.andamentos
  FOR EACH ROW EXECUTE FUNCTION public.validate_andamento();

-- Validate usuarios email format
CREATE OR REPLACE FUNCTION public.validate_usuario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'invalid email format';
  END IF;
  IF length(NEW.nome) > 200 THEN
    RAISE EXCEPTION 'nome exceeds size limit';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_usuario_before_insert_update
  BEFORE INSERT OR UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.validate_usuario();

-- Document SECURITY DEFINER functions
COMMENT ON FUNCTION public.is_admin IS 'SECURITY DEFINER: Required to check admin status without RLS recursion. Only accepts UUID parameter.';
COMMENT ON FUNCTION public.has_role IS 'SECURITY DEFINER: Required to check user roles without RLS recursion. Only accepts UUID and role parameters.';
COMMENT ON FUNCTION public.get_usuario_id_for_auth_user IS 'SECURITY DEFINER: Required to map auth.uid to usuarios.id without RLS recursion. Only accepts UUID parameter.';
COMMENT ON FUNCTION public.handle_new_user IS 'SECURITY DEFINER: Trigger function for auto-creating usuario records on auth.users insert.';
