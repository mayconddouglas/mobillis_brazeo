import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z.string().min(1, 'O valor é obrigatório.'),
  category_id: z.string().min(1, 'A categoria é obrigatória.'),
  wallet_id: z.string().min(1, 'A conta é obrigatória.'),
  date: z.string().min(1, 'A data é obrigatória.'),
  description: z.string().optional(),
  transaction_type: z.enum(['single', 'installment', 'recurring']),
  installment_count: z.string().optional(),
  recurring_frequency: z.enum(['monthly', 'yearly', 'weekly', 'custom']).optional(),
}).superRefine((data, ctx) => {
  if (data.transaction_type === 'installment') {
    const count = parseInt(data.installment_count || '0', 10);
    if (isNaN(count) || count < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Número de parcelas inválido.',
        path: ['installment_count'],
      });
    }
  }
  if (data.transaction_type === 'recurring' && !data.recurring_frequency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Frequência é obrigatória para transações recorrentes.',
      path: ['recurring_frequency'],
    });
  }
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
