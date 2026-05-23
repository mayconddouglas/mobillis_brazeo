import React, { useState } from 'react'
import { Crown, Zap, Check, FlaskConical, AlertTriangle, ExternalLink } from 'lucide-react'
import { motion } from 'motion/react'

import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PlanBadge } from '@/components/shared/plan-badge'

const PRO_FEATURES = [
  'Carteiras ilimitadas',
  'Categorias ilimitadas',
  'Lançamentos ilimitados',
  'Metas mensais',
  'Exportar CSV e PDF',
  'Histórico completo',
  'Relatórios avançados',
]

const FREE_FEATURES = [
  '1 carteira',
  '3 categorias de receita',
  '3 categorias de despesa',
  '30 lançamentos por mês',
]

function Spinner() {
  return (
    <motion.div
      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
    />
  )
}

interface ActionRowProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  badge?: React.ReactNode
}

function ActionRow({ icon, label, onClick, badge }: ActionRowProps) {
  return (
    <button
      type="button"
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors w-full bg-transparent border-0 text-left"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="font-medium text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        <svg className="h-4 w-4 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </div>
    </button>
  )
}

export function SubscriptionSheet() {
  const { user } = useAuth()
  const { subscription, isPro, isTrial, trialDaysLeft, startTrial } = useSubscription()
  const [open, setOpen] = useState(false)
  const [loadingTrial, setLoadingTrial] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [trialStarted, setTrialStarted] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const plan = subscription?.plan ?? 'free'

  const handleStartTrial = async () => {
    setLoadingTrial(true)
    const result = await startTrial()
    setLoadingTrial(false)
    if (!result?.error) setTrialStarted(true)
  }

  const handleCheckout = async () => {
    setLoadingCheckout(true)
    // Redirect to Stripe Checkout via your backend/edge function
    // Replace with your actual Stripe checkout URL or edge function
    const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL
    if (checkoutUrl) {
      window.location.href = `${checkoutUrl}?prefilled_email=${encodeURIComponent(user?.email || '')}`
    } else {
      alert('Configure VITE_STRIPE_CHECKOUT_URL no .env para ativar pagamentos.')
    }
    setLoadingCheckout(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <ActionRow
          icon={<Crown size={18} />}
          label="Plano & Assinatura"
          badge={<PlanBadge plan={plan} trialDaysLeft={trialDaysLeft} />}
        />
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-3xl p-0 overflow-y-auto">
        {/* Header gradient */}
        <div className={`p-6 pb-5 ${isPro ? 'bg-gradient-to-br from-yellow-400/20 to-amber-500/10' : 'bg-gradient-to-br from-primary/10 to-primary/5'}`}>
          <SheetHeader className="text-left mb-0">
            <SheetTitle className="text-xl flex items-center gap-2">
              Plano & Assinatura
              <PlanBadge plan={plan} trialDaysLeft={trialDaysLeft} size="md" />
            </SheetTitle>
          </SheetHeader>

          {isTrial && trialDaysLeft > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
              <FlaskConical className="h-4 w-4 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300">
                Seu período de teste termina em <strong>{trialDaysLeft} dias</strong>. Assine para não perder o acesso.
              </p>
            </div>
          )}

          {isTrial && trialDaysLeft === 0 && (
            <div className="mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">Seu trial expirou. Assine o Pro para continuar.</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">

          {/* Current Plan */}
          {isPro ? (
            <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-400/10 to-amber-500/5 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <span className="font-bold text-base">BrazeFlow Pro</span>
                </div>
                <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">ATIVO</span>
              </div>
              {subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  Renova em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              )}
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                {PRO_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Free plan card */}
              <div className="rounded-2xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Plano Free (atual)</span>
                </div>
                <div className="grid grid-cols-1 gap-1 mt-1">
                  {FREE_FEATURES.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro plan card */}
              <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-400/10 to-amber-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-400" />
                    <span className="font-bold text-sm">BrazeFlow Pro</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-yellow-400">R$ 19,90</span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRO_FEATURES.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  className="w-full h-12 font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:opacity-90 mt-1"
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                >
                  <span className="inline-flex items-center gap-2">
                    {loadingCheckout && <Spinner />}
                    {loadingCheckout ? 'Redirecionando...' : 'Assinar Pro — R$ 19,90/mês'}
                  </span>
                </Button>
              </div>

              {/* Trial */}
              {!isTrial && subscription?.plan === 'free' && (
                trialStarted ? (
                  <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 text-center space-y-1">
                    <FlaskConical className="h-5 w-5 text-violet-400 mx-auto" />
                    <p className="text-sm font-semibold text-violet-300">Trial de 7 dias ativado!</p>
                    <p className="text-xs text-muted-foreground">Aproveite todos os recursos Pro por uma semana.</p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-11 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                    onClick={handleStartTrial}
                    disabled={loadingTrial}
                  >
                    <span className="inline-flex items-center gap-2">
                      {loadingTrial ? <Spinner /> : <FlaskConical className="h-4 w-4" />}
                      {loadingTrial ? 'Ativando...' : 'Testar Pro grátis por 7 dias'}
                    </span>
                  </Button>
                )
              )}
            </div>
          )}

          {/* Cancel */}
          {isPro && subscription?.stripe_subscription_id && (
            <div className="pt-2 border-t">
              {!cancelOpen ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground w-full text-center"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancelar assinatura
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm font-semibold text-red-400">Tem certeza?</p>
                  <p className="text-xs text-muted-foreground">
                    Você perderá acesso ao Pro ao fim do período atual. Seus dados ficam salvos.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10" onClick={() => setCancelOpen(false)}>
                      Manter Pro
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 h-10"
                      onClick={() => {
                        const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL
                        if (portalUrl) window.open(portalUrl, '_blank')
                        else alert('Configure VITE_STRIPE_PORTAL_URL no .env')
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
