import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Expense } from '@/types/expense';

const mockExpenses: Expense[] = [
  { id: '1', user_id: 'demo', category_id: '1', wallet_id: '1', amount: 45.0, description: 'Gasolina', date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() },
];

function getDemoKey(userId?: string) {
  return `demo_expenses_${userId || 'demo'}`;
}

function safeId() {
  const c = globalThis.crypto as Crypto | undefined;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadDemoExpenses(userId?: string) {
  try {
    const raw = localStorage.getItem(getDemoKey(userId));
    if (!raw) return mockExpenses;
    const parsed = JSON.parse(raw) as Expense[];
    return Array.isArray(parsed) ? parsed : mockExpenses;
  } catch {
    return mockExpenses;
  }
}

function saveDemoExpenses(userId: string | undefined, items: Expense[]) {
  try {
    localStorage.setItem(getDemoKey(userId), JSON.stringify(items));
  } catch {
  }
}

export function useExpenses() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (isDemo) return loadDemoExpenses(user?.id);
      const { data, error } = await supabase.from('expenses').select('*').eq('user_id', user?.id).order('date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
      if (isDemo) {
        const now = new Date().toISOString();
        const next: Expense = {
          ...expense,
          id: safeId(),
          user_id: user?.id || 'demo',
          created_at: now,
        };
        const current = loadDemoExpenses(user?.id);
        const updated = [next, ...current];
        saveDemoExpenses(user?.id, updated);
        return next;
      }
      const { data, error } = await supabase.from('expenses').insert([{ ...expense, user_id: user?.id }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      if (isDemo) {
        queryClient.setQueryData<Expense[]>(['expenses', user?.id], (prev) => {
          const safePrev = prev ?? loadDemoExpenses(user?.id);
          return [created as Expense, ...safePrev];
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      if (isDemo) {
        const current = loadDemoExpenses(user?.id);
        const updated = current.map((e) => (e.id === id ? ({ ...e, ...updates } as Expense) : e));
        saveDemoExpenses(user?.id, updated);
        return;
      }
      const { error } = await supabase.from('expenses').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (isDemo) {
        queryClient.setQueryData<Expense[]>(['expenses', user?.id], loadDemoExpenses(user?.id));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const current = loadDemoExpenses(user?.id);
        const updated = current.filter((e) => e.id !== id);
        saveDemoExpenses(user?.id, updated);
        return;
      }
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (isDemo) {
        queryClient.setQueryData<Expense[]>(['expenses', user?.id], loadDemoExpenses(user?.id));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  const addMultipleMutation = useMutation({
    mutationFn: async (expenses: Omit<Expense, 'id' | 'created_at' | 'user_id'>[]) => {
      if (isDemo) {
        const now = new Date().toISOString();
        const nexts = expenses.map(expense => ({
          ...expense,
          id: safeId(),
          user_id: user?.id || 'demo',
          created_at: now,
        }));
        const current = loadDemoExpenses(user?.id);
        const updated = [...nexts, ...current];
        saveDemoExpenses(user?.id, updated);
        return nexts;
      }
      const payloads = expenses.map(e => ({ ...e, user_id: user?.id }));
      const { data, error } = await supabase.from('expenses').insert(payloads).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      if (isDemo) {
        queryClient.setQueryData<Expense[]>(['expenses', user?.id], (prev) => {
          const safePrev = prev ?? loadDemoExpenses(user?.id);
          return [...(created as Expense[]), ...safePrev];
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  return { 
    ...query, 
    addExpense: addMutation.mutateAsync,
    addMultipleExpenses: addMultipleMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync
  };
}
