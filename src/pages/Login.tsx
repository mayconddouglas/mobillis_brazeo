import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Route } from 'lucide-react';

export default function Login() {
  const { user, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        alert("Modo Demo ativo: as credenciais do Supabase não foram configuradas. O app deverá ignorar o login automaticamente.");
        return;
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu email se a confirmação estiver ativada, ou no caso do Supabase local já pode entrar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm rounded-[24px] shadow-2xl border-none">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Route className="text-primary w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tighter">RouteFinance</CardTitle>
          <CardDescription className="text-sm">
            {isSignUp ? 'Crie sua conta para começar' : 'Acesse seu dashboard financeiro'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-xl font-medium text-center">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            
            <Button className="w-full h-12 rounded-xl font-bold" type="submit" disabled={loading}>
              {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
            
            <Button
              type="button"
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Já tenho uma conta. Entrar' : 'Não tenho conta. Criar nova'}
            </Button>
          </form>
        </CardContent>
      </Card>
      {isDemo && (
         <div className="fixed bottom-4 left-0 w-full text-center text-xs text-muted-foreground px-8">
            <p className="bg-yellow-500/10 text-yellow-600 p-2 rounded-lg font-medium">Modo Demo Local. VITE_SUPABASE_URL não configurado.</p>
         </div>
      )}
    </div>
  );
}
