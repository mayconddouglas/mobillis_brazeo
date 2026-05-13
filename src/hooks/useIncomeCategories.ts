import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface IncomeCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_active: boolean;
}

const mockIncomeCategories: IncomeCategory[] = [
  { id: '1', user_id: 'demo', name: 'Salário', color: '#22C55E', icon: 'briefcase', is_active: true },
  { id: '2', user_id: 'demo', name: 'Freelance', color: '#6366F1', icon: 'laptop', is_active: true },
  { id: '3', user_id: 'demo', name: 'Investimentos', color: '#EAB308', icon: 'trending-up', is_active: true },
];

export function useIncomeCategories() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['income_categories', user?.id],
    queryFn: async () => {
      if (isDemo) return mockIncomeCategories;
      const { data, error } = await supabase.from('income_categories').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      return data as IncomeCategory[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (category: Omit<IncomeCategory, 'id' | 'user_id'>) => {
      if (isDemo) return category as IncomeCategory;
      const { data, error } = await supabase.from('income_categories').insert([{ ...category, user_id: user?.id }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_categories'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IncomeCategory> & { id: string }) => {
      if (isDemo) return;
      const { error } = await supabase.from('income_categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('income_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income_categories'] }),
  });

  return { 
    ...query, 
    addIncomeCategory: addMutation.mutateAsync, 
    updateIncomeCategory: updateMutation.mutateAsync,
    deleteIncomeCategory: deleteMutation.mutateAsync
  };
}
