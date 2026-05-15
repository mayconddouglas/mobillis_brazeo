import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';
import { useEarnings } from './useEarnings';
import { useExpenses } from './useExpenses';
import { toCents, fromCents } from '@/utils/money';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  base_balance?: number;
  balance: number;
  color: string;
  icon: string;
  type?: string;
}

export type WalletCreateInput = Omit<Wallet, 'id' | 'user_id' | 'balance'> & {
  base_balance?: number;
  balance?: number;
};

export type WalletUpdateInput = Partial<Omit<Wallet, 'user_id' | 'balance'>> & {
  id: string;
  base_balance?: number;
  balance?: number;
};

const mockWallets: Wallet[] = [
  { id: '1', user_id: 'demo', name: 'Conta Corrente', base_balance: 1500.00, balance: 1500.00, color: '#3B82F6', icon: 'landmark', type: 'checking' },
  { id: '2', user_id: 'demo', name: 'Cartão de Crédito', base_balance: -150.00, balance: -150.00, color: '#10B981', icon: 'credit-card', type: 'credit' },
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
  const { data: earnings } = useEarnings();
  const { data: expenses } = useExpenses();

  const query = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (isDemo) {
        return loadDemoWallets(user?.id);
      }
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      return data as Wallet[];
    },
    enabled: !!user,
  });

  const computedWallets = useMemo(() => {
    const rows = query.data;
    if (!rows) return rows;

    const debug =
      typeof window !== 'undefined' &&
      (import.meta as any)?.env?.DEV &&
      window.localStorage?.getItem('debug_finance') === '1';

    const netByWalletId = new Map<string, number>();
    for (const e of earnings ?? []) {
      const walletId = (e as any).wallet_id as string | null | undefined;
      if (!walletId) continue;
      netByWalletId.set(walletId, (netByWalletId.get(walletId) ?? 0) + toCents((e as any).amount));
    }
    for (const x of expenses ?? []) {
      const walletId = (x as any).wallet_id as string | null | undefined;
      if (!walletId) continue;
      netByWalletId.set(walletId, (netByWalletId.get(walletId) ?? 0) - toCents((x as any).amount));
    }

    const next = rows.map((wallet) => {
      const base = toCents((wallet as any).base_balance ?? (wallet as any).balance ?? 0);
      const net = netByWalletId.get(wallet.id) ?? 0;
      const derived = fromCents(base + net);

      return {
        ...wallet,
        base_balance: fromCents(base),
        balance: derived,
      };
    });

    if (debug) {
      console.debug(
        '[wallets.balance]',
        next.map(w => ({ id: w.id, name: w.name, base_balance: w.base_balance, balance: w.balance }))
      );
    }

    return next;
  }, [earnings, expenses, query.data]);

  const addMutation = useMutation({
    mutationFn: async (newWallet: WalletCreateInput) => {
      if (isDemo) {
        const id = `${Date.now()}`;
        const wallets = loadDemoWallets(user?.id);
        const base = (newWallet as any).base_balance ?? (newWallet as any).balance ?? 0;
        saveDemoWallets(user?.id, [...wallets, { ...newWallet, base_balance: base, balance: base, id, user_id: user?.id || 'demo' }]);
        return;
      }
      const base = (newWallet as any).base_balance ?? (newWallet as any).balance ?? 0;
      const payloadBase = { ...newWallet, base_balance: base, user_id: user?.id };
      const { error } = await supabase.from('wallets').insert([payloadBase]);
      if (!error) return;

      const payloadLegacy = { ...newWallet, balance: base, user_id: user?.id };
      const retry = await supabase.from('wallets').insert([payloadLegacy]);
      if (retry.error) throw retry.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: WalletUpdateInput) => {
      if (isDemo) {
        const wallets = loadDemoWallets(user?.id);
        const next = wallets.map(w => w.id === id ? { ...w, ...updates } : w);
        saveDemoWallets(user?.id, next);
        return;
      }
      const { balance, base_balance, ...rest } = updates as any;
      const base = base_balance ?? balance;
      const payloadBase = base !== undefined ? { ...rest, base_balance: base } : rest;
      const { error } = await supabase.from('wallets').update(payloadBase).eq('id', id);
      if (!error) return;

      const payloadLegacy = base !== undefined ? { ...rest, balance: base } : rest;
      const retry = await supabase.from('wallets').update(payloadLegacy).eq('id', id);
      if (retry.error) throw retry.error;
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
    data: computedWallets,
    addWallet: addMutation.mutateAsync,
    updateWallet: updateMutation.mutateAsync,
    deleteWallet: deleteMutation.mutateAsync
  };
}
