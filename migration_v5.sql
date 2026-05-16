-- migration_v5.sql
--
-- 1) Corrige conflito entre schema.sql e migration_v2.sql:
--    - schema.sql criava profiles com coluna `name`
--    - migration_v2.sql reescrevia o trigger handle_new_user para inserir `full_name` e `role`
--    - isso causava "Database error saving new user" no signup (colunas inexistentes)
--
-- 2) Mantém `name` por compatibilidade retroativa e adiciona `full_name` como campo preferencial.
--
-- 3) Reescreve o trigger handle_new_user garantindo que os campos usados existam na tabela.
--
-- 4) Reescreve reset_financial_data para recriar carteira padrão usando `balance` OU `base_balance`
--    (dependendo de qual coluna existir na tabela wallets).

-- 1) profiles: garantir colunas compatíveis com as migrations mais novas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'driver';

-- 2) Compat retroativa: manter coluna `name` (se existir) e preencher full_name quando possível
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'name'
  ) THEN
    UPDATE public.profiles
    SET full_name = COALESCE(NULLIF(full_name, ''), name)
    WHERE full_name IS NULL OR full_name = '';
  END IF;
END $$;

-- 3) Trigger handle_new_user: INSERT em profiles com fallback do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_name TEXT;
  v_role TEXT;
  has_base_balance BOOLEAN;
  has_balance BOOLEAN;
  has_color BOOLEAN;
  has_icon BOOLEAN;
  has_type BOOLEAN;
BEGIN
  v_full_name := NULLIF(new.raw_user_meta_data->>'full_name', '');
  IF v_full_name IS NULL THEN
    v_full_name := NULLIF(new.raw_user_meta_data->>'name', '');
  END IF;

  v_name := NULLIF(new.raw_user_meta_data->>'name', '');
  IF v_name IS NULL THEN
    v_name := v_full_name;
  END IF;

  v_role := COALESCE(NULLIF(new.raw_user_meta_data->>'role', ''), 'driver');

  INSERT INTO public.profiles (id, name, full_name, role)
  VALUES (new.id, v_name, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  INSERT INTO public.income_categories (user_id, name, icon, color) VALUES
    (new.id, 'Corrida de App', 'car', '#10b981'),
    (new.id, 'Entrega', 'package', '#3b82f6'),
    (new.id, 'Gorjeta', 'gift', '#f59e0b'),
    (new.id, 'Bônus Plataforma', 'award', '#8b5cf6'),
    (new.id, 'Frete', 'truck', '#06b6d4'),
    (new.id, 'Outros', 'dollar-sign', '#64748b');

  INSERT INTO public.expense_categories (user_id, name, icon, color) VALUES
    (new.id, 'Combustível', 'fuel', '#ef4444'),
    (new.id, 'Manutenção', 'wrench', '#f97316'),
    (new.id, 'Alimentação', 'coffee', '#eab308'),
    (new.id, 'Seguro/IPVA', 'shield', '#3b82f6'),
    (new.id, 'Celular', 'smartphone', '#6366f1'),
    (new.id, 'Financiamento/Aluguel', 'home', '#8b5cf6'),
    (new.id, 'Outros', 'tag', '#64748b');

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'base_balance'
  ) INTO has_base_balance;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'balance'
  ) INTO has_balance;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'color'
  ) INTO has_color;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'icon'
  ) INTO has_icon;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'type'
  ) INTO has_type;

  IF has_base_balance THEN
    IF has_color AND has_icon AND has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, base_balance, color, icon, type) VALUES ($1, $2, 0, $3, $4, $5)'
      USING new.id, 'Carteira (Dinheiro)', '#3b82f6', 'landmark', 'cash';
    ELSIF has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, base_balance, type) VALUES ($1, $2, 0, $3)'
      USING new.id, 'Carteira (Dinheiro)', 'cash';
    ELSE
      EXECUTE 'INSERT INTO public.wallets (user_id, name, base_balance) VALUES ($1, $2, 0)'
      USING new.id, 'Carteira (Dinheiro)';
    END IF;
  ELSIF has_balance THEN
    IF has_color AND has_icon AND has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, balance, color, icon, type) VALUES ($1, $2, 0, $3, $4, $5)'
      USING new.id, 'Carteira (Dinheiro)', '#3b82f6', 'landmark', 'cash';
    ELSIF has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, balance, type) VALUES ($1, $2, 0, $3)'
      USING new.id, 'Carteira (Dinheiro)', 'cash';
    ELSE
      EXECUTE 'INSERT INTO public.wallets (user_id, name, balance) VALUES ($1, $2, 0)'
      USING new.id, 'Carteira (Dinheiro)';
    END IF;
  ELSE
    IF has_color AND has_icon AND has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, color, icon, type) VALUES ($1, $2, $3, $4, $5)'
      USING new.id, 'Carteira (Dinheiro)', '#3b82f6', 'landmark', 'cash';
    ELSIF has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, type) VALUES ($1, $2, $3)'
      USING new.id, 'Carteira (Dinheiro)', 'cash';
    ELSE
      EXECUTE 'INSERT INTO public.wallets (user_id, name) VALUES ($1, $2)'
      USING new.id, 'Carteira (Dinheiro)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4) reset_financial_data: recreia carteira padrão sem depender de balance/base_balance fixo
