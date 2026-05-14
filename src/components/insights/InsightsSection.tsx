import React, { useMemo } from 'react';
import { useEarnings, useExpenses, useExpenseCategories } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { isThisMonth, parseISO } from 'date-fns';
import { PieChart as PieChartIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export function InsightsSection() {
  const { data: earnings } = useEarnings();
  const { data: expenses } = useExpenses();
  const { data: categories } = useExpenseCategories();

  const data = useMemo(() => {
    const thisMonthsEarnings = earnings?.filter(e => isThisMonth(parseISO(e.date))) || [];
    const thisMonthsExpenses = expenses?.filter(e => isThisMonth(parseISO(e.date))) || [];

    const totalIncome = thisMonthsEarnings.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = thisMonthsExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const expensesByCategory = thisMonthsExpenses.reduce((acc, expense) => {
      const category = categories?.find(c => c.id === expense.category_id);
      const categoryName = category?.name || 'Sem categoria';
      acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      pieData
    };
  }, [earnings, expenses, categories]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  const hasData = data.totalIncome > 0 || data.totalExpenses > 0;
  const hasExpenses = data.pieData.length > 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight">Insights</h2>
      
      {!hasData ? (
        <EmptyState 
          icon={PieChartIcon} 
          title="Sem dados para este mês" 
          description="Comece a registrar suas receitas e despesas para ver aqui suas análises."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Receitas</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-green-500">R$ {data.totalIncome.toFixed(2)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Despesas</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-red-500">R$ {data.totalExpenses.toFixed(2)}</p></CardContent>
            </Card>
          </div>

          {hasExpenses && (
            <Card>
              <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                      {data.pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
