import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

const mockCategories: ExpenseCategory[] = [
  { id: '1', user_id: 'demo', name: 'Alimentação', color: '#EF4444', icon: 'utensils', created_at: new Date().toISOString() },
  { id: '2', user_id: 'demo', name: 'Transporte', color: '#3B82F6', icon: 'car', created_at: new Date().toISOString() },
  { id: '3', user_id: 'demo', name: 'Moradia', color: '#8B5CF6', icon: 'home', created_at: new Date().toISOString() },
  { id: '4', user_id: 'demo', name: 'Lazer', color: '#F59E0B', icon: 'coffee', created_at: new Date().toISOString() },
];

export function useExpenseCategories() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expense_categories', user?.id],
    queryFn: async () => {
      if (isDemo) return mockCategories;
      const { data, error } = await supabase.from('expense_categories').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      return data as ExpenseCategory[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (category: Omit<ExpenseCategory, 'id' | 'created_at' | 'user_id'>) => {
      if (isDemo) return category as ExpenseCategory;
      const { data, error } = await supabase.from('expense_categories').insert([{ ...category, user_id: user?.id }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('expense_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense_categories'] }),
  });

  return { ...query, addCategory: addMutation.mutateAsync, deleteCategory: deleteMutation.mutateAsync };
}
