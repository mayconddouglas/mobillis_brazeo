-- migration_v3.sql

-- Função para permitir com que o próprio usuário delete a sua conta de `auth.users` diretamente
-- Isto também ativará as restrições ON DELETE CASCADE para apagar perfil, receitas, despesas, etc.
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
