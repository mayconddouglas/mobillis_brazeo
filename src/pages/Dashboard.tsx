import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useEarnings, useExpenses, useWallets, useGoals, useIncomeCategories, useProfile } from '../hooks';
import { format, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Receipt, TrendingUp, Package, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { InsightsSection } from '../components/insights/InsightsSection';
import { formatBRL } from '@/utils/currency';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: earnings } = useEarnings();
  const { data: expenses } = useExpenses();
  const { data: wallets } = useWallets();
  const { data: goals } = useGoals(new Date().getMonth() + 1, new Date().getFullYear());
  const { data: categories } = useIncomeCategories();

  const totalEarnings = earnings?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalExpenses = expenses?.filter(e => isThisMonth(new Date(e.date + 'T12:00:00'))).reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalBalance = wallets?.reduce((acc, curr) => acc + curr.balance, 0) || 0;

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
    <div className="p-4 space-y-8 pb-24">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, {user?.user_metadata?.name?.split(' ')[0] || 'pessoa'}.</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
           <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`} className="w-10 h-10 object-cover" />
        </div>
      </motion.header>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-card border shadow-sm p-6 space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
            <div className="text-4xl font-extrabold font-mono text-foreground tracking-tighter">
              {formatBRL(totalBalance)}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Meta: {formatBRL(totalEarnings)} / {formatBRL(earningGoal)}</span>
                <span>{Math.round(earningProgress)}%</span>
              </div>
              <Progress value={earningProgress} className="h-2" />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Limite: {formatBRL(totalExpenses)} / {formatBRL(expenseLimit)}</span>
                <span>{Math.round(expenseProgress)}%</span>
              </div>
              <Progress value={expenseProgress} className="h-2" indicatorClassName={expenseProgress > 80 ? "bg-red-500" : "bg-primary"} />
            </div>
          </div>
        </Card>
      </motion.div>

       {/* Grid Metrics */}
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.2 }}
         className="grid grid-cols-2 gap-4"
       >
         <Card className="shadow-none border-border">
           <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
               <TrendingUp size={20} />
             </div>
             <div>
               <p className="text-xs font-medium text-muted-foreground">Receitas</p>
               <p className="font-bold font-mono text-emerald-600">{formatBRL(totalEarnings)}</p>
             </div>
           </CardContent>
         </Card>
         
         <Card className="shadow-none border-border">
           <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
               <Receipt size={20} />
             </div>
             <div>
               <p className="text-xs font-medium text-muted-foreground">Despesas</p>
               <p className="font-bold font-mono text-red-600">{formatBRL(totalExpenses)}</p>
             </div>
           </CardContent>
         </Card>
       </motion.div>

       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.3 }}
       >
         <h3 className="font-bold tracking-tight mb-4">Carteiras</h3>
         <div className="grid grid-cols-2 gap-4">
           {wallets?.map((wallet) => (
             <Card key={wallet.id} className="shadow-none border-border">
               <CardContent className="p-4 flex items-center gap-3">
                 <div className="p-2 rounded-xl" style={{ backgroundColor: `${wallet.color}15`, color: wallet.color }}>
                   <Wallet size={18} />
                 </div>
                 <div className="truncate">
                   <p className="text-xs font-medium text-muted-foreground truncate">{wallet.name}</p>
                   <p className="font-bold font-mono text-sm">{formatBRL(wallet.balance)}</p>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
       </motion.div>

      {/* Chart: Income Categories */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h3 className="font-bold tracking-tight mb-4">Receitas por Categoria</h3>
        <Card className="shadow-none border-border">
          <CardContent className="p-6">
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
                  <Tooltip formatter={(value: number) => formatBRL(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.5 }}
      >
        <InsightsSection />
      </motion.div>
    </div>
  );
}
