import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Check, Route, Shield, Sparkles } from 'lucide-react';

export default function Login() {
  const { user, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        setError("Modo Demo ativo: as credenciais do Supabase não foram configuradas.");
        return;
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setSignedUpEmail(email);
        setIsSignUp(false);
        setPassword('');
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
    <div className="min-h-svh bg-background">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-muted/60 via-background to-background" />
      <div className="relative mx-auto grid min-h-svh w-full max-w-5xl items-center gap-10 px-4 py-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Route />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">RouteFinance</div>
                <Badge variant="secondary">Beta</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Um painel simples e poderoso para a sua vida financeira.
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4">
            <Feature
              icon={<BarChart3 />}
              title="Visão clara"
              description="Acompanhe ganhos, gastos e metas com relatórios prontos para o dia a dia."
            />
            <Feature
              icon={<Sparkles />}
              title="Experiência premium"
              description="Interface moderna, rápida e confortável no celular e no desktop."
            />
            <Feature
              icon={<Shield />}
              title="Seus dados, só seus"
              description="Segurança com Supabase + Row Level Security para separar dados por usuário."
            />
          </div>
        </div>

        <Card className="mx-auto w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Route />
                </div>
                <div>
                  <CardTitle>Bem-vindo</CardTitle>
                  <CardDescription>Entre para continuar ou crie sua conta.</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">Seguro</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {signedUpEmail && (
              <Alert className="bg-card">
                <Check />
                <AlertTitle>Confirme seu e-mail</AlertTitle>
                <AlertDescription>
                  Enviamos um link de confirmação para <span className="font-medium">{signedUpEmail}</span>. Abra o e-mail para ativar sua conta.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível continuar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs
              value={isSignUp ? 'signup' : 'login'}
              onValueChange={(val) => {
                setIsSignUp(val === 'signup');
                setError(null);
              }}
            >
              <TabsList className="w-full" variant="default">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleAuth} className="flex flex-col gap-3">
                  <Input
                    type="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="h-12"
                  />
                  <Input
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12"
                  />

                  <Button className="h-12 w-full" type="submit" disabled={loading || isDemo}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleAuth} className="flex flex-col gap-3">
                  <Input
                    type="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="h-12"
                  />
                  <Input
                    type="password"
                    placeholder="Crie uma senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-12"
                  />

                  <div className="text-xs text-muted-foreground">
                    Ao criar a conta, você concorda em usar o RouteFinance de forma responsável.
                  </div>

                  <Button className="h-12 w-full" type="submit" disabled={loading || isDemo}>
                    {loading ? 'Criando...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="text-xs text-muted-foreground">
              Dica: se não encontrar o e-mail, verifique Spam/Promoções.
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} RouteFinance</div>
            <Badge variant="secondary" className="lg:hidden">Beta</Badge>
          </CardFooter>
        </Card>

        {isDemo && (
          <div className="lg:hidden">
            <Alert className="border-border bg-card/80 backdrop-blur">
              <AlertDescription>
                Modo Demo Local: VITE_SUPABASE_URL não configurado.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-card/60 p-4 ring-1 ring-foreground/10">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
