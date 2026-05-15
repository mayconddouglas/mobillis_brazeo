-- Habilite a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 1. TABELA DE PERFIS (PROFILES)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver o próprio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio perfil" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir o próprio perfil" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================================
-- 2. TABELA DE CATEGORIAS DE RECEITAS (INCOME_CATEGORIES) - ANTIGA PLATFORMS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.income_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas categorias de receita" 
ON public.income_categories FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- 3. TABELA DE CATEGORIAS DE GASTOS (EXPENSE_CATEGORIES)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas categorias" 
ON public.expense_categories FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- 4. TABELA DE CONTAS E CARTÕES (WALLETS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0 NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT DEFAULT 'checking', -- check, savings, credit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas contas" 
ON public.wallets FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- 5. TABELA DE METAS MENSAIS (MONTHLY_GOALS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  earning_goal NUMERIC NOT NULL,
  expense_limit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, month, year)
);

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas metas" 
ON public.monthly_goals FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- 6. TABELA DE GANHOS (EARNINGS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.income_categories(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seus ganhos" 
ON public.earnings FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- 7. TABELA DE GASTOS (EXPENSES)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seus gastos" 
ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- 8. TRIGGER PARA DADOS PADRÃO DE NOVOS USUÁRIOS
-- ========================================================
-- Esta função é executada automaticamente quando um usuário cria uma conta,
-- populando as categorias, fontes de renda e a primeira conta bancária.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Criar perfil do usuário (usando o nome do metadata)
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');

  -- 2. Criar categorias de despesas padrão (Alimentação, Transporte, Moradia, Saúde, Lazer)
  INSERT INTO public.expense_categories (user_id, name, color, icon) VALUES
  (new.id, 'Alimentação', '#ef4444', 'utensils'),
  (new.id, 'Transporte', '#3b82f6', 'car'),
  (new.id, 'Moradia', '#8b5cf6', 'home'),
  (new.id, 'Saúde', '#10b981', 'activity'),
  (new.id, 'Lazer', '#f59e0b', 'coffee');

  -- 3. Criar fontes de renda padrão (Salário, Freelance, Investimentos)
  INSERT INTO public.income_categories (user_id, name, color, icon) VALUES
  (new.id, 'Salário', '#22c55e', 'briefcase'),
  (new.id, 'Freelance', '#6366f1', 'laptop'),
  (new.id, 'Investimentos', '#eab308', 'trending-up');

  -- 4. Criar primeira conta bancária (Conta Corrente)
  INSERT INTO public.wallets (user_id, name, balance, color, icon) VALUES
  (new.id, 'Conta Corrente', 0, '#3b82f6', 'landmark');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deletar o trigger se já existir para poder recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar o trigger amarrado à tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- 9. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE SALDO NAS CARTEIRAS
-- ========================================================

-- Trigger para despesas (expenses)
CREATE OR REPLACE FUNCTION public.trg_expense_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se a carteira não mudou
    IF OLD.wallet_id = NEW.wallet_id AND NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + OLD.amount - NEW.amount WHERE id = NEW.wallet_id;
    ELSIF OLD.wallet_id IS DISTINCT FROM NEW.wallet_id THEN
      IF OLD.wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
      END IF;
      IF NEW.wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS expense_wallet_balance_trigger ON public.expenses;

CREATE TRIGGER expense_wallet_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.trg_expense_wallet_balance();

-- Trigger para receitas (earnings)
CREATE OR REPLACE FUNCTION public.trg_earning_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.wallet_id = NEW.wallet_id AND NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance - OLD.amount + NEW.amount WHERE id = NEW.wallet_id;
    ELSIF OLD.wallet_id IS DISTINCT FROM NEW.wallet_id THEN
      IF OLD.wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
      END IF;
      IF NEW.wallet_id IS NOT NULL THEN
        UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS earning_wallet_balance_trigger ON public.earnings;

CREATE TRIGGER earning_wallet_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.earnings
  FOR EACH ROW EXECUTE FUNCTION public.trg_earning_wallet_balance();

