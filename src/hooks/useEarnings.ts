import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';
import { Earning } from '@/types/earning';

const mockEarnings: Earning[] = [
  { id: '1', user_id: 'demo', category_id: '1', wallet_id: '1', amount: 120.50, date: format(new Date(), 'yyyy-MM-dd'), description: 'Bonus fds', created_at: new Date().toISOString() },
  { id: '2', user_id: 'demo', category_id: '2', wallet_id: '1', amount: 85.00, date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), description: null, created_at: new Date().toISOString() },
  { id: '3', user_id: 'demo', category_id: '1', wallet_id: '1', amount: 200.00, date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), description: 'Chuva', created_at: new Date().toISOString() },
];

function getDemoKey(userId?: string) {
  return `demo_earnings_${userId || 'demo'}`;
}

function safeId() {
  const c = globalThis.crypto as Crypto | undefined;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadDemoEarnings(userId?: string) {
  try {
    const raw = localStorage.getItem(getDemoKey(userId));
    if (!raw) return mockEarnings;
    const parsed = JSON.parse(raw) as Earning[];
    return Array.isArray(parsed) ? parsed : mockEarnings;
  } catch {
    return mockEarnings;
  }
}

function saveDemoEarnings(userId: string | undefined, items: Earning[]) {
  try {
    localStorage.setItem(getDemoKey(userId), JSON.stringify(items));
  } catch {
  }
}

export function useEarnings() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['earnings', user?.id],
    queryFn: async () => {
      if (isDemo) return loadDemoEarnings(user?.id);
      const { data, error } = await supabase.from('earnings').select('*').eq('user_id', user?.id).order('date', { ascending: false });
      if (error) throw error;
      return data as Earning[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (earning: Omit<Earning, 'id' | 'created_at' | 'user_id'>) => {
      if (isDemo) {
        const now = new Date().toISOString();
        const next: Earning = {
          ...earning,
          id: safeId(),
          user_id: user?.id || 'demo',
          created_at: now,
        };
        const current = loadDemoEarnings(user?.id);
        const updated = [next, ...current];
        saveDemoEarnings(user?.id, updated);
        return next;
      }
      const { data, error } = await supabase.from('earnings').insert([{ ...earning, user_id: user?.id }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      if (isDemo) {
        queryClient.setQueryData<Earning[]>(['earnings', user?.id], (prev) => {
          const safePrev = prev ?? loadDemoEarnings(user?.id);
          return [created as Earning, ...safePrev];
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Earning> & { id: string }) => {
      if (isDemo) {
        const current = loadDemoEarnings(user?.id);
        const updated = current.map((e) => (e.id === id ? ({ ...e, ...updates } as Earning) : e));
        saveDemoEarnings(user?.id, updated);
        return;
      }
      const { error } = await supabase.from('earnings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (isDemo) {
        queryClient.setQueryData<Earning[]>(['earnings', user?.id], loadDemoEarnings(user?.id));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const current = loadDemoEarnings(user?.id);
        const updated = current.filter((e) => e.id !== id);
        saveDemoEarnings(user?.id, updated);
        return;
      }
      const { error } = await supabase.from('earnings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (isDemo) {
        queryClient.setQueryData<Earning[]>(['earnings', user?.id], loadDemoEarnings(user?.id));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });

  const addMultipleMutation = useMutation({
    mutationFn: async (earnings: Omit<Earning, 'id' | 'created_at' | 'user_id'>[]) => {
      if (isDemo) {
        const now = new Date().toISOString();
        const nexts = earnings.map(earning => ({
          ...earning,
          id: safeId(),
          user_id: user?.id || 'demo',
          created_at: now,
        }));
        const current = loadDemoEarnings(user?.id);
        const updated = [...nexts, ...current];
        saveDemoEarnings(user?.id, updated);
        return nexts;
      }
      const payloads = earnings.map(e => ({ ...e, user_id: user?.id }));
      const { data, error } = await supabase.from('earnings').insert(payloads).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      if (isDemo) {
        queryClient.setQueryData<Earning[]>(['earnings', user?.id], (prev) => {
          const safePrev = prev ?? loadDemoEarnings(user?.id);
          return [...(created as Earning[]), ...safePrev];
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });

  return { 
    ...query, 
    addEarning: addMutation.mutateAsync,
    addMultipleEarnings: addMultipleMutation.mutateAsync,
    updateEarning: updateMutation.mutateAsync,
    deleteEarning: deleteMutation.mutateAsync
  };
}
