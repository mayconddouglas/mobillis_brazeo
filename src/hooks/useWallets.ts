import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  color: string;
  icon: string;
}

const mockWallets: Wallet[] = [
  { id: '1', user_id: 'demo', name: 'Conta Corrente', balance: 1500.00, color: '#3B82F6', icon: 'landmark' },
  { id: '2', user_id: 'demo', name: 'Carteira (Dinheiro)', balance: 150.00, color: '#10B981', icon: 'banknote' },
];

export function useWallets() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (isDemo) return mockWallets;
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      return data as Wallet[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (newWallet: Omit<Wallet, 'id' | 'user_id'>) => {
      if (isDemo) return;
      const { error } = await supabase.from('wallets').insert([{ ...newWallet, user_id: user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Wallet> & { id: string }) => {
      if (isDemo) return;
      const { error } = await supabase.from('wallets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  return {
    ...query,
    addWallet: addMutation.mutateAsync,
    updateWallet: updateMutation.mutateAsync,
    deleteWallet: deleteMutation.mutateAsync
  };
}