CREATE OR REPLACE FUNCTION public.reset_financial_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  has_base_balance BOOLEAN;
  has_balance BOOLEAN;
  has_color BOOLEAN;
  has_icon BOOLEAN;
  has_type BOOLEAN;
BEGIN
  DELETE FROM public.earnings WHERE user_id = auth.uid();
  DELETE FROM public.expenses WHERE user_id = auth.uid();
  DELETE FROM public.monthly_goals WHERE user_id = auth.uid();
  DELETE FROM public.wallets WHERE user_id = auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'base_balance'
  ) INTO has_base_balance;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'balance'
  ) INTO has_balance;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'color'
  ) INTO has_color;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'icon'
  ) INTO has_icon;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'type'
  ) INTO has_type;

  IF has_base_balance THEN
    IF has_color AND has_icon AND has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, base_balance, color, icon, type) VALUES ($1, $2, 0, $3, $4, $5)'
      USING auth.uid(), 'Carteira (Dinheiro)', '#3b82f6', 'landmark', 'cash';
    ELSIF has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, base_balance, type) VALUES ($1, $2, 0, $3)'
      USING auth.uid(), 'Carteira (Dinheiro)', 'cash';
    ELSE
      EXECUTE 'INSERT INTO public.wallets (user_id, name, base_balance) VALUES ($1, $2, 0)'
      USING auth.uid(), 'Carteira (Dinheiro)';
    END IF;
  ELSIF has_balance THEN
    IF has_color AND has_icon AND has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, balance, color, icon, type) VALUES ($1, $2, 0, $3, $4, $5)'
      USING auth.uid(), 'Carteira (Dinheiro)', '#3b82f6', 'landmark', 'cash';
    ELSIF has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, balance, type) VALUES ($1, $2, 0, $3)'
      USING auth.uid(), 'Carteira (Dinheiro)', 'cash';
    ELSE
      EXECUTE 'INSERT INTO public.wallets (user_id, name, balance) VALUES ($1, $2, 0)'
      USING auth.uid(), 'Carteira (Dinheiro)';
    END IF;
  ELSE
    IF has_color AND has_icon AND has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, color, icon, type) VALUES ($1, $2, $3, $4, $5)'
      USING auth.uid(), 'Carteira (Dinheiro)', '#3b82f6', 'landmark', 'cash';
    ELSIF has_type THEN
      EXECUTE 'INSERT INTO public.wallets (user_id, name, type) VALUES ($1, $2, $3)'
      USING auth.uid(), 'Carteira (Dinheiro)', 'cash';
    ELSE
      EXECUTE 'INSERT INTO public.wallets (user_id, name) VALUES ($1, $2)'
      USING auth.uid(), 'Carteira (Dinheiro)';
    END IF;
  END IF;
END;
$$;

