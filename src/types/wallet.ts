export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  base_balance?: number;
  balance: number;
  color: string;
  created_at: string;
}
