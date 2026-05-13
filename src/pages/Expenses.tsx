import React, { useState, useMemo } from 'react';
import { useExpenses, useExpenseCategories, useWallets, Expense } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, Calendar as CalendarIcon, Tag, CreditCard, Edit2, Trash2, ChevronRight, Filter } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';

const parseDateLocal = (dateStr: string) => new Date(dateStr + 'T12:00:00');

export default function Expenses() {
  const { data: expenses, addExpense, addMultipleExpenses, updateExpense, deleteExpense } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const { data: wallets, updateWallet } = useWallets();
  
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [transactionType, setTransactionType] = useState<'single' | 'installment' | 'recurring'>('single');
  const [installmentCount, setInstallmentCount] = useState('2');
  const [recurringFrequency, setRecurringFrequency] = useState<'monthly' | 'yearly'>('monthly');

  const [newExpense, setNewExpense] = useState({
    amount: '',
    category_id: '',
    wallet_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormError(null);
    setNewExpense({
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      wallet_id: expense.wallet_id,
      date: expense.date,
      description: expense.description || '',
    });
    if (expense.is_installment) {
      setTransactionType('installment');
      setInstallmentCount(expense.installment_total?.toString() || '2');
    } else if (expense.is_recurring) {
      setTransactionType('recurring');
      setRecurringFrequency((expense.recurring_frequency as any) || 'monthly');
    } else {
      setTransactionType('single');
    }
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormError(null);
    setTransactionType('single');
    setInstallmentCount('2');
    setRecurringFrequency('monthly');
    setNewExpense({
      amount: '',
      category_id: categoryFilter !== 'all' ? categoryFilter : '',
      wallet_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newExpense.amount || !newExpense.description || !newExpense.date) {
      setFormError('Preencha valor, descrição e data.');
      return;
    }
    if (!newExpense.category_id) {
      setFormError('Selecione uma categoria.');
      return;
    }
    if (!newExpense.wallet_id) {
      setFormError('Selecione uma conta.');
      return;
    }

    let newAmount = parseFloat(newExpense.amount.toString().replace(',', '.'));
    if (Number.isNaN(newAmount) || newAmount <= 0) {
      setFormError('Informe um valor válido.');
      return;
    }

    setSaving(true);
    try {
      if (editingExpense) {
        // Edit single expense
        const dataPayload = {
          amount: newAmount,
          category_id: newExpense.category_id,
          wallet_id: newExpense.wallet_id,
          date: newExpense.date,
          description: newExpense.description,
          // note: we could allow changing between single, recurring, etc for existing one,
          // but usually we just keep the previous attributes if we edit a single entry
          is_recurring: transactionType === 'recurring',
          recurring_frequency: transactionType === 'recurring' ? recurringFrequency : undefined,
          is_installment: transactionType === 'installment',
          installment_total: transactionType === 'installment' ? parseInt(installmentCount, 10) : undefined,
        };

        await updateExpense({ id: editingExpense.id, ...dataPayload });
        
        if (editingExpense.wallet_id === dataPayload.wallet_id) {
          const difference = dataPayload.amount - editingExpense.amount;
          if (difference !== 0) {
            const wallet = wallets?.find(w => w.id === dataPayload.wallet_id);
            if (wallet) {
              await updateWallet({ id: wallet.id, balance: wallet.balance - difference });
            }
          }
        } else {
          const oldWallet = wallets?.find(w => w.id === editingExpense.wallet_id);
          if (oldWallet) {
            await updateWallet({ id: oldWallet.id, balance: oldWallet.balance + editingExpense.amount });
          }
          const newWallet = wallets?.find(w => w.id === dataPayload.wallet_id);
          if (newWallet) {
            await updateWallet({ id: newWallet.id, balance: newWallet.balance - dataPayload.amount });
          }
        }
      } else {
        // Adding new expense
        const basePayload = {
          amount: newAmount,
          category_id: newExpense.category_id,
          wallet_id: newExpense.wallet_id,
          description: newExpense.description,
        };

        // Determine if we need multiple inserts
        const payloads: Omit<Expense, 'id' | 'created_at' | 'user_id'>[] = [];
        let totalDeductionFromWallet = 0;
        
        if (transactionType === 'single') {
          payloads.push({
            ...basePayload,
            date: newExpense.date,
            is_recurring: false,
            is_installment: false,
          });
          totalDeductionFromWallet = basePayload.amount;
        } else if (transactionType === 'installment') {
          const count = parseInt(installmentCount, 10);
          if (isNaN(count) || count < 2) {
            setFormError('Número de parcelas inválido.');
            setSaving(false);
            return;
          }
          // Usually installments divide the total amount
          // Or is the input amount the parcel amount? Let's assume input is parcel amount to keep code simple, actually usually users input total amount in "parceladas" but we can split or replicate. Let's replicate as parcel amount for simplicity with wallets.
          // Let's divide the amount by count
          const parcelAmount = basePayload.amount / count;
          const groupId = globalThis.crypto?.randomUUID?.() || Date.now().toString();
          
          let startDate = parseDateLocal(newExpense.date);
          for (let i = 1; i <= count; i++) {
            payloads.push({
              ...basePayload,
              amount: parseFloat(parcelAmount.toFixed(2)),
              date: format(startDate, 'yyyy-MM-dd'),
              is_recurring: false,
              is_installment: true,
              installment_current: i,
              installment_total: count,
              group_id: groupId,
            });
            // increment a month
            startDate.setMonth(startDate.getMonth() + 1);
          }
          totalDeductionFromWallet = basePayload.amount; // full amount deduces over time, wait, we deduct full amount now or just first parcel? We should only deduct what is paid. Actually, a credit card expense isn't deducted from balance immediately usually, but let's deduct just the first parcel or full? Let's deduct from wallet the amount for this month.
          totalDeductionFromWallet = parseFloat(parcelAmount.toFixed(2));
        } else if (transactionType === 'recurring') {
          const groupId = globalThis.crypto?.randomUUID?.() || Date.now().toString();
          
          let startDate = parseDateLocal(newExpense.date);
          // Pre-generate 12 months for recurring
          const preGenerateCount = recurringFrequency === 'monthly' ? 12 : 1;
          for (let i = 0; i < preGenerateCount; i++) {
            payloads.push({
              ...basePayload,
              date: format(startDate, 'yyyy-MM-dd'),
              is_recurring: true,
              recurring_frequency: recurringFrequency,
              group_id: groupId,
            });
            if (recurringFrequency === 'monthly') startDate.setMonth(startDate.getMonth() + 1);
            else startDate.setFullYear(startDate.getFullYear() + 1);
          }
          totalDeductionFromWallet = basePayload.amount; // deduct just the first occurrence
        }

        await addMultipleExpenses?.(payloads) || await addExpense(payloads[0]);
        
        const wallet = wallets?.find(w => w.id === basePayload.wallet_id);
        if (wallet) {
          await updateWallet({ id: wallet.id, balance: wallet.balance - totalDeductionFromWallet });
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível salvar a despesa.';
      setFormError(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const expenseToDelete = expenses?.find(e => e.id === id);
    await deleteExpense(id);
    
    // Refund wallet
    if (expenseToDelete) {
      const wallet = wallets?.find(w => w.id === expenseToDelete.wallet_id);
      if (wallet) {
        await updateWallet({ id: wallet.id, balance: wallet.balance + expenseToDelete.amount });
      }
    }
    
    setIsModalOpen(false);
  };

  const timeFilteredExpenses = expenses?.filter(e => {
    const d = parseDateLocal(e.date);
    if (filter === 'today') return isToday(d);
    if (filter === 'week') return isThisWeek(d);
    if (filter === 'month') return isThisMonth(d);
    return true;
  }) || [];

  const filteredExpenses = timeFilteredExpenses.filter(e => 
    categoryFilter === 'all' ? true : e.category_id === categoryFilter
  );

  const total = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Group by date
  const grouped = filteredExpenses.reduce((acc, expense) => {
    if (!acc[expense.date]) acc[expense.date] = [];
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const selectedCategoryMatch = categories?.find(c => c.id === newExpense.category_id);
  const selectedWalletMatch = wallets?.find(w => w.id === newExpense.wallet_id);

  return (
    <div className="p-4 space-y-6 pb-24 relative min-h-screen">
      {/* Header filter */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button variant={filter === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('today')}>Hoje</Button>
          <Button variant={filter === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('week')}>Esta semana</Button>
          <Button variant={filter === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('month')}>Este mês</Button>
        </div>
        
        {/* Category scrollable filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
          <Filter size={16} className="text-muted-foreground shrink-0 mr-1" />
          <Button 
            variant={categoryFilter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="rounded-full shrink-0"
            onClick={() => setCategoryFilter('all')}
          >
            Todas
          </Button>
          {categories?.map(c => (
            <Button 
              key={c.id}
              variant={categoryFilter === c.id ? 'secondary' : 'ghost'} 
              size="sm" 
              className={`rounded-full shrink-0 gap-2 ${categoryFilter === c.id ? 'font-bold' : ''}`}
              onClick={() => setCategoryFilter(c.id)}
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: c.color }}>
                <Tag size={10} />
              </div>
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Total card */}
      <div className="bg-card border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-rose-600"></div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Total {categoryFilter !== 'all' ? categories?.find(c => c.id === categoryFilter)?.name : 'Despesas'}
        </p>
        <h2 className="text-4xl font-black font-mono text-red-500 tracking-tighter">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </h2>
      </div>

      {/* List */}
      <div className="space-y-6 mt-6">
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2 px-1">
              <CalendarIcon size={14} />
              {format(parseDateLocal(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="space-y-3">
              {items.map((expense) => {
                const category = categories?.find(c => c.id === expense.category_id);
                const wallet = wallets?.find(w => w.id === expense.wallet_id);
                
                return (
                  <Card key={expense.id} className="shadow-sm cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all border group" onClick={() => handleOpenEdit(expense)}>
                    <CardContent className="p-3 pr-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm" style={{ backgroundColor: category?.color || '#ef4444' }}>
                          <Tag size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                            {expense.description}
                            {expense.is_installment && ` (${expense.installment_current}/${expense.installment_total})`}
                            {expense.is_recurring && ` (Rotineira)` }
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{category?.name || 'Desconhecida'} • {wallet?.name || 'Desconhecida'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-mono font-black text-red-600 text-sm">
                            -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
            <Receipt size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Nenhuma despesa registrada neste período.</p>
          </div>
        )}
      </div>

      <Button onClick={handleOpenAdd} className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center z-40 transition-transform active:scale-95">
        <Plus size={24} />
      </Button>

      {/* Modal / Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Editar Despesa' : 'Adicionar Despesa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-5 mt-4">
            {formError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor da Despesa (R$)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01"
                required
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                className="h-14 text-2xl font-black font-mono text-red-500 px-4"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input 
                id="description" 
                type="text" 
                placeholder="Ex: Almoço, Combustível"
                required
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={newExpense.category_id} 
                onValueChange={(val) => setNewExpense({...newExpense, category_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a categoria">
                    {selectedCategoryMatch ? selectedCategoryMatch.name : (newExpense.category_id ? 'Categoria Deletada' : 'Selecione a categoria')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">Conta / Cartão</Label>
              <Select 
                value={newExpense.wallet_id} 
                onValueChange={(val) => setNewExpense({...newExpense, wallet_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a conta">
                     {selectedWalletMatch ? selectedWalletMatch.name : (newExpense.wallet_id ? 'Conta Deletada' : 'Selecione a conta')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input 
                id="date" 
                type="date" 
                required
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                className="h-12"
              />
            </div>

            <div className="pt-2 border-t mt-2">
              <Label className="mb-2 block">Tipo de Despesa</Label>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant={transactionType === 'single' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setTransactionType('single')}
                >
                  Única
                </Button>
                <Button 
                  type="button" 
                  variant={transactionType === 'installment' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setTransactionType('installment')}
                >
                  Parcelada
                </Button>
                <Button 
                  type="button" 
                  variant={transactionType === 'recurring' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setTransactionType('recurring')}
                >
                  Fixa
                </Button>
              </div>
            </div>

            {transactionType === 'installment' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Select value={installmentCount} onValueChange={setInstallmentCount}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[2,3,4,5,6,10,12,24].map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">O valor será dividido pelo número de parcelas.</p>
              </div>
            )}

            {transactionType === 'recurring' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select value={recurringFrequency} onValueChange={(val: any) => setRecurringFrequency(val)}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t mt-2">
              {editingExpense && (
                <Button disabled={saving} type="button" variant="outline" onClick={() => handleDelete(editingExpense.id)} className="h-12 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                  <Trash2 size={18} />
                </Button>
              )}
              <Button disabled={saving} type="submit" className="flex-1 h-12 font-bold text-base bg-red-500 hover:bg-red-600">
                {saving ? 'Salvando...' : (editingExpense ? 'Salvar Edição' : 'Salvar Despesa')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
