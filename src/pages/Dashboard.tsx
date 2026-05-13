import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEarnings, useExpenses, useWallets, useGoals, useIncomeCategories } from '../hooks';
import { format, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Receipt, TrendingUp, Package } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: earnings } = useEarnings();
  const { data: expenses } = useExpenses();
  const { data: goals } = useGoals(new Date().getMonth() + 1, new Date().getFullYear());
  const { data: categories } = useIncomeCategories();

  const totalEarnings = earnings?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalExpenses = expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const saldoLiquido = totalEarnings - totalExpenses;

  const earningGoal = goals?.earning_goal || 3000;
  const expenseLimit = goals?.expense_limit || 1500;

  const earningProgress = Math.min((totalEarnings / earningGoal) * 100, 100);
  const expenseProgress = Math.min((totalExpenses / expenseLimit) * 100, 100);

  // Mocks for charts
  const pieData = categories?.map(p => ({
    name: p.name,
    value: earnings?.filter(e => e.category_id === p.id).reduce((acc, curr) => acc + curr.amount, 0) || 0,
    color: p.color
  })).filter(d => d.value > 0) || [];

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Olá, {user?.user_metadata?.name?.split(' ')[0] || 'pessoa'}.</h1>
          <p className="text-sm text-muted-foreground capitalize">{format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
           {/* Add Theme toggle here later */}
           <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`} className="w-8 h-8 rounded-full" />
        </div>
      </header>

      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground border-none shadow-lg">
        <CardContent className="p-6">
          <p className="text-primary-foreground/80 text-sm font-medium">Saldo Líquido</p>
          <div className="text-3xl font-bold font-mono tracking-tighter mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoLiquido)}
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-primary-foreground/90 font-medium">
                <span>Meta de Receitas</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEarnings)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningGoal)}</span>
              </div>
              <Progress value={earningProgress} className="h-2 bg-primary-foreground/20" indicatorClassName="bg-white" />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-primary-foreground/90 font-medium">
                <span>Limite de Despesas</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseLimit)}</span>
              </div>
              <Progress value={expenseProgress} className="h-2 bg-primary-foreground/20" indicatorClassName={expenseProgress > 80 ? "bg-red-400" : "bg-white"} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Receitas</p>
              <p className="font-bold text-sm font-mono text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEarnings)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-600 rounded-lg">
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Despesas</p>
              <p className="font-bold text-sm font-mono text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Lançamentos</p>
              <p className="font-bold text-sm font-mono">{ earnings?.length || 0 }</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Categorias de Renda</p>
              <p className="font-bold text-sm">{categories?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Income Categories */}
      <h3 className="font-semibold text-sm tracking-tight mt-6">Receitas por Categoria</h3>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length ? pieData : [{name: 'Sem dados', value: 1, color: '#e2e8f0'}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                {d.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
