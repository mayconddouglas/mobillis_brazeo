export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  wallet_id: string;
  amount: number;
  description: string;
  date: string;
  
  is_recurring?: boolean;
  recurring_frequency?: 'monthly' | 'yearly' | 'weekly' | 'custom';
  
  is_installment?: boolean;
  installment_current?: number;
  installment_total?: number;
  group_id?: string;
  
  created_at: string;
}
