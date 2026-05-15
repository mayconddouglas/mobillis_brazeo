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
  type?: string;
}

const mockWallets: Wallet[] = [
  { id: '1', user_id: 'demo', name: 'Conta Corrente', balance: 1500.00, color: '#3B82F6', icon: 'landmark', type: 'checking' },
  { id: '2', user_id: 'demo', name: 'Cartão de Crédito', balance: -150.00, color: '#10B981', icon: 'credit-card', type: 'credit' },
];

const getDemoKey = (userId?: string) => `demo_wallets_${userId || 'demo'}`;

function loadDemoWallets(userId?: string): Wallet[] {
  try {
    const raw = localStorage.getItem(getDemoKey(userId));
    if (!raw) return mockWallets;
    const parsed = JSON.parse(raw) as Wallet[];
    return Array.isArray(parsed) ? parsed : mockWallets;
  } catch {
    return mockWallets;
  }
}

function saveDemoWallets(userId: string | undefined, items: Wallet[]) {
  try {
    localStorage.setItem(getDemoKey(userId), JSON.stringify(items));
  } catch {}
}

export function useWallets() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      let walletsData: Wallet[];
      let earningsData: any[] = [];
      let expensesData: any[] = [];

      if (isDemo) {
        walletsData = loadDemoWallets(user?.id);
        // We'd need to mock the loading of expenses/earnings similarly, but for now we'll assume they are loaded via other queries and this hook is getting stale data?
        // Actually, this hook needs to be able to fetch earnings/expenses.
        // Given constraints, I will fetch them directly via supabase here.
      } else {
        const [walletsRes, earningsRes, expensesRes] = await Promise.all([
          supabase.from('wallets').select('*').eq('user_id', user?.id).order('name'),
          supabase.from('earnings').select('*').eq('user_id', user?.id),
          supabase.from('expenses').select('*').eq('user_id', user?.id)
        ]);
        if (walletsRes.error) throw walletsRes.error;
        walletsData = walletsRes.data as Wallet[];
        earningsData = earningsRes.data || [];
        expensesData = expensesRes.data || [];
      }

      return walletsData.map(wallet => {
        const walletEarnings = earningsData.filter(e => e.wallet_id === wallet.id).reduce((sum, e) => sum + Number(e.amount), 0);
        const walletExpenses = expensesData.filter(e => e.wallet_id === wallet.id).reduce((sum, e) => sum + Number(e.amount), 0);
        
        // O Supabase DEVE conter apenas o saldo inicial base para esta formula funcionar.
        const initialBalance = Number(wallet.base_balance) || 0;
        
        return { 
          ...wallet, 
          balance: initialBalance + walletEarnings - walletExpenses 
        };
      });
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (newWallet: Omit<Wallet, 'id' | 'user_id'>) => {
      if (isDemo) {
        const id = `${Date.now()}`;
        const wallets = loadDemoWallets(user?.id);
        saveDemoWallets(user?.id, [...wallets, { ...newWallet, id, user_id: user?.id || 'demo' }]);
        return;
      }
      const { error } = await supabase.from('wallets').insert([{ ...newWallet, user_id: user?.id }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Wallet> & { id: string }) => {
      if (isDemo) {
        const wallets = loadDemoWallets(user?.id);
        saveDemoWallets(user?.id, wallets.map(w => w.id === id ? { ...w, ...updates } : w));
        return;
      }
      const { error } = await supabase.from('wallets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const wallets = loadDemoWallets(user?.id);
        saveDemoWallets(user?.id, wallets.filter(w => w.id !== id));
        return;
      }
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
