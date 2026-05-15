import React, { useState } from 'react';
import { useExpenses, useExpenseCategories, useWallets } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, Calendar as CalendarIcon, Tag, CreditCard, Edit2, Trash2, ChevronRight, Filter } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateLocal } from '@/utils/date';
import { motion } from 'motion/react';
import { TransactionModal } from '@/components/shared/TransactionModal';
import { formatBRL } from '@/utils/currency';
import { Expense } from '@/types/expense';

export default function Expenses() {
  const { data: expenses, addExpense, addMultipleExpenses, updateExpense, deleteExpense } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const { data: wallets, updateWallet } = useWallets();
  
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  const handleOpenEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (payloads: any[]) => {
    console.log('handleSaveExpense called with:', JSON.stringify(payloads, null, 2));
    
    // Sanitize payloads to remove fields not in the database table
    const safePayloads = payloads.map(p => {
      const { balance, is_installment, installment_current, installment_total, group_id, ...rest } = p;
      return rest;
    });

    console.log('safePayloads to send:', JSON.stringify(safePayloads, null, 2));

    if (editingExpense) {
      await updateExpense(safePayloads[0]);
      console.log('updateExpense finished');
    } else {
      if (addMultipleExpenses && safePayloads.length > 1) {
        await addMultipleExpenses(safePayloads);
        console.log('addMultipleExpenses finished');
      } else {
        await addExpense(safePayloads[0]);
        console.log('addExpense finished');
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
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

  return (
    <div className="p-4 pt-8 space-y-8 pb-24 relative min-h-screen">
      {/* Header filter */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-card p-5 rounded-2xl border shadow-sm space-y-4 mb-6"
      >
        {/* Date Filter */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          {(['today', 'week', 'month'] as const).map((t) => (
            <Button
              key={t}
              variant={filter === t ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 font-medium"
              onClick={() => setFilter(t)}
            >
              {t === 'today' ? 'Hoje' : t === 'week' ? 'Esta semana' : 'Este mês'}
            </Button>
          ))}
        </div>
        
        {/* Category scrollable filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
          <Button 
            variant={categoryFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full shrink-0 px-4"
            onClick={() => setCategoryFilter('all')}
          >
            Todas
          </Button>
          {categories?.map(c => (
            <Button 
              key={c.id}
              variant={categoryFilter === c.id ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-full shrink-0 gap-2 px-4 shadow-none"
              onClick={() => setCategoryFilter(c.id)}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Total card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-card border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden"
      >
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Total {categoryFilter !== 'all' ? categories?.find(c => c.id === categoryFilter)?.name : 'Despesas'}
        </p>
        <h2 className="text-5xl font-extrabold font-mono text-foreground tracking-tighter">
          {formatBRL(total)}
        </h2>
      </motion.div>

      {/* List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="space-y-6 mt-6"
      >
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
                  <Card key={expense.id} className="shadow-none border-border hover:border-foreground/20 transition-colors cursor-pointer" onClick={() => handleOpenEdit(expense)}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner bg-muted" style={{ color: category?.color }}>
                          <Tag size={18} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-foreground leading-tight">
                            {expense.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded">{category?.name || 'Desconhecida'}</span>
                            <span>•</span>
                            <span>{wallet?.name || 'Desconhecida'}</span>
                            {expense.is_installment && <span>• {expense.installment_current}/{expense.installment_total}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-foreground text-sm">
                          -{formatBRL(expense.amount)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>

      {filteredExpenses.length === 0 && (
          <EmptyState 
            icon={Receipt} 
            title="Nenhuma despesa" 
            description="Nenhuma despesa registrada neste período." 
          />
        )}

      <Button onClick={handleOpenAdd} className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center z-[60] transition-transform active:scale-95">
        <Plus size={24} />
      </Button>

      <TransactionModal
        type="expense"
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingItem={editingExpense}
        onSave={handleSaveExpense}
        onDelete={handleDelete}
        categories={categories || []}
        wallets={wallets || []}
      />
    </div>
  );
}
