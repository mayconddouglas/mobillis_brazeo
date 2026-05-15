import { deriveWalletBalances } from '../src/utils/walletBalance.ts';

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${expected}, recebido ${actual}`);
  }
}

function toFixed2(n: number) {
  return n.toFixed(2);
}

function run() {
  const wallets = [{ id: 'w1', base_balance: 27.43 }];
  const earnings: Array<{ wallet_id: string; amount: number }> = [];
  const expenses: Array<{ wallet_id: string; amount: number }> = [{ wallet_id: 'w1', amount: 6.0 }];

  const [w1] = deriveWalletBalances(wallets as any, earnings, expenses);
  assertEqual(toFixed2(w1.balance), '21.43', 'saldo após despesa');

  const wallets2 = [{ id: 'w1', base_balance: 27.43 }];
  const earnings2 = [{ wallet_id: 'w1', amount: 10.0 }];
  const expenses2 = [{ wallet_id: 'w1', amount: 6.0 }];

  const [w2] = deriveWalletBalances(wallets2 as any, earnings2, expenses2);
  assertEqual(toFixed2(w2.balance), '31.43', 'saldo após receita e despesa');
}

run();
