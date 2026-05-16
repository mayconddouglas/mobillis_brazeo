"use client"

import * as React from "react"
import { Link } from "react-router-dom"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .regex(/[0-9]/, "A senha precisa ter pelo menos 1 número.")
    .regex(/[A-Z]/, "A senha precisa ter pelo menos 1 letra maiúscula."),
})

type LoginValues = z.infer<typeof loginSchema>

function Spinner() {
  return (
    <motion.div
      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
    />
  )
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { user, isDemo } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  })

  React.useEffect(() => {
    if (user) {
      setError(null)
    }
  }, [user])

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true)
    setError(null)
    try {
      if (isDemo) {
        setError("Modo demo ativo: configure o Supabase para autenticar.")
        return
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (error) throw error
      reset({ ...values, password: "" })
    } catch (err: any) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar.</CardDescription>
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
                    autoComplete="current-password"
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
                {errors.password?.message && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={!isValid || loading || isDemo} className={loading ? "opacity-90" : undefined}>
                  <span className="inline-flex items-center gap-2">
                    {loading && <Spinner />}
                    {loading ? "Entrando..." : "Entrar"}
                  </span>
                </Button>
                <div className="text-center text-xs text-muted-foreground">
                  Não tem conta?{" "}
                  <Link to="/signup" className="underline underline-offset-4 hover:text-foreground">
                    Criar conta
                  </Link>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
