import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { transactionSchema, TransactionFormValues } from '@/lib/transactionSchema';
import { parseBRLInput, formatBRL } from '@/utils/currency';
import { parseDateLocal } from '@/utils/date';
import { buildInstallmentPayloads, buildRecurringPayloads, RecurringFrequency } from '@/utils/transaction';

interface Category {
  id: string;
  name: string;
  // ...other fields we might not need directly here
}

interface Wallet {
  id: string;
  name: string;
  // ...other fields we might not need directly here
}

interface TransactionItem {
  id: string;
  amount: number;
  category_id: string;
  wallet_id: string;
  date: string;
  description: string | null;
  is_installment?: boolean;
  installment_total?: number;
  is_recurring?: boolean;
  recurring_frequency?: string;
  [key: string]: any;
}

interface TransactionModalProps {
  type: 'earning' | 'expense';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: TransactionItem | null;
  onSave: (payloads: any[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories: Category[];
  wallets: Wallet[];
}

export function TransactionModal({
  type,
  open,
  onOpenChange,
  editingItem,
  onSave,
  onDelete,
  categories,
  wallets,
}: TransactionModalProps) {
  const [saving, setSaving] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      category_id: '',
      wallet_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      transaction_type: 'single',
      installment_count: '2',
      recurring_frequency: 'monthly',
    },
  });

  const transactionType = watch('transaction_type');
  const amountValue = watch('amount');

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setValue('amount', editingItem.amount.toString().replace('.', ','));
        setValue('category_id', editingItem.category_id);
        setValue('wallet_id', editingItem.wallet_id || (wallets[0]?.id || ''));
        setValue('date', editingItem.date);
        setValue('description', editingItem.description || '');

        if (editingItem.is_installment) {
          setValue('transaction_type', 'installment');
          setValue('installment_count', editingItem.installment_total?.toString() || '2');
        } else if (editingItem.is_recurring) {
          setValue('transaction_type', 'recurring');
          setValue('recurring_frequency', (editingItem.recurring_frequency as 'monthly' | 'yearly' | 'weekly' | 'custom') || 'monthly');
        } else {
          setValue('transaction_type', 'single');
        }
      } else {
        reset({
          amount: '',
          category_id: '',
          wallet_id: wallets[0]?.id || '',
          date: format(new Date(), 'yyyy-MM-dd'),
          description: '',
          transaction_type: 'single',
          installment_count: '2',
          recurring_frequency: 'monthly',
        });
      }
    }
  }, [open, editingItem, wallets, reset, setValue]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic mask for BRL
    let val = e.target.value;
    val = val.replace(/\D/g, ''); // keep only numbers
    if (val) {
      const num = parseInt(val, 10) / 100;
      setValue('amount', num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), { shouldValidate: true });
    } else {
      setValue('amount', '', { shouldValidate: true });
    }
  };

  const onSubmit = async (data: TransactionFormValues) => {
    console.log('onSubmit called with:', data);
    setSaving(true);
    try {
      const numericAmount = parseBRLInput(data.amount);
      const basePayload = {
        amount: numericAmount,
        category_id: data.category_id,
        wallet_id: data.wallet_id,
        description: data.description || '',
      };

      if (editingItem) {
        const updatePayload = {
          id: editingItem.id,
          ...basePayload,
          date: data.date,
          is_recurring: data.transaction_type === 'recurring',
          recurring_frequency: data.transaction_type === 'recurring' ? data.recurring_frequency : undefined,
          is_installment: data.transaction_type === 'installment',
          installment_total: data.transaction_type === 'installment' ? parseInt(data.installment_count || '0', 10) : undefined,
        };
        await onSave([updatePayload]);
      } else {
        let payloads: any[] = [];
        const baseDateObj = parseDateLocal(data.date);
        const groupId = globalThis.crypto?.randomUUID?.() || Date.now().toString();

        if (data.transaction_type === 'single') {
          payloads.push({
            amount: basePayload.amount,
            category_id: basePayload.category_id,
            wallet_id: basePayload.wallet_id,
            description: basePayload.description,
            date: data.date,
            is_recurring: false,
          });
        } else if (data.transaction_type === 'installment') {
          const count = parseInt(data.installment_count || '0', 10);
          const parcelAmount = parseFloat((basePayload.amount / count).toFixed(2));
          // Sanitizing payload to remove non-database fields
          payloads = buildInstallmentPayloads(
            {
              amount: parcelAmount,
              category_id: basePayload.category_id,
              wallet_id: basePayload.wallet_id,
              description: basePayload.description,
              date: data.date, 
              is_recurring: false,
            },
            count,
            baseDateObj
          );
          // Manually ensure is_installment-related fields are stripped after building payloads
          payloads = payloads.map(({ is_installment, installment_current, installment_total, group_id, ...rest }) => rest);
        } else if (data.transaction_type === 'recurring') {
          const count = data.recurring_frequency === 'monthly' ? 12 : (data.recurring_frequency === 'yearly' ? 5 : 12);
          // Sanitizing payload to remove non-database fields
          payloads = buildRecurringPayloads(
            {
              amount: basePayload.amount,
              category_id: basePayload.category_id,
              wallet_id: basePayload.wallet_id,
              description: basePayload.description,
              date: data.date,
              is_recurring: true,
            },
            data.recurring_frequency as RecurringFrequency,
            baseDateObj,
            count
          );
          // Manually ensure recurring-related fields are stripped after building payloads 
          // (is_recurring is a database field, keep it!)
          payloads = payloads.map(({ group_id, ...rest }) => rest);
        }
        await onSave(payloads);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar: ' + (error instanceof Error ? error.message : JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  const isIncome = type === 'earning';
  const title = isIncome 
    ? (editingItem ? 'Editar Receita' : 'Adicionar Receita') 
    : (editingItem ? 'Editar Despesa' : 'Adicionar Despesa');
  
  const submitButtonClass = isIncome ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-red-500 hover:bg-red-600 text-white';
  const amountColorClass = isIncome ? 'text-green-600' : 'text-red-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountValue}
                onChange={handleAmountChange}
                className={`h-14 text-2xl font-black font-mono px-4 ${amountColorClass}`}
              />
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Conta / Cartão</Label>
            <Controller
              control={control}
              name="wallet_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a conta">
                      {wallets.find(w => w.id === field.value)?.name || "Selecione a conta"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.wallet_id && <p className="text-xs text-destructive">{errors.wallet_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              control={control}
              name="category_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a categoria">
                      {categories.find(c => c.id === field.value)?.name || "Selecione a categoria"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <Input
                  id="date"
                  type="date"
                  {...field}
                  className="h-12"
                />
              )}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="space-y-2 border-t pt-4 mt-2">
            <Label htmlFor="description">Descrição</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Input
                  id="description"
                  type="text"
                  placeholder="Opcional..."
                  {...field}
                  value={field.value || ''}
                  className="h-12"
                />
              )}
            />
          </div>

          <div className="pt-2 border-t mt-2">
            <Label className="mb-2 block">Tipo de Transação</Label>
            <Controller
              control={control}
              name="transaction_type"
              render={({ field }) => (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === 'single' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => field.onChange('single')}
                  >
                    Única
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'installment' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => field.onChange('installment')}
                  >
                    Parcelada
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'recurring' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => field.onChange('recurring')}
                  >
                    Fixa
                  </Button>
                </div>
              )}
            />
          </div>

          <AnimatePresence mode="wait">
            {transactionType === 'installment' && (
              <motion.div
                key="installment"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label>Número de Parcelas</Label>
                <Controller
                  control={control}
                  name="installment_count"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Selecione...">
                          {field.value ? `${field.value}x` : "Selecione..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 10, 12, 24].map((num) => (
                          <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.installment_count && <p className="text-xs text-destructive">{errors.installment_count.message}</p>}
              </motion.div>
            )}

            {transactionType === 'recurring' && (
              <motion.div
                key="recurring"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label>Frequência</Label>
                <Controller
                  control={control}
                  name="recurring_frequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Selecione...">
                          {field.value === 'weekly' ? 'Semanal' : field.value === 'monthly' ? 'Mensal' : field.value === 'yearly' ? 'Anual' : "Selecione..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.recurring_frequency && <p className="text-xs text-destructive">{errors.recurring_frequency.message}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 pt-4 border-t mt-4">
            {editingItem && (
              <Button
                disabled={saving}
                type="button"
                variant="outline"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onDelete(editingItem.id);
                    onOpenChange(false);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="h-12 px-4 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={18} />
              </Button>
            )}
            <Button disabled={saving} type="submit" className={`flex-1 h-12 font-bold text-base ${submitButtonClass}`}>
              {saving ? 'Salvando...' : (editingItem ? 'Salvar Edição' : 'Salvar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
