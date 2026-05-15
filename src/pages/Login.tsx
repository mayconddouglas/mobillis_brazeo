import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '@/components/shared/login-form';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export default function Login() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
      {/* Background Graphic elements completely hidden on mobile, visible on desktop lg */}
      <div className="hidden lg:flex w-[45%] bg-zinc-950 relative items-center justify-center p-12 overflow-hidden text-zinc-50 shadow-2xl z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=BrazeFlow')] opacity-5 bg-repeat bg-[length:120px]" />
        
        <div className="relative z-10 max-w-lg space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="text-3xl font-bold tracking-tight">BrazeFlow</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-bold leading-tight">
              Transforme a maneira como você gerencia seu dinheiro.
            </h1>
            <p className="text-lg text-zinc-400">
              O BrazeFlow conecta seus ganhos, despesas e metas em um único fluxo de prosperidade inteligente e seguro.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 pt-8"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" />
              <span className="text-sm font-medium">Criptografia de Ponta</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-400" />
              <span className="text-sm font-medium">Metas Inteligentes</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="text-blue-400" />
              <span className="text-sm font-medium">Análise em Tempo Real</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main form section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px] flex flex-col items-center"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl font-bold tracking-tight">BrazeFlow</span>
          </div>

          <div className="w-full relative z-10">
            <LoginForm className="[&>div]:border-muted/40 [&>div]:shadow-xl [&>div]:shadow-black/5" />
          </div>
          
          <div className="mt-8 text-center text-xs text-muted-foreground w-full">
            <p>
              Ao entrar, você concorda com nossos{" "}
              <Link to="#" className="underline hover:text-primary transition-colors">Termos de Serviço</Link> e{" "}
              <Link to="#" className="underline hover:text-primary transition-colors">Política de Privacidade</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
