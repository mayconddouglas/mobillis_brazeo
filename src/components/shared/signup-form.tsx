"use client"

import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { motion } from "motion/react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { getAuthErrorMessage } from "@/utils/authErrors"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { OAuthButtons } from "@/components/shared/oauth-buttons"

const signupSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres."),
  email: z.string().email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .regex(/[0-9]/, "A senha precisa ter pelo menos 1 número.")
    .regex(/[A-Z]/, "A senha precisa ter pelo menos 1 letra maiúscula."),
})

type SignupValues = z.infer<typeof signupSchema>

function Spinner() {
  return (
    <motion.div
      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
    />
  )
}

function getPasswordStrength(password: string) {
  const hasMinLen = password.length >= 8
  const hasNumber = /[0-9]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const score = [hasMinLen, hasNumber, hasUpper, hasSpecial].filter(Boolean).length

  if (score <= 1) return { label: "Fraca", value: 25, indicatorClassName: "bg-red-500" }
  if (score === 2) return { label: "Razoável", value: 50, indicatorClassName: "bg-orange-500" }
  if (score === 3) return { label: "Boa", value: 75, indicatorClassName: "bg-yellow-500" }
  return { label: "Forte", value: 100, indicatorClassName: "bg-green-500" }
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  const { isDemo } = useAuth()
  const navigate = useNavigate()
  const redirectTo =
    import.meta.env.VITE_SITE_URL?.toString() || window.location.origin
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = React.useState(false)
  const [signedUpEmail, setSignedUpEmail] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const passwordValue = watch("password") || ""
  const strength = React.useMemo(() => getPasswordStrength(passwordValue), [passwordValue])

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true)
    setError(null)
    setEmailAlreadyRegistered(false)
    try {
      if (isDemo) {
        setError("Modo demo ativo: configure o Supabase para criar conta.")
        return
      }

      const trimmedName = values.name.trim()

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { name: trimmedName, full_name: trimmedName },
          emailRedirectTo: redirectTo,
        },
      })

      if (error) throw error

      setSignedUpEmail(values.email)
      reset({ ...values, password: "" })
    } catch (err: any) {
      const rawMessage = String(err?.message ?? err?.error_description ?? "")
      const isAlready = rawMessage.toLowerCase().includes("user already registered")
      setEmailAlreadyRegistered(isAlready)
      if (!isAlready) {
        setError(getAuthErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  })

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Informe seus dados para começar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* OAuth */}
        <OAuthButtons label="Cadastrar com" />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou com e-mail</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {signedUpEmail && (
            <Alert>
              <AlertTitle>Confirme seu e-mail</AlertTitle>
              <AlertDescription>
                Enviamos um link de confirmação para{" "}
                <span className="font-medium">{signedUpEmail}</span>.
              </AlertDescription>
            </Alert>
          )}
          {emailAlreadyRegistered && (
            <Alert className="border-blue-500/50 bg-blue-500/5">
              <AlertTitle className="text-blue-700 dark:text-blue-300">Esse e-mail já tem uma conta</AlertTitle>
              <AlertDescription className="text-blue-700/80 dark:text-blue-300/80">
                Tente entrar com sua senha ou recupere o acesso.
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/login")} className="flex-1">
                    Fazer login
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/esqueci-senha")} className="flex-1">
                    Esqueci minha senha
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                autoComplete="name"
                {...register("name")}
              />
              <FieldDescription>
                Esse nome aparece no dashboard.
              </FieldDescription>
              {errors.name?.message && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                inputMode="email"
                {...register("email")}
              />
              {errors.email?.message && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Força da senha</span>
                  <span className={strength.label === "Forte" ? "text-green-500" : undefined}>{strength.label}</span>
                </div>
                <Progress value={strength.value} indicatorClassName={strength.indicatorClassName} />
              </div>
              {errors.password?.message && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </Field>
            <Field>
              <Button type="submit" disabled={!isValid || loading || isDemo} className={loading ? "opacity-90" : undefined}>
                <span className="inline-flex items-center gap-2">
                  {loading && <Spinner />}
                  {loading ? "Criando..." : "Criar conta"}
                </span>
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                Já tem conta?{" "}
                <Link to="/login" className="underline underline-offset-4 hover:text-foreground">
                  Entrar
                </Link>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
