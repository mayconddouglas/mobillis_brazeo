-- migration_v4.sql

-- Função para zerar todos os dados financeiros do usuário.
-- Remove todas as receitas, despesas, carteiras e metas.
-- Também pode restaurar a carteira padrão.
CREATE OR REPLACE FUNCTION public.reset_financial_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Delete all financial data for the user
  DELETE FROM public.earnings WHERE user_id = auth.uid();
  DELETE FROM public.expenses WHERE user_id = auth.uid();
  DELETE FROM public.monthly_goals WHERE user_id = auth.uid();
  DELETE FROM public.wallets WHERE user_id = auth.uid();

  -- Se desejar recriar a carteira básica (já que a gente apaga todas)
  INSERT INTO public.wallets (user_id, name, balance, type)
  VALUES (auth.uid(), 'Carteira (Dinheiro)', 0, 'cash');
END;
$$;
