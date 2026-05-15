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
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-background overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] flex flex-col items-center justify-center relative z-10"
      >
        <div className="flex items-center gap-2 mb-8">
          <span className="text-3xl font-bold tracking-tight">BrazeFlow</span>
        </div>

        <div className="w-full">
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
  );
}
