import React, { useState } from 'react';
import { useWallets, useExpenses, useExpenseCategories, Wallet } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wallet as WalletIcon, ArrowLeftRight, CreditCard, Landmark, Edit2, Trash2, Tag, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const parseDateLocal = (dateStr: string) => new Date(dateStr + 'T12:00:00');

export default function Wallets() {
  const { data: wallets, addWallet, updateWallet, deleteWallet } = useWallets();
  const { data: expenses, deleteExpense } = useExpenses();
  const { data: categories } = useExpenseCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositData, setDepositData] = useState({ wallet_id: '', amount: '' });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ from_wallet_id: '', to_wallet_id: '', amount: '' });

  const [newWallet, setNewWallet] = useState({
    name: '',
    balance: '',
    color: '#3B82F6',
    icon: 'banknote'
  });

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.from_wallet_id || !transferData.to_wallet_id || !transferData.amount) return;
    if (transferData.from_wallet_id === transferData.to_wallet_id) {
      alert("Selecione carteiras diferentes para transferir.");
      return;
    }
    
    const fromWallet = wallets?.find((w: Wallet) => w.id === transferData.from_wallet_id);
    const toWallet = wallets?.find((w: Wallet) => w.id === transferData.to_wallet_id);
    if (!fromWallet || !toWallet) return;

    const amountNum = parseFloat(transferData.amount.toString().replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (fromWallet.balance < amountNum) {
      // Just alert and stop to avoid negative balances since confirm doesn't work in iframe
      alert("O saldo não é suficiente para a transferência.");
      return;
    }

    await updateWallet({
      id: fromWallet.id,
      balance: fromWallet.balance - amountNum
    });

    await updateWallet({
      id: toWallet.id,
      balance: toWallet.balance + amountNum
    });

    setIsTransferModalOpen(false);
    setTransferData({ from_wallet_id: '', to_wallet_id: '', amount: '' });
  };

  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositData.wallet_id || !depositData.amount) return;
    
    const wallet = wallets?.find((w: Wallet) => w.id === depositData.wallet_id);
    if (!wallet) return;

    const amountNum = parseFloat(depositData.amount.toString().replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) return;

    await updateWallet({
      id: wallet.id,
      balance: wallet.balance + amountNum
    });

    setIsDepositModalOpen(false);
    setDepositData({ wallet_id: '', amount: '' });
  };

  const handleOpenAdd = () => {
    setEditingWallet(null);
    setNewWallet({
      name: '',
      balance: '',
      color: '#3B82F6',
      icon: 'banknote'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setNewWallet({
      name: wallet.name,
      balance: wallet.balance.toString(),
      color: wallet.color,
      icon: wallet.icon
    });
    setIsModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallet.name || !newWallet.balance) return;

    const dataPayload = {
      name: newWallet.name,
      balance: parseFloat(newWallet.balance.toString().replace(',', '.')),
      color: newWallet.color,
      icon: newWallet.icon
    };

    if (editingWallet) {
      await updateWallet({ id: editingWallet.id, ...dataPayload });
    } else {
      await addWallet(dataPayload);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteWallet(id);
    setIsModalOpen(false);
  };

  const handleDeleteExpense = async (id: string, amount: number, wallet_id: string) => {
    await deleteExpense(id);
    const wallet = wallets?.find((w: Wallet) => w.id === wallet_id);
    if (wallet) {
      await updateWallet({ id: wallet.id, balance: wallet.balance + amount });
    }
  };

  const recentMovements = expenses?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10) || [];

  return (
    <div className="p-4 space-y-6 pb-24 relative min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold tracking-tight">Suas Contas</h1>
      </div>

      {/* Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
        {wallets?.map(wallet => (
          <Card 
            key={wallet.id} 
            className="min-w-[280px] snap-center shrink-0 border-none relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group" 
            style={{ backgroundColor: wallet.color, color: '#fff' }}
            onClick={() => handleOpenEdit(wallet)}
          >
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                    {wallet.name}
                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  {wallet.icon === 'banknote' ? <Landmark size={20} /> : <CreditCard size={20} />}
                </div>
              </div>
              <div>
                <p className="text-white/70 text-xs mb-1">Saldo Atual</p>
                <p className="text-3xl font-mono font-bold tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wallet.balance)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card 
          onClick={handleOpenAdd}
          className="min-w-[280px] snap-center shrink-0 border-dashed border-2 bg-transparent hover:bg-muted/50 cursor-pointer flex items-center justify-center min-h-[160px]"
        >
          <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Plus size={24} />
            </div>
            <p className="font-semibold text-sm">Nova Carteira</p>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm shadow-sm bg-green-500 hover:bg-green-600 text-white" 
          onClick={() => {
            setDepositData({ wallet_id: wallets?.[0]?.id || '', amount: '' });
            setIsDepositModalOpen(true);
          }}
        >
          <PlusCircle size={20} />
          <span>Nova Entrada</span>
        </Button>
        <Button 
          className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm shadow-sm bg-accent text-accent-foreground hover:bg-accent/90" 
          onClick={() => {
            setTransferData({ from_wallet_id: '', to_wallet_id: '', amount: '' });
            setIsTransferModalOpen(true);
          }}
        >
          <ArrowLeftRight size={20} />
          <span>Transferir</span>
        </Button>
      </div>

      {/* History */}
      <div className="mt-8">
        <h3 className="font-semibold tracking-tight text-sm mb-4">Últimas Movimentações (Despesas)</h3>
        {recentMovements.length > 0 ? (
          <div className="space-y-3">
            {recentMovements.map(mov => {
              const category = categories?.find(c => c.id === mov.category_id);
              const wallet = wallets?.find(w => w.id === mov.wallet_id);
              
              return (
                <Card key={mov.id} className="shadow-sm border">
                  <CardContent className="p-3 pr-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm" style={{ backgroundColor: category?.color || '#ef4444' }}>
                        <Tag size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{mov.description}</p>
                        <p className="text-xs text-muted-foreground">{category?.name || 'Despesa'} • {wallet?.name || 'Conta removida'} • {format(parseDateLocal(mov.date), "dd/MM")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-black text-red-500 text-sm">
                          -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mov.amount)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteExpense(mov.id, mov.amount, mov.wallet_id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
            <WalletIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Nenhuma movimentação registrada.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editingWallet ? 'Editar Carteira' : 'Nova Carteira'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveWallet} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Carteira</Label>
              <Input 
                id="name" 
                placeholder="Ex: Nubank, Carteira Física"
                required
                value={newWallet.name}
                onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Atual (R$)</Label>
              <Input 
                id="balance" 
                type="number" 
                step="0.01"
                required
                value={newWallet.balance}
                onChange={(e) => setNewWallet({...newWallet, balance: e.target.value})}
                className="h-12 text-lg font-mono"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex gap-2 items-center h-12 p-2 border rounded-md">
                  <input 
                    type="color" 
                    id="color" 
                    value={newWallet.color}
                    onChange={(e) => setNewWallet({...newWallet, color: e.target.value})}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-muted-foreground uppercase">{newWallet.color}</span>
                </div>
              </div>
              <div className="space-y-2">
                 <Label>Ícone</Label>
                 <div className="flex gap-2 h-12 border rounded-md items-center justify-center bg-muted/20">
                    <button type="button" onClick={() => setNewWallet({...newWallet, icon: 'banknote'})} className={`p-2 rounded-md transition-colors ${newWallet.icon === 'banknote' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                      <Landmark size={20} />
                    </button>
                    <button type="button" onClick={() => setNewWallet({...newWallet, icon: 'credit-card'})} className={`p-2 rounded-md transition-colors ${newWallet.icon === 'credit-card' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                      <CreditCard size={20} />
                    </button>
                 </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t mt-2">
              {editingWallet && (
                <Button type="button" variant="outline" onClick={() => handleDelete(editingWallet.id)} className="h-12 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                  <Trash2 size={18} />
                </Button>
              )}
              <Button type="submit" className="flex-1 h-12 font-bold text-base">
                {editingWallet ? 'Salvar Edição' : 'Criar Carteira'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Nova Entrada / Ajuste de Saldo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDeposit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="deposit_amount">Valor a Adicionar (R$)</Label>
              <Input 
                id="deposit_amount" 
                type="number" 
                step="0.01"
                required
                value={depositData.amount}
                onChange={(e) => setDepositData({...depositData, amount: e.target.value})}
                className="h-14 text-2xl font-black font-mono text-green-500 px-4"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_wallet">Em qual carteira?</Label>
              <Select 
                value={depositData.wallet_id} 
                onValueChange={(val) => setDepositData({...depositData, wallet_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a carteira">
                     {wallets?.find((w: Wallet) => w.id === depositData.wallet_id)?.name || 'Selecione a carteira'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((w: Wallet) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t mt-4">
              <Button type="submit" className="w-full h-12 font-bold text-base bg-green-500 hover:bg-green-600 text-white">
                Confirmar Entrada
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-32px)] mx-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Transferir entre Contas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTransfer} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="transfer_amount">Valor a Transferir (R$)</Label>
              <Input 
                id="transfer_amount" 
                type="number" 
                step="0.01"
                required
                value={transferData.amount}
                onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                className="h-14 text-2xl font-black font-mono text-blue-500 px-4"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Carteira de Origem</Label>
              <Select 
                value={transferData.from_wallet_id} 
                onValueChange={(val) => setTransferData({...transferData, from_wallet_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="De qual carteira?">
                     {wallets?.find((w: Wallet) => w.id === transferData.from_wallet_id)?.name || 'De qual carteira?'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((w: Wallet) => (
                    <SelectItem key={`from-${w.id}`} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Carteira de Destino</Label>
              <Select 
                value={transferData.to_wallet_id} 
                onValueChange={(val) => setTransferData({...transferData, to_wallet_id: val})}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Para qual carteira?">
                    {wallets?.find((w: Wallet) => w.id === transferData.to_wallet_id)?.name || 'Para qual carteira?'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((w: Wallet) => (
                    <SelectItem key={`to-${w.id}`} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t mt-4">
              <Button type="submit" className="w-full h-12 font-bold text-base bg-blue-500 hover:bg-blue-600 text-white">
                Confirmar Transferência
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
