import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const schema = z.object({
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .regex(/[0-9]/, 'A senha precisa ter pelo menos 1 número.')
    .regex(/[A-Z]/, 'A senha precisa ter pelo menos 1 letra maiúscula.'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
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

function getPasswordStrength(password: string) {
  const hasMinLen = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasMinLen, hasNumber, hasUpper, hasSpecial].filter(Boolean).length;

  if (score <= 1) return { label: 'Fraca', value: 25, indicatorClassName: 'bg-red-500' };
  if (score === 2) return { label: 'Razoável', value: 50, indicatorClassName: 'bg-orange-500' };
  if (score === 3) return { label: 'Boa', value: 75, indicatorClassName: 'bg-yellow-500' };
  return { label: 'Forte', value: 100, indicatorClassName: 'bg-green-500' };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Supabase sets the session from the URL hash when the user lands here
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setCheckingSession(false);
    });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password') || '';
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  });

  if (checkingSession) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <motion.div
          className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
        />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[400px]">
          <Alert variant="destructive">
            <AlertTitle>Link inválido ou expirado</AlertTitle>
            <AlertDescription>
              Este link de redefinição não é mais válido.{' '}
              <Link to="/esqueci-senha" className="underline font-medium">
                Solicite um novo link
              </Link>
              .
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
              <CardTitle>Redefinir senha</CardTitle>
              <CardDescription>Escolha uma nova senha para a sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="password">Nova senha</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="pr-10"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordValue && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Força da senha</span>
                          <span className={strength.label === 'Forte' ? 'text-green-500' : undefined}>
                            {strength.label}
                          </span>
                        </div>
                        <Progress value={strength.value} indicatorClassName={strength.indicatorClassName} />
                      </div>
                    )}
                    {errors.password?.message && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="pr-10"
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword?.message && (
                      <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      disabled={!isValid || loading}
                      className={loading ? 'opacity-90' : undefined}
                    >
                      <span className="inline-flex items-center gap-2">
                        {loading && <Spinner />}
                        {loading ? 'Salvando...' : 'Salvar nova senha'}
                      </span>
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
