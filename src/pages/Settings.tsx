import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useIncomeCategories, useExpenseCategories, useGoals, useProfile, useWallets } from '../hooks';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LogOut, User, Moon, Sun, Bell, Shield, ChevronRight, Check,
  Target, Briefcase, Tags, Plus, Trash2, Power, Landmark,
  Car, Bike, Truck, Package, ShoppingBag,
  Tag, Fuel, Coffee, HomeIcon, Smartphone, Wrench, ShoppingCart
} from 'lucide-react';

const incomeCategoryIconMap: Record<string, any> = {
  car: Car, bike: Bike, truck: Truck, package: Package, 'shopping-bag': ShoppingBag, briefcase: Briefcase, laptop: Package, 'trending-up': Target
};

const categoryIconMap: Record<string, any> = {
  tag: Tag, fuel: Fuel, coffee: Coffee, home: HomeIcon, smartphone: Smartphone, wrench: Wrench, 'shopping-cart': ShoppingCart
};
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Settings() {
  const { user, signOut, isDemo } = useAuth();
  const { data: profile } = useProfile();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="p-4 space-y-6 pb-24">
      <h1 className="text-xl font-bold tracking-tight mb-6">Configurações</h1>

      <Card className="shadow-sm border-none bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`} className="w-14 h-14 rounded-full" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{profile?.name || user?.user_metadata?.name || 'Usuário'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="text-muted-foreground" />
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Preferências</h3>
        <div className="bg-card rounded-2xl border shadow-sm divide-y">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsDark(!isDark)}>
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">{isDark ? <Moon size={18} /> : <Sun size={18} />}</div>
              <span className="font-medium text-sm">Modo Escuro / Tema</span>
            </div>
            <div className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">{isDark ? 'ATIVADO' : 'DESATIVADO'}</div>
          </div>
          <NotificationsSheet />
          <PrivacySheet />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Conta & Configurações</h3>
        <div className="bg-card rounded-2xl border shadow-sm divide-y">
          <UserProfileSheet />
          <WalletsSheet />
          <IncomeCategoriesSheet />
          <ExpenseCategoriesSheet />
          <MonthlyGoalsSheet month={month} year={year} />
        </div>
      </div>

      <Button variant="destructive" className="w-full h-12 rounded-xl mt-8" onClick={signOut}>
        <LogOut className="mr-2" size={18} /> Sair da Conta
      </Button>
    </div>
  );
}

function ActionRow({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <ChevronRight size={18} className="text-muted-foreground/50" />
    </div>
  )
}

