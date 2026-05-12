import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays } from 'date-fns';

export interface Earning {
  id: string;
  user_id: string;
  platform_id: string;
  amount: number;
  date: string;
  note: string | null;
  expense_target?: number;
  cycle_start?: string;
  cycle_end?: string;
  is_recurring?: boolean;
  created_at: string;
}

const mockEarnings: Earning[] = [
  { id: '1', user_id: 'demo-user-123', platform_id: '1', amount: 120.50, date: format(new Date(), 'yyyy-MM-dd'), note: 'Bonus fds', created_at: new Date().toISOString() },
  { id: '2', user_id: 'demo-user-123', platform_id: '2', amount: 85.00, date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), note: null, created_at: new Date().toISOString() },
  { id: '3', user_id: 'demo-user-123', platform_id: '1', amount: 200.00, date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), note: 'Chuva', created_at: new Date().toISOString() },
];

export function useEarnings() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['earnings', user?.id],
    queryFn: async () => {
      if (isDemo) return mockEarnings;
      const { data, error } = await supabase.from('earnings').select('*').eq('user_id', user?.id).order('date', { ascending: false });
      if (error) throw error;
      return data as Earning[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (newEarning: Omit<Earning, 'id' | 'created_at' | 'user_id'>) => {
      if (isDemo) {
        const earning = { ...newEarning, id: Math.random().toString(), user_id: user!.id, created_at: new Date().toISOString() };
        mockEarnings.push(earning);
        return earning;
      }
      const { data, error } = await supabase.from('earnings').insert([{ ...newEarning, user_id: user?.id }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['earnings'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Earning> & { id: string }) => {
      if (isDemo) return;
      const { error } = await supabase.from('earnings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['earnings'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('earnings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['earnings'] }),
  });

  return { 
    ...query, 
    addEarning: addMutation.mutateAsync,
    updateEarning: updateMutation.mutateAsync,
    deleteEarning: deleteMutation.mutateAsync
  };
}
