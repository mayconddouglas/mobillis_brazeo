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
  const { data: expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const { data: wallets, updateWallet } = useWallets();
  
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category_id: '',
    wallet_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    is_recurring: false
  });

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      wallet_id: expense.wallet_id,
      date: expense.date,
      description: expense.description || '',
      is_recurring: expense.is_recurring || false
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setNewExpense({
      amount: '',
      category_id: categoryFilter !== 'all' ? categoryFilter : '',
      wallet_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      is_recurring: false
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.category_id || !newExpense.wallet_id || !newExpense.date || !newExpense.description) return;

    const newAmount = parseFloat(newExpense.amount.toString().replace(',', '.'));
    
    const dataPayload = {
      amount: newAmount,
      category_id: newExpense.category_id,
      wallet_id: newExpense.wallet_id,
      date: newExpense.date,
      description: newExpense.description,
      is_recurring: newExpense.is_recurring,
    };

    if (editingExpense) {
      await updateExpense({ id: editingExpense.id, ...dataPayload });
      
      // Update wallet balances if amount or wallet changed
      if (editingExpense.wallet_id === dataPayload.wallet_id) {
        // Same wallet, update the difference
        const difference = dataPayload.amount - editingExpense.amount;
        if (difference !== 0) {
          const wallet = wallets?.find(w => w.id === dataPayload.wallet_id);
          if (wallet) {
            await updateWallet({ id: wallet.id, balance: wallet.balance - difference });
          }
        }
      } else {
        // Different wallets, refund the old one and charge the new one
        const oldWallet = wallets?.find(w => w.id === editingExpense.wallet_id);
        if (oldWallet) {
          await updateWallet({ id: oldWallet.id, balance: oldWallet.balance + editingExpense.amount });
        }
        const newWallet = wallets?.find(w => w.id === dataPayload.wallet_id);
        if (newWallet) {
          // Note: using the array from useWallets might be slightly stale if we don't refetch, 
          // but for basic usage it works. (A realtime subscription or invalidation would be better)
          await updateWallet({ id: newWallet.id, balance: newWallet.balance - dataPayload.amount });
        }
      }
    } else {
      await addExpense(dataPayload);
      
      // Deduct from wallet
      const wallet = wallets?.find(w => w.id === dataPayload.wallet_id);
      if (wallet) {
        await updateWallet({ id: wallet.id, balance: wallet.balance - dataPayload.amount });
      }
    }
    
    setIsModalOpen(false);
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
          Total {categoryFilter !== 'all' ? categories?.find(c => c.id === categoryFilter)?.name : 'Gasto'}
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
                          <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{expense.description}</p>
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
            <p className="text-sm">Nenhum gasto registrado neste período.</p>
          </div>
        )}
      </div>

      {/* Modal / Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger
          render={
            <Button
              onClick={handleOpenAdd}
              className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center z-40 transition-transform active:scale-95"
            />
          }
        >
          <Plus size={24} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Editar Gasto' : 'Adicionar Gasto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Gasto (R$)</Label>
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
              <Label htmlFor="wallet">Conta / Carteira</Label>
              <Select 
                value={newExpense.wallet_id} 
                onValueChange={(val) => setNewExpense({...newExpense, wallet_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione de onde saiu o dinheiro">
                     {selectedWalletMatch ? selectedWalletMatch.name : (newExpense.wallet_id ? 'Conta Deletada' : 'Selecione a conta/carteira')}
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

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="recurring" className="text-base">Despesa Fixa / Recorrente</Label>
                <p className="text-xs text-muted-foreground">
                  Marcando esta opção, a despesa se repete todo mês.
                </p>
              </div>
              <Switch
                id="recurring"
                checked={newExpense.is_recurring}
                onCheckedChange={(checked) => setNewExpense({...newExpense, is_recurring: checked})}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t mt-2">
              {editingExpense && (
                <Button type="button" variant="outline" onClick={() => handleDelete(editingExpense.id)} className="h-12 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                  <Trash2 size={18} />
                </Button>
              )}
              <Button type="submit" className="flex-1 h-12 font-bold text-base bg-red-500 hover:bg-red-600">
                {editingExpense ? 'Salvar Edição' : 'Salvar Gasto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
