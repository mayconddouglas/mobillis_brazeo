import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlatforms, useExpenseCategories, useGoals, useProfile } from '../hooks';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LogOut, User, Moon, Sun, Bell, Shield, ChevronRight, Check,
  Target, Briefcase, Tags, Plus, Trash2, Power,
  Car, Bike, Truck, Package, ShoppingBag,
  Tag, Fuel, Coffee, HomeIcon, Smartphone, Wrench, ShoppingCart
} from 'lucide-react';

const platformIconMap: Record<string, any> = {
  car: Car, bike: Bike, truck: Truck, package: Package, 'shopping-bag': ShoppingBag
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
            <h2 className="font-bold text-lg">{profile?.name || user?.user_metadata?.name || 'Motorista'}</h2>
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
          <PlatformsSheet />
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
      <SheetTrigger asChild>
        <div>
          <ActionRow icon={<Bell size={18} />} label="Notificações" />
        </div>
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
      <SheetTrigger asChild>
        <div>
          <ActionRow icon={<Shield size={18} />} label="Privacidade" />
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-3xl p-6">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Privacidade e Segurança</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">O RouteFinance trata os seus dados com a máxima segurança (Row Level Security no Supabase). Seus dados financeiros não são compartilhados com nenhuma entidade externa.</p>
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
      <SheetTrigger asChild>
        <div>
          <ActionRow icon={<User size={18} />} label="Meus Dados" />
        </div>
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
      <SheetTrigger asChild>
        <div>
          <ActionRow icon={<Target size={18} />} label="Metas Mensais" />
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-3xl p-6">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Metas deste Mês</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meta de Ganhos (R$)</Label>
            <Input type="number" value={earningGoal} onChange={e => setEarningGoal(e.target.value)} className="h-12" placeholder="Ex: 5000" />
          </div>
          <div className="space-y-2">
            <Label>Limite de Gastos (R$)</Label>
            <Input type="number" value={expenseLimit} onChange={e => setExpenseLimit(e.target.value)} className="h-12" placeholder="Ex: 1500" />
          </div>
          <Button onClick={handleSave} className="w-full h-12 font-bold mt-4">Salvar Metas</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PlatformsSheet() {
  const { data: platforms, addPlatform, updatePlatform, deletePlatform } = usePlatforms();
  const [open, setOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ name: '', color: '#3B82F6', icon: 'car' });

  const handleAdd = async () => {
    if (!newPlatform.name) return;
    await addPlatform({ ...newPlatform, is_active: true });
    setNewPlatform({ name: '', color: '#3B82F6', icon: 'car' });
    setIsAddOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div>
          <ActionRow icon={<Briefcase size={18} />} label="Plataformas de Trabalho" />
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] rounded-t-3xl p-6 flex flex-col">
        <SheetHeader className="mb-6 text-left shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Suas Plataformas</SheetTitle>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="w-8 h-8 rounded-full">
                  <Plus size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6">
                <DialogHeader>
                  <DialogTitle>Nova Plataforma</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={newPlatform.name} onChange={e => setNewPlatform({...newPlatform, name: e.target.value})} className="h-12" placeholder="Ex: Uber, Lalamove" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor de Identificação</Label>
                    <div className="flex gap-4 items-center">
                      <Input type="color" value={newPlatform.color} onChange={e => setNewPlatform({...newPlatform, color: e.target.value})} className="h-12 w-20 p-1" />
                      <div className="flex-1 text-sm text-muted-foreground">{newPlatform.color}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(platformIconMap).map((iconKey) => {
                        const IconComponent = platformIconMap[iconKey];
                        return (
                          <div 
                            key={iconKey} 
                            onClick={() => setNewPlatform({...newPlatform, icon: iconKey})}
                            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all ${newPlatform.icon === iconKey ? 'border-primary bg-primary/10' : 'border-transparent bg-muted'}`}
                          >
                            <IconComponent size={18} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full h-12 font-bold mt-2">Salvar Plataforma</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pb-8">
          {platforms?.map(p => {
            const IconComponent = platformIconMap[p.icon] || Briefcase;
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
                <Button variant={p.is_active ? 'default' : 'secondary'} size="icon" className="w-8 h-8 rounded-full" onClick={() => updatePlatform({ id: p.id, is_active: !p.is_active })}>
                  <Power size={14} className={p.is_active ? 'text-white' : 'text-muted-foreground'} />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                  if (confirm('Deletar plataforma?')) deletePlatform(p.id);
                }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )})}
          {platforms?.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma plataforma cadastrada.</p>}
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
      <SheetTrigger asChild>
        <div>
          <ActionRow icon={<Tags size={18} />} label="Categorias de Gastos" />
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[80vh] rounded-t-3xl p-6 flex flex-col">
        <SheetHeader className="mb-6 text-left shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Categorias</SheetTitle>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="w-8 h-8 rounded-full">
                  <Plus size={16} />
                </Button>
              </DialogTrigger>
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
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                if (confirm('Deletar categoria?')) deleteCategory(c.id);
              }}>
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
