import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignupForm } from '@/components/shared/signup-form';
import { motion } from 'motion/react';
import { Activity, LayoutDashboard, Target, Zap } from 'lucide-react';

export default function Signup() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
      {/* Background Graphic elements completely hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex w-[45%] bg-zinc-950 relative items-center justify-center p-12 overflow-hidden text-zinc-50 shadow-2xl z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-emerald-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=BrazeFlowSignup')] opacity-5 bg-repeat bg-[length:120px]" />
        
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
              A jornada para sua liberdade financeira começa aqui.
            </h1>
            <p className="text-lg text-zinc-400">
              Crie sua conta em segundos e tenha total clareza sobre para onde o seu dinheiro está indo. 
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 gap-6 pt-8 mt-4 border-t border-zinc-800/50"
          >
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2.5 rounded-lg shrink-0">
                <LayoutDashboard className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Visão Geral Completa</h3>
                <p className="text-sm text-zinc-400 mt-1">Dashboards interativos para monitorar receitas e despesas facilmente.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2.5 rounded-lg shrink-0">
                <Target className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Metas Focadas</h3>
                <p className="text-sm text-zinc-400 mt-1">Defina limites e objetivos, e deixe o BrazeFlow lhe manter na linha.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2.5 rounded-lg shrink-0">
                <Zap className="text-amber-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Lançamentos Rápidos</h3>
                <p className="text-sm text-zinc-400 mt-1">Registre novos gastos ou receitas de forma dinâmica e instantânea.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px] flex flex-col items-center my-auto"
        >
          {/* Mobile Logo Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 mt-4">
            <span className="text-2xl font-bold tracking-tight">BrazeFlow</span>
          </div>

          <div className="w-full relative z-10">
            <SignupForm className="w-full shadow-xl border-muted/40 shadow-black/5" />
          </div>
          
          <div className="mt-8 mb-4 text-center text-xs text-muted-foreground w-full">
            <p>
              Ao criar a sua conta, você concorda com nossos{" "}
              <Link to="#" className="underline hover:text-primary transition-colors">Termos de Serviço</Link> e{" "}
              <Link to="#" className="underline hover:text-primary transition-colors">Política de Privacidade</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