function NotificationsSheet() {
  const [pushMsg, setPushMsg] = useState(() => localStorage.getItem('pref_msg') !== 'false');

  return (
    <Sheet>
      <SheetTrigger render={<button type="button" className="w-full text-left" />}>
        <ActionRow icon={<Bell size={18} />} label="Notificações" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-3xl p-6">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Notificações</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-xl" onClick={() => {
            const v = !pushMsg;
            setPushMsg(v);
            localStorage.setItem('pref_msg', String(v));
          }}>
            <span>Lembretes e Alertas</span>
            <div className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">{pushMsg ? 'ATIVADO' : 'DESATIVADO'}</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PrivacySheet() {
  return (
    <Sheet>
      <SheetTrigger render={<button type="button" className="w-full text-left" />}>
        <ActionRow icon={<Shield size={18} />} label="Privacidade" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-3xl p-6">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Privacidade e Segurança</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">O Brazeo Finanças trata os seus dados com a máxima segurança (Row Level Security no Supabase). Seus dados financeiros não são compartilhados com nenhuma entidade externa.</p>
          <Button variant="outline" className="w-full h-12 font-bold mt-4">Li e concordo</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function UserProfileSheet() {
  const { user } = useAuth();
  const { data: profile, updateProfile } = useProfile();
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile, open]);

  const handleSave = async () => {
    await updateProfile(name);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button type="button" className="w-full text-left" />}>
        <ActionRow icon={<User size={18} />} label="Meus Dados" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-3xl p-6">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Meus Dados</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12" placeholder="Seu nome" />
            <p className="text-xs text-muted-foreground mt-1">Este nome será exibido na saudação principal.</p>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} readOnly className="h-12 bg-muted opacity-80" />
            <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado por aqui.</p>
          </div>
          <Button onClick={handleSave} className="w-full h-12 font-bold mt-4">Salvar Alterações</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function WalletsSheet() {
  const { data: wallets, addWallet, updateWallet, deleteWallet } = useWallets();
  const [open, setOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: '', color: '#3B82F6', icon: 'landmark', type: 'checking' });

  const handleAdd = async () => {
    if (!newWallet.name) return;
    await addWallet({ ...newWallet, balance: 0 });
    setNewWallet({ name: '', color: '#3B82F6', icon: 'landmark', type: 'checking' });
    setIsAddOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button type="button" className="w-full text-left" />}>
        <ActionRow icon={<Landmark size={18} />} label="Contas & Cartões" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] rounded-t-3xl p-6 flex flex-col">
        <SheetHeader className="mb-6 text-left shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Contas & Cartões</SheetTitle>
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="rounded-full gap-1">
              <Plus size={16} /> Nova
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3 pb-8 pr-2">
          {wallets?.map(w => {
            return (
              <Card key={w.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: w.color }}>
                      <Landmark size={20} />
                    </div>
                    <div>
                      <p className="font-semibold">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.type === 'checking' ? 'Conta Corrente' : w.type === 'savings' ? 'Poupança' : 'Cartão de Crédito'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteWallet(w.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
          {wallets?.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma conta cadastrada.</p>}
        </div>
      </SheetContent>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Nova Conta/Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome (Apelido)</Label>
              <Input value={newWallet.name} onChange={e => setNewWallet({...newWallet, name: e.target.value})} placeholder="Ex: Nubank, Itaú..." />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select 
                className="w-full h-12 px-3 border border-input bg-background rounded-md"
                value={newWallet.type}
                onChange={e => setNewWallet({...newWallet, type: e.target.value})}
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Poupança</option>
                <option value="credit">Cartão de Crédito</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'].map(color => (
                  <button
                    key={color}
                    onClick={() => setNewWallet({...newWallet, color})}
                    className={`w-8 h-8 rounded-full border-2 ${newWallet.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} className="w-full h-12 mt-2">Salvar Conta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}

function MonthlyGoalsSheet({ month, year }: { month: number; year: number }) {
  const { data: goals, upsertGoal } = useGoals(month, year);
  const [earningGoal, setEarningGoal] = useState('');
  const [expenseLimit, setExpenseLimit] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (goals) {
      setEarningGoal(goals.earning_goal.toString());
      setExpenseLimit(goals.expense_limit.toString());
    } else {
      setEarningGoal('');
      setExpenseLimit('');
    }
  }, [goals, open]);

  const handleSave = async () => {
    await upsertGoal({
      month,
      year,
      earning_goal: Number(earningGoal),
      expense_limit: Number(expenseLimit)
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button type="button" className="w-full text-left" />}>
        <ActionRow icon={<Target size={18} />} label="Metas Mensais" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-3xl p-6">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Metas deste Mês</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meta de Receitas (R$)</Label>
            <Input type="number" value={earningGoal} onChange={e => setEarningGoal(e.target.value)} className="h-12" placeholder="Ex: 5000" />
          </div>
          <div className="space-y-2">
            <Label>Limite de Despesas (R$)</Label>
            <Input type="number" value={expenseLimit} onChange={e => setExpenseLimit(e.target.value)} className="h-12" placeholder="Ex: 1500" />
          </div>
          <Button onClick={handleSave} className="w-full h-12 font-bold mt-4">Salvar Metas</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function IncomeCategoriesSheet() {
  const { data: categories, addIncomeCategory, updateIncomeCategory, deleteIncomeCategory } = useIncomeCategories();
  const [open, setOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6', icon: 'briefcase' });

  const handleAdd = async () => {
    if (!newCategory.name) return;
    await addIncomeCategory({ ...newCategory, is_active: true });
    setNewCategory({ name: '', color: '#3B82F6', icon: 'briefcase' });
    setIsAddOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button type="button" className="w-full text-left" />}>
        <ActionRow icon={<Briefcase size={18} />} label="Categorias de Receitas" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] rounded-t-3xl p-6 flex flex-col">
        <SheetHeader className="mb-6 text-left shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Categorias de Receitas</SheetTitle>
            <Button
              size="icon"
              variant="outline"
              className="w-8 h-8 rounded-full"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={16} />
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6">
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="h-12" placeholder="Ex: Salário, Freelance, Aluguel" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor de Identificação</Label>
                    <div className="flex gap-4 items-center">
                      <Input type="color" value={newCategory.color} onChange={e => setNewCategory({...newCategory, color: e.target.value})} className="h-12 w-20 p-1" />
                      <div className="flex-1 text-sm text-muted-foreground">{newCategory.color}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(incomeCategoryIconMap).map((iconKey) => {
                        const IconComponent = incomeCategoryIconMap[iconKey];
                        return (
                          <div 
                            key={iconKey} 
                            onClick={() => setNewCategory({...newCategory, icon: iconKey})}
                            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all ${newCategory.icon === iconKey ? 'border-primary bg-primary/10' : 'border-transparent bg-muted'}`}
                          >
                            <IconComponent size={18} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full h-12 font-bold mt-2">
                    Salvar Categoria
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pb-8">
          {categories?.map(p => {
            const IconComponent = incomeCategoryIconMap[p.icon] || Briefcase;
            return (
            <div key={p.id} className="flex items-center justify-between p-3 border rounded-xl shadow-sm bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                  <IconComponent size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={p.is_active ? 'default' : 'secondary'} size="icon" className="w-8 h-8 rounded-full" onClick={() => updateIncomeCategory({ id: p.id, is_active: !p.is_active })}>
                  <Power size={14} className={p.is_active ? 'text-white' : 'text-muted-foreground'} />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteIncomeCategory(p.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )})}
          {categories?.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma categoria cadastrada.</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ExpenseCategoriesSheet() {
  const { data: categories, addCategory, deleteCategory } = useExpenseCategories();
  const [open, setOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color: '#EF4444', icon: 'tag' });

  const handleAdd = async () => {
    if (!newCat.name) return;
    await addCategory(newCat);
    setNewCat({ name: '', color: '#EF4444', icon: 'tag' });
    setIsAddOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button type="button" className="w-full text-left" />}>
        <ActionRow icon={<Tags size={18} />} label="Categorias de Despesas" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] rounded-t-3xl p-6 flex flex-col">
        <SheetHeader className="mb-6 text-left shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Categorias</SheetTitle>
            <Button
              size="icon"
              variant="outline"
              className="w-8 h-8 rounded-full"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={16} />
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6">
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} className="h-12" placeholder="Ex: Multas, Estacionamento" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex gap-4 items-center">
                      <Input type="color" value={newCat.color} onChange={e => setNewCat({...newCat, color: e.target.value})} className="h-12 w-20 p-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(categoryIconMap).map((iconKey) => {
                        const IconComponent = categoryIconMap[iconKey];
                        return (
                          <div 
                            key={iconKey} 
                            onClick={() => setNewCat({...newCat, icon: iconKey})}
                            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all ${newCat.icon === iconKey ? 'border-primary bg-primary/10' : 'border-transparent bg-muted'}`}
                          >
                            <IconComponent size={18} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full h-12 font-bold mt-2">Salvar Categoria</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pb-8">
          {categories?.map(c => {
            const IconComponent = categoryIconMap[c.icon] || Tags;
            return (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl shadow-sm bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: c.color }}>
                  <IconComponent size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteCategory(c.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          )})}
          {categories?.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma categoria cadastrada.</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
