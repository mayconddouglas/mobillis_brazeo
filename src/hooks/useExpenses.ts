import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  wallet_id: string;
  amount: number;
  description: string;
  date: string;
  is_recurring?: boolean;
  created_at: string;
}

const mockExpenses: Expense[] = [
  { id: '1', user_id: 'demo', category_id: '1', wallet_id: '1', amount: 45.0, description: 'Gasolina', date: new Date().toISOString(), created_at: new Date().toISOString() },
];

export function useExpenses() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (isDemo) return mockExpenses;
      const { data, error } = await supabase.from('expenses').select('*').eq('user_id', user?.id).order('date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
      if (isDemo) return expense as Expense;
      const { data, error } = await supabase.from('expenses').insert([{ ...expense, user_id: user?.id }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      if (isDemo) return;
      const { error } = await supabase.from('expenses').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  return { 
    ...query, 
    addExpense: addMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync
  };
}
