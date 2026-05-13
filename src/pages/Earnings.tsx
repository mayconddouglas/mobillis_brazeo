import React, { useState, useMemo } from 'react';
import { useEarnings, usePlatforms, useGoals, Earning } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, Bike, Car, Calendar as CalendarIcon, Trash2, Edit2, DollarSign,
  Truck, Package, ShoppingBag, Target, Filter, ChevronRight
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
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
import { Progress } from '@/components/ui/progress';

const platformIconMap: Record<string, any> = {
  car: Car, bike: Bike, truck: Truck, package: Package, 'shopping-bag': ShoppingBag
};

// Helper to prevent timezone shifting when parsing dates from YYYY-MM-DD
import { Switch } from '@/components/ui/switch';

const parseDateLocal = (dateStr: string) => new Date(dateStr + 'T12:00:00');

export default function Earnings() {
  const { data: earnings, addEarning, updateEarning, deleteEarning } = useEarnings();
  const { data: platforms } = usePlatforms();
  const { data: goals } = useGoals(new Date().getMonth() + 1, new Date().getFullYear());
  
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEarning, setEditingEarning] = useState<Earning | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [newEarning, setNewEarning] = useState({
    amount: '',
    platform_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
    expense_target: '',
    cycle_start: '',
    cycle_end: '',
    is_recurring: false
  });

  const handleOpenEdit = (earning: Earning) => {
    setEditingEarning(earning);
    setFormError(null);
    setNewEarning({
      amount: earning.amount.toString(),
      platform_id: earning.platform_id,
      date: earning.date,
      note: earning.note || '',
      expense_target: earning.expense_target ? earning.expense_target.toString() : '',
      cycle_start: earning.cycle_start || '',
      cycle_end: earning.cycle_end || '',
      is_recurring: earning.is_recurring || false
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingEarning(null);
    setFormError(null);
    setNewEarning({
      amount: '',
      platform_id: platformFilter !== 'all' ? platformFilter : '',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      expense_target: '',
      cycle_start: '',
      cycle_end: '',
      is_recurring: false
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
    if (!newEarning.platform_id) {
      setFormError('Selecione uma fonte de renda.');
      return;
    }

    const newAmount = parseFloat(newEarning.amount.toString().replace(',', '.'));
    if (Number.isNaN(newAmount) || newAmount <= 0) {
      setFormError('Informe um valor válido.');
      return;
    }

    const dataPayload = {
      amount: newAmount,
      platform_id: newEarning.platform_id,
      date: newEarning.date,
      note: newEarning.note || null,
      expense_target: newEarning.expense_target ? parseFloat(newEarning.expense_target.toString().replace(',', '.')) : undefined,
      cycle_start: newEarning.cycle_start || undefined,
      cycle_end: newEarning.cycle_end || undefined,
      is_recurring: newEarning.is_recurring,
    };

    setSaving(true);
    try {
      if (editingEarning) {
        await updateEarning({ id: editingEarning.id, ...dataPayload });
      } else {
        await addEarning(dataPayload);
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
    if (confirm('Tem certeza que deseja deletar esta receita?')) {
      await deleteEarning(id);
      setIsModalOpen(false);
    }
  };

  const timeFilteredEarnings = earnings?.filter(e => {
    const d = parseDateLocal(e.date);
    if (filter === 'today') return isToday(d);
    if (filter === 'week') return isThisWeek(d);
    if (filter === 'month') return isThisMonth(d);
    return true;
  }) || [];

  const filteredEarnings = timeFilteredEarnings.filter(e => 
    platformFilter === 'all' ? true : e.platform_id === platformFilter
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

  // Platform performance breakdown
  const platformBreakdown = React.useMemo(() => {
    const totals: Record<string, number> = {};
    timeFilteredEarnings.forEach(e => {
      totals[e.platform_id] = (totals[e.platform_id] || 0) + e.amount;
    });
    return Object.entries(totals).map(([id, amount]) => ({ id, amount })).sort((a,b) => b.amount - a.amount);
  }, [timeFilteredEarnings]);

  const selectedPlatformMatch = platforms?.find(p => p.id === newEarning.platform_id);

  return (
    <div className="p-4 space-y-6 pb-24 relative min-h-screen">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button variant={filter === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('today')}>Hoje</Button>
          <Button variant={filter === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('week')}>Esta semana</Button>
          <Button variant={filter === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('month')}>Este mês</Button>
        </div>
        
        {/* Platform scrollable filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
          <Filter size={16} className="text-muted-foreground shrink-0 mr-1" />
          <Button 
            variant={platformFilter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="rounded-full shrink-0"
            onClick={() => setPlatformFilter('all')}
          >
            Todas
          </Button>
          {platforms?.map(p => (
            <Button 
              key={p.id}
              variant={platformFilter === p.id ? 'secondary' : 'ghost'} 
              size="sm" 
              className={`rounded-full shrink-0 gap-2 ${platformFilter === p.id ? 'font-bold' : ''}`}
              onClick={() => setPlatformFilter(p.id)}
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                {(() => {
                  const Icon = platformIconMap[p.icon] || DollarSign;
                  return <Icon size={10} />;
                })()}
              </div>
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Total card */}
      <div className="bg-card border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Total {platformFilter !== 'all' ? platforms?.find(p => p.id === platformFilter)?.name : 'Recebido'}
        </p>
        <h2 className="text-4xl font-black font-mono text-green-500 tracking-tighter">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </h2>
        
        {filter === 'month' && platformFilter === 'all' && earningGoal > 0 && (
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

      {/* Platform Breakdown */}
      {platformFilter === 'all' && platformBreakdown.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Desempenho por Fonte</h3>
          <div className="grid grid-cols-2 gap-3">
            {platformBreakdown.map(b => {
              const platform = platforms?.find(p => p.id === b.id);
              if (!platform) return null;
              const IconComponent = platformIconMap[platform.icon || 'car'] || DollarSign;
              return (
                <div key={b.id} className="bg-card border rounded-xl p-3 shadow-sm flex items-center justify-between" onClick={() => setPlatformFilter(b.id)}>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: platform.color }}>
                      <IconComponent size={14} />
                    </div>
                    <span className="text-xs font-semibold truncate">{platform.name}</span>
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
                const platform = platforms?.find(p => p.id === earning.platform_id);
                const IconComponent = platformIconMap[platform?.icon || 'car'] || DollarSign;
                
                return (
                  <Card key={earning.id} className="shadow-sm cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all border group" onClick={() => handleOpenEdit(earning)}>
                    <CardContent className="p-3 pr-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm" style={{ backgroundColor: platform?.color || '#94a3b8' }}>
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{platform?.name || 'Deletada'}</p>
                          {(earning.cycle_start && earning.cycle_end) ? (
                            <p className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded inline-block mt-0.5 font-medium border border-primary/20">
                              Ref: {format(parseDateLocal(earning.cycle_start), 'dd/MM')} a {format(parseDateLocal(earning.cycle_end), 'dd/MM')}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground line-clamp-1">{earning.note || 'Receita'}</p>
                          )}
                          {(earning.cycle_start && earning.cycle_end && earning.note) && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">{earning.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-mono font-black text-green-600 text-sm">
                            +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earning.amount)}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {filteredEarnings.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
            <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Nenhuma receita registrada neste período.</p>
          </div>
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
              <Label htmlFor="platform">Fonte de Renda</Label>
              <Select 
                value={newEarning.platform_id} 
                onValueChange={(val) => setNewEarning({...newEarning, platform_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a fonte de renda">
                    {selectedPlatformMatch ? selectedPlatformMatch.name : (newEarning.platform_id ? 'Fonte removida' : 'Selecione a fonte')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {platforms?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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

            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
              <div className="col-span-2">
                <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Período Referente (Fechamento Semanal etc)</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle_start" className="text-xs">De (Opcional)</Label>
                <Input 
                  id="cycle_start" 
                  type="date" 
                  value={newEarning.cycle_start}
                  onChange={(e) => setNewEarning({...newEarning, cycle_start: e.target.value})}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle_end" className="text-xs">Até (Opcional)</Label>
                <Input 
                  id="cycle_end" 
                  type="date" 
                  value={newEarning.cycle_end}
                  onChange={(e) => setNewEarning({...newEarning, cycle_end: e.target.value})}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4 mt-2">
              <Label htmlFor="note">Observação (Opcional)</Label>
              <Input 
                id="note" 
                type="text" 
                placeholder="Ex: Gorjeta, bônus dinâmico"
                value={newEarning.note}
                onChange={(e) => setNewEarning({...newEarning, note: e.target.value})}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_target">Meta de Gasto (Opcional)</Label>
              <Input 
                id="expense_target" 
                type="number" 
                step="0.01"
                placeholder="0,00"
                value={newEarning.expense_target}
                onChange={(e) => setNewEarning({...newEarning, expense_target: e.target.value})}
                className="h-12"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">Valor destinado para gastos do dia (ex: almoço, combustível)</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="recurring" className="text-base">Receita Fixa / Recorrente</Label>
                <p className="text-sm text-muted-foreground">
                  Marcando esta opção, esta receita se repetirá todo mês.
                </p>
              </div>
              <Switch
                id="recurring"
                checked={newEarning.is_recurring}
                onCheckedChange={(checked) => setNewEarning({...newEarning, is_recurring: checked})}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              {editingEarning && (
                <Button disabled={saving} type="button" variant="outline" onClick={() => handleDelete(editingEarning.id)} className="h-12 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                  <Trash2 size={18} />
                </Button>
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
