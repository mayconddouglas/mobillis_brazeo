import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { ArrowLeft, Mail } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
});

type FormValues = z.infer<typeof schema>;

function Spinner() {
  return (
    <motion.div
      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
    />
  );
}

export default function ForgotPassword() {
  const { isDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        setError('Modo demo ativo: configure o Supabase para usar esta funcionalidade.');
        return;
      }
      const redirectTo =
        import.meta.env.VITE_SITE_URL?.toString() || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${redirectTo}/redefinir-senha`,
      });
      if (error) throw error;
      setSentEmail(values.email);
      setSent(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-background overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] flex flex-col items-center justify-center relative z-10"
      >
        <div className="flex flex-col items-center mb-8 w-full">
          <div className="flex items-start gap-2 relative">
            <span className="text-3xl font-bold tracking-tight">BrazeFlow</span>
            <div className="absolute -top-3 -right-24 rounded-bl-none rounded-2xl bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
              by Brazeo.ai
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Seu fluxo financeiro em um só lugar.
          </p>
        </div>

        <div className="w-full">
          <Card className="border-muted/40 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle>Recuperar senha</CardTitle>
              <CardDescription>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">E-mail enviado!</p>
                      <p className="text-xs text-muted-foreground">
                        Enviamos um link de redefinição para{' '}
                        <span className="font-medium text-foreground">{sentEmail}</span>.
                        Verifique também sua caixa de spam.
                      </p>
                    </div>
                  </div>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar para o login
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">E-mail</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="voce@exemplo.com"
                        autoComplete="email"
                        inputMode="email"
                        {...register('email')}
                      />
                      {errors.email?.message && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </Field>
                    <Field>
                      <Button
                        type="submit"
                        disabled={!isValid || loading || isDemo}
                        className={loading ? 'opacity-90' : undefined}
                      >
                        <span className="inline-flex items-center gap-2">
                          {loading && <Spinner />}
                          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                        </span>
                      </Button>
                      <div className="text-center text-xs text-muted-foreground">
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          Voltar para o login
                        </Link>
                      </div>
                    </Field>
                  </FieldGroup>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
