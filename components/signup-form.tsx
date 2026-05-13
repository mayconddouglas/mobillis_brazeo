"use client"

import * as React from "react"
import { Link } from "react-router-dom"

import { supabase } from "@/src/lib/supabase"
import { useAuth } from "@/src/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  const { isDemo } = useAuth()
  const redirectTo =
    import.meta.env.VITE_SITE_URL?.toString() || window.location.origin
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [signedUpEmail, setSignedUpEmail] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isDemo) {
        setError("Modo demo ativo: configure o Supabase para criar conta.")
        return
      }

      const trimmedName = name.trim()
      if (!trimmedName) {
        setError("Informe seu nome.")
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: trimmedName },
          emailRedirectTo: redirectTo,
        },
      })

      if (error) throw error

      setSignedUpEmail(email)
      setPassword("")
    } catch (err: any) {
      setError(err?.message || "Não foi possível criar sua conta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Informe seus dados para começar.</CardDescription>
      </CardHeader>
      <CardContent>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
              <FieldDescription>
                Esse nome aparece no dashboard.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading || isDemo}>
                {loading ? "Criando..." : "Criar conta"}
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
