import { fromCents, toCents } from './money.ts';

export type WalletBalanceRow = {
  id: string;
  base_balance?: number | null;
  balance?: number | null;
};

export type WalletMovementRow = {
  wallet_id?: string | null;
  amount: number;
};

export function deriveWalletBalances<TWallet extends WalletBalanceRow>(
  wallets: TWallet[],
  earnings: WalletMovementRow[],
  expenses: WalletMovementRow[]
): (TWallet & { base_balance: number; balance: number })[] {
  const netByWalletId = new Map<string, number>();

  for (const e of earnings) {
    const walletId = e.wallet_id;
    if (!walletId) continue;
    netByWalletId.set(walletId, (netByWalletId.get(walletId) ?? 0) + toCents(e.amount));
  }

  for (const x of expenses) {
    const walletId = x.wallet_id;
    if (!walletId) continue;
    netByWalletId.set(walletId, (netByWalletId.get(walletId) ?? 0) - toCents(x.amount));
  }

  return wallets.map((w) => {
    const base = toCents(w.base_balance ?? w.balance ?? 0);
    const net = netByWalletId.get(w.id) ?? 0;
    const derived = fromCents(base + net);

    return {
      ...(w as TWallet),
      base_balance: fromCents(base),
      balance: derived,
    };
  });
}
