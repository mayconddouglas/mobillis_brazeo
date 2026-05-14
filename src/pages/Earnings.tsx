import React, { useState } from 'react';
import { useEarnings, useIncomeCategories, useWallets, useGoals } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, DollarSign, Target } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { parseDateLocal } from '@/utils/date';
import { Progress } from '@/components/ui/progress';
import { TransactionModal } from '@/components/shared/TransactionModal';
import { getCategoryIcon } from '@/utils/icons';
import { formatBRL, formatBRLCompact } from '@/utils/currency';
import { Earning } from '@/types/earning';

export default function Earnings() {
  const { data: earnings, addEarning, addMultipleEarnings, updateEarning, deleteEarning } = useEarnings();
  const { data: categories } = useIncomeCategories();
  const { data: wallets } = useWallets();
  const { data: goals } = useGoals(new Date().getMonth() + 1, new Date().getFullYear());
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEarning, setEditingEarning] = useState<any | null>(null);

  const handleOpenEdit = (earning: any) => {
    setEditingEarning(earning);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingEarning(null);
    setIsModalOpen(true);
  };

  const handleSaveEarning = async (payloads: any[]) => {
    if (editingEarning) {
      await updateEarning(payloads[0]);
    } else {
      if (addMultipleEarnings && payloads.length > 1) {
        await addMultipleEarnings(payloads);
      } else {
        await addEarning(payloads[0]);
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEarning(id);
  };

  const timeFilteredEarnings = earnings?.filter(e => {
    const d = parseDateLocal(e.date);
    if (filter === 'today') return isToday(d);
    if (filter === 'week') return isThisWeek(d);
    if (filter === 'month') return isThisMonth(d);
    return true;
  }) || [];

  const filteredEarnings = timeFilteredEarnings.filter(e => 
    categoryFilter === 'all' ? true : e.category_id === categoryFilter
  );

  const total = filteredEarnings.reduce((acc, curr) => acc + curr.amount, 0);

  // Group by date
  const grouped = filteredEarnings.reduce((acc, earning) => {
    if (!acc[earning.date]) acc[earning.date] = [];
    acc[earning.date].push(earning);
    return acc;
  }, {} as Record<string, Earning[]>);

  // Chart data
  const chartData = Object.entries(grouped)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, items]) => ({
      date: format(parseDateLocal(date), 'dd/MM'),
      total: items.reduce((sum, item) => sum + item.amount, 0)
    }));

  const earningGoal = goals?.earning_goal || 0;
  const goalProgress = earningGoal > 0 ? Math.min((total / earningGoal) * 100, 100) : 0;

  const categoryBreakdown = React.useMemo(() => {
    const totals: Record<string, number> = {};
    timeFilteredEarnings.forEach(e => {
      totals[e.category_id] = (totals[e.category_id] || 0) + e.amount;
    });
    return Object.entries(totals).map(([id, amount]) => ({ id, amount })).sort((a,b) => b.amount - a.amount);
  }, [timeFilteredEarnings]);

  return (
    <div className="p-4 space-y-6 pb-24 relative min-h-screen">
      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-4 mb-6">
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
      </div>

      {/* Total card */}
      <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Total {categoryFilter !== 'all' ? categories?.find(c => c.id === categoryFilter)?.name : 'Recebido'}
        </p>
        <h2 className="text-5xl font-extrabold font-mono text-foreground tracking-tighter">
          {formatBRL(total)}
        </h2>
        
        {filter === 'month' && categoryFilter === 'all' && earningGoal > 0 && (
          <div className="mt-6 space-y-2 text-left bg-muted/30 p-3 rounded-xl border border-muted">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Target size={12} /> Meta do Mês</span>
              <span>{formatBRL(earningGoal)}</span>
            </div>
            <Progress value={goalProgress} className="h-2 bg-gradient-to-r from-green-400 to-emerald-600 border-0" />
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>{formatBRL(total)}</span>
              <span>{goalProgress.toFixed(1)}% alcançado</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {categoryFilter === 'all' && categoryBreakdown.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Desempenho por Categoria</h3>
          <div className="grid grid-cols-2 gap-3">
            {categoryBreakdown.map(b => {
              const category = categories?.find(c => c.id === b.id);
              if (!category) return null;
              const IconComponent = getCategoryIcon(category.icon, 'income');
              return (
                <div key={b.id} className="bg-card border border-border rounded-xl p-3 shadow-sm flex items-center justify-between" onClick={() => setCategoryFilter(b.id)}>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: category.color }}>
                      <IconComponent size={14} />
                    </div>
                    <span className="text-xs font-semibold truncate">{category.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-green-600">
                    {formatBRLCompact(b.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
         <div className="h-40 w-full mt-4 bg-card rounded-2xl border border-border p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="total" fill="#3B82F6" radius={[4,4,0,0]} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [formatBRL(val), 'Total']} 
                />
              </BarChart>
            </ResponsiveContainer>
         </div>
      )}

      {/* List */}
      <div className="space-y-6 mt-6">
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2 px-1">
              <CalendarIcon size={14} />
              {format(parseDateLocal(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="space-y-3">
              {items.map((earning) => {
                const category = categories?.find(c => c.id === earning.category_id);
                const IconComponent = getCategoryIcon(category?.icon, 'income');
                const wallet = wallets?.find(w => w.id === earning.wallet_id);
                
                return (
                  <Card key={earning.id} className="shadow-none border-border hover:border-foreground/20 transition-colors cursor-pointer" onClick={() => handleOpenEdit(earning)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner bg-muted" style={{ color: category?.color }}>
                          <IconComponent size={18} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-foreground leading-tight">
                            {category?.name || 'Deletada'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded">{wallet?.name || 'Conta Removida'}</span>
                            {earning.is_installment && <span>• {earning.installment_current}/{earning.installment_total}</span>}
                            {earning.is_recurring && <span>• Rotineira</span>}
                          </div>
                          {earning.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[150px]">{earning.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-foreground text-sm">
                          +{formatBRL(earning.amount)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {filteredEarnings.length === 0 && (
          <EmptyState 
            icon={DollarSign} 
            title="Nenhuma receita" 
            description="Nenhuma receita registrada neste período." 
          />
        )}
      </div>

      <Button onClick={handleOpenAdd} className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center z-[60] transition-transform active:scale-95">
        <Plus size={24} />
      </Button>

      <TransactionModal
        type="earning"
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingItem={editingEarning}
        onSave={handleSaveEarning}
        onDelete={handleDelete}
        categories={categories || []}
        wallets={wallets || []}
      />
    </div>
  );
}
