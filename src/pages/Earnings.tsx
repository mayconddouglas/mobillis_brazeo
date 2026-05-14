import React, { useState, useMemo } from 'react';
import { useEarnings, useIncomeCategories, useWallets, useGoals } from '../hooks';
import { Earning } from '@/types/earning';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, Bike, Car, Calendar as CalendarIcon, Trash2, Edit2, DollarSign,
  Truck, Package, ShoppingBag, Target, Filter, ChevronRight, Briefcase, Landmark
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

const categoryIconMap: Record<string, any> = {
  car: Car, bike: Bike, truck: Truck, package: Package, 'shopping-bag': ShoppingBag, briefcase: Briefcase, laptop: Package, 'trending-up': Target
};

const parseDateLocal = (dateStr: string) => new Date(dateStr + 'T12:00:00');

export default function Earnings() {
  const { data: earnings, addEarning, addMultipleEarnings, updateEarning, deleteEarning } = useEarnings();
  const { data: categories } = useIncomeCategories();
  const { data: wallets, transferToWallet } = useWallets();
  const { data: goals } = useGoals(new Date().getMonth() + 1, new Date().getFullYear());
  
  // ... rest of the component state and existing handlers

  const handleTransfer = async (earningId: string, walletId: string, amount: number) => {
    try {
      await transferToWallet({ walletId, amount });
      await updateEarning({ id: earningId, description: (earnings?.find(e => e.id === earningId)?.description || '') + ' (Transferido)' });
      // In a real app, I'd have a 'transferred' field, but for now I'll just append to description.
      // Or I should just add 'transferred' field in the type but I cannot modify the schema easily.
      // I will just rely on the wallet balance update.
    } catch (err) {
      console.error(err);
      alert('Erro ao transferir.');
    }
  };
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEarning, setEditingEarning] = useState<Earning | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [transactionType, setTransactionType] = useState<'single' | 'installment' | 'recurring'>('single');
  const [installmentCount, setInstallmentCount] = useState('2');
  const [recurringFrequency, setRecurringFrequency] = useState<'monthly' | 'yearly'>('monthly');

  const [newEarning, setNewEarning] = useState({
    amount: '',
    category_id: '',
    wallet_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const handleOpenEdit = (earning: Earning) => {
    setEditingEarning(earning);
    setFormError(null);
    setNewEarning({
      amount: earning.amount.toString(),
      category_id: earning.category_id,
      wallet_id: earning.wallet_id || (wallets?.[0]?.id || ''),
      date: earning.date,
      description: earning.description || '',
    });
    if (earning.is_installment) {
      setTransactionType('installment');
      setInstallmentCount(earning.installment_total?.toString() || '2');
    } else if (earning.is_recurring) {
      setTransactionType('recurring');
      setRecurringFrequency((earning.recurring_frequency as any) || 'monthly');
    } else {
      setTransactionType('single');
    }
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingEarning(null);
    setFormError(null);
    setTransactionType('single');
    setInstallmentCount('2');
    setRecurringFrequency('monthly');
    setNewEarning({
      amount: '',
      category_id: categoryFilter !== 'all' ? categoryFilter : '',
      wallet_id: wallets?.[0]?.id || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newEarning.amount || !newEarning.date) {
      setFormError('Preencha valor e data.');
      return;
    }
    if (!newEarning.category_id) {
      setFormError('Selecione uma Categoria de Receita.');
      return;
    }
    if (!newEarning.wallet_id) {
      setFormError('Selecione uma Conta onde recebeu o valor.');
      return;
    }

    const newAmount = parseFloat(newEarning.amount.toString().replace(',', '.'));
    if (Number.isNaN(newAmount) || newAmount <= 0) {
      setFormError('Informe um valor válido.');
      return;
    }

    setSaving(true);
    try {
      if (editingEarning) {
        const dataPayload = {
          amount: newAmount,
          category_id: newEarning.category_id,
          wallet_id: newEarning.wallet_id,
          date: newEarning.date,
          description: newEarning.description || null,
          is_recurring: transactionType === 'recurring',
          recurring_frequency: transactionType === 'recurring' ? recurringFrequency : undefined,
          is_installment: transactionType === 'installment',
          installment_total: transactionType === 'installment' ? parseInt(installmentCount, 10) : undefined,
        };
        await updateEarning({ id: editingEarning.id, ...dataPayload });
      } else {
        const basePayload = {
          amount: newAmount,
          category_id: newEarning.category_id,
          wallet_id: newEarning.wallet_id,
          description: newEarning.description || null,
        };

        const payloads: Omit<Earning, 'id' | 'created_at' | 'user_id'>[] = [];
        
        if (transactionType === 'single') {
          payloads.push({
            ...basePayload,
            date: newEarning.date,
            is_recurring: false,
            is_installment: false,
          });
        } else if (transactionType === 'installment') {
          const count = parseInt(installmentCount, 10);
          if (isNaN(count) || count < 2) {
            setFormError('Número de parcelas inválido.');
            setSaving(false);
            return;
          }
          const parcelAmount = basePayload.amount / count;
          const groupId = globalThis.crypto?.randomUUID?.() || Date.now().toString();
          
          let startDate = parseDateLocal(newEarning.date);
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
            startDate.setMonth(startDate.getMonth() + 1);
          }
        } else if (transactionType === 'recurring') {
          const groupId = globalThis.crypto?.randomUUID?.() || Date.now().toString();
          let startDate = parseDateLocal(newEarning.date);
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
        }

        if (addMultipleEarnings) {
          await addMultipleEarnings(payloads);
        } else {
          await addEarning(payloads[0]);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Erro ao salvar a receita. Verifique se você tem permissão.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEarning(id);
    setIsModalOpen(false);
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

  const selectedCategoryMatch = categories?.find(c => c.id === newEarning.category_id);
  const selectedWalletMatch = wallets?.find(w => w.id === newEarning.wallet_id);

  return (
    <div className="p-4 space-y-6 pb-24 relative min-h-screen">
      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4 mb-6">
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
      <div className="bg-card border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Total {categoryFilter !== 'all' ? categories?.find(c => c.id === categoryFilter)?.name : 'Recebido'}
        </p>
        <h2 className="text-5xl font-extrabold font-mono text-foreground tracking-tighter">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </h2>
        
        {filter === 'month' && categoryFilter === 'all' && earningGoal > 0 && (
          <div className="mt-6 space-y-2 text-left bg-muted/30 p-3 rounded-xl border border-muted">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Target size={12} /> Meta do Mês</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningGoal)}</span>
            </div>
            <Progress value={goalProgress} className="h-2 bg-gradient-to-r from-green-400 to-emerald-600 border-0" />
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
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
              const IconComponent = categoryIconMap[category.icon || 'car'] || DollarSign;
              return (
                <div key={b.id} className="bg-card border rounded-xl p-3 shadow-sm flex items-center justify-between" onClick={() => setCategoryFilter(b.id)}>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: category.color }}>
                      <IconComponent size={14} />
                    </div>
                    <span className="text-xs font-semibold truncate">{category.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(b.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
         <div className="h-40 w-full mt-4 bg-card rounded-2xl border p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="total" fill="#3B82F6" radius={[4,4,0,0]} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val), 'Total']} 
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
                const IconComponent = categoryIconMap[category?.icon || 'car'] || DollarSign;
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
                          +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earning.amount)}
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

      <Button onClick={handleOpenAdd} className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center z-40 transition-transform active:scale-95">
        <Plus size={24} />
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEarning ? 'Editar Receita' : 'Adicionar Receita'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEarning} className="space-y-5 mt-4">
            {formError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Recebido (R$)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01"
                placeholder="0,00" 
                required
                value={newEarning.amount}
                onChange={(e) => setNewEarning({...newEarning, amount: e.target.value})}
                className="h-14 text-2xl font-black font-mono text-green-600 px-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">Conta / Cartão</Label>
              <Select 
                value={newEarning.wallet_id} 
                onValueChange={(val) => setNewEarning({...newEarning, wallet_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a conta">
                    {selectedWalletMatch ? selectedWalletMatch.name : (newEarning.wallet_id ? 'Conta removida' : 'Selecione a conta')}
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
              <Label htmlFor="category">Categoria de Receita</Label>
              <Select 
                value={newEarning.category_id} 
                onValueChange={(val) => setNewEarning({...newEarning, category_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a categoria">
                    {selectedCategoryMatch ? selectedCategoryMatch.name : (newEarning.category_id ? 'Categoria removida' : 'Selecione a categoria')}
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
              <Label htmlFor="date">Data do Recebimento</Label>
              <Input 
                id="date" 
                type="date" 
                required
                value={newEarning.date}
                onChange={(e) => setNewEarning({...newEarning, date: e.target.value})}
                className="h-12"
              />
            </div>

            <div className="space-y-2 border-t pt-4 mt-2">
              <Label htmlFor="description">Descrição</Label>
              <Input 
                id="description" 
                type="text" 
                placeholder="Ex: Pagamento extra, freelancer do projeto..."
                value={newEarning.description}
                onChange={(e) => setNewEarning({...newEarning, description: e.target.value})}
                className="h-12"
              />
            </div>

            
            <div className="pt-2 border-t mt-2">
              <Label className="mb-2 block">Tipo de Receita</Label>
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

            <div className="flex gap-2 pt-4 border-t">
              {editingEarning && (
                <>
                  <Button disabled={saving} type="button" variant="outline" onClick={() => handleDelete(editingEarning.id)} className="h-12 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                    <Trash2 size={18} />
                  </Button>
                  <Button disabled={saving} type="button" variant="outline" onClick={() => handleTransfer(editingEarning.id, editingEarning.wallet_id, editingEarning.amount)} className="h-12 px-4">
                    Transferir
                  </Button>
                </>
              )}
              <Button disabled={saving} type="submit" className="flex-1 h-12 font-bold text-base">
                {saving ? 'Salvando...' : (editingEarning ? 'Salvar Edição' : 'Salvar Receita')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
