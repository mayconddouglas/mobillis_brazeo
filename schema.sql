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
-- 2. TABELA DE PLATAFORMAS (PLATFORMS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.platforms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas plataformas" 
ON public.platforms FOR ALL USING (auth.uid() = user_id);

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
-- 4. TABELA DE CARTEIRAS (WALLETS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0 NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar suas carteiras" 
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
  platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  expense_target NUMERIC,
  cycle_start DATE,
  cycle_end DATE,
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
