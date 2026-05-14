-- migration_v2.sql

-- Adiciona novas colunas na tabela earnings que dão suporte para operações de transações fixas/parceladas.
ALTER TABLE IF EXISTS public.earnings 
  ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS installment_current INTEGER,
  ADD COLUMN IF NOT EXISTS installment_total INTEGER,
  ADD COLUMN IF NOT EXISTS group_id UUID,
  ADD COLUMN IF NOT EXISTS recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'yearly', 'weekly'));

-- Adiciona as mesmas propriedades na tabela de despesas (expenses).
ALTER TABLE IF EXISTS public.expenses 
  ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS installment_current INTEGER,
  ADD COLUMN IF NOT EXISTS installment_total INTEGER,
  ADD COLUMN IF NOT EXISTS group_id UUID,
  ADD COLUMN IF NOT EXISTS recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'yearly', 'weekly'));

-- Adicionar o campo avatar_url dentro da tabela de perfil de usuário.
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Criação de índices de performance
-- Índice para filtragem rápida de receitas por usuário e data decrescente
CREATE INDEX IF NOT EXISTS idx_earnings_user_date ON public.earnings(user_id, date DESC);
-- Índice para filtragem rápida de despesas por usuário e data decrescente
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);
-- Índice para otimizar pesquisas em agrupamentos nas receitas (onde houver grupo)
CREATE INDEX IF NOT EXISTS idx_earnings_group ON public.earnings(group_id) WHERE group_id IS NOT NULL;
-- Índice para otimizar pesquisas em agrupamentos nas despesas (onde houver grupo)
CREATE INDEX IF NOT EXISTS idx_expenses_group ON public.expenses(group_id) WHERE group_id IS NOT NULL;

-- Criação da view que gera relatório mensal
CREATE OR REPLACE VIEW public.monthly_summary AS
WITH months AS (
    SELECT DISTINCT date_trunc('month', date) AS month, user_id FROM public.earnings
    UNION
    SELECT DISTINCT date_trunc('month', date) AS month, user_id FROM public.expenses
),
monthly_earnings AS (
    SELECT user_id, date_trunc('month', date) AS month, SUM(amount) as total_earnings
    FROM public.earnings
    GROUP BY user_id, date_trunc('month', date)
),
monthly_expenses AS (
    SELECT user_id, date_trunc('month', date) AS month, SUM(amount) as total_expenses
    FROM public.expenses
    GROUP BY user_id, date_trunc('month', date)
)
SELECT 
    m.user_id,
    m.month,
    COALESCE(e.total_earnings, 0) AS total_earnings,
    COALESCE(ex.total_expenses, 0) AS total_expenses,
    COALESCE(e.total_earnings, 0) - COALESCE(ex.total_expenses, 0) AS net
FROM months m
LEFT JOIN monthly_earnings e ON m.user_id = e.user_id AND m.month = e.month
LEFT JOIN monthly_expenses ex ON m.user_id = ex.user_id AND m.month = ex.month;

-- Re-escrevendo o trigger 'handle_new_user' para refletir categorias precisas 
-- para o ramo de Motorista e Entregador, ao invés das antigas genéricas.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Cria perfil do usuário
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'driver');

  -- Novas categorias padrões de receita, com foco em aplicativos de mobilidade/entregas
  INSERT INTO public.income_categories (user_id, name, icon, color) VALUES
    (new.id, 'Corrida de App', 'car', '#10b981'),
    (new.id, 'Entrega', 'package', '#3b82f6'),
    (new.id, 'Gorjeta', 'gift', '#f59e0b'),
    (new.id, 'Bônus Plataforma', 'award', '#8b5cf6'),
    (new.id, 'Frete', 'truck', '#06b6d4'),
    (new.id, 'Outros', 'dollar-sign', '#64748b');

  -- Categorias padrões convencionais de despesas
  INSERT INTO public.expense_categories (user_id, name, icon, color) VALUES
    (new.id, 'Combustível', 'fuel', '#ef4444'),
    (new.id, 'Manutenção', 'wrench', '#f97316'),
    (new.id, 'Alimentação', 'coffee', '#eab308'),
    (new.id, 'Seguro/IPVA', 'shield', '#3b82f6'),
    (new.id, 'Celular', 'smartphone', '#6366f1'),
    (new.id, 'Financiamento/Aluguel', 'home', '#8b5cf6'),
    (new.id, 'Outros', 'tag', '#64748b');

  -- Define uma conta básica (Carteira/Dinheiro) para todo recem chegado na plataforma
  INSERT INTO public.wallets (user_id, name, balance, type) VALUES
    (new.id, 'Carteira (Dinheiro)', 0, 'cash');

  RETURN NEW;
END;
$$;
