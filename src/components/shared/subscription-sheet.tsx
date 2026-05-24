import React, { useState } from 'react'
import { Crown, Zap, Check, FlaskConical, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react'
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

// Features bloqueadas no free com tag PRO ao lado (ponto 3)
export const PRO_LOCKED_FEATURES = [
  'Metas mensais',
  'Exportar relatórios',
  'Histórico completo',
  'Relatórios avançados',
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

export function SubscriptionSheet() {
  const { user } = useAuth()
  const { subscription, isPro, isTrial, trialDaysLeft } = useSubscription()
  const [open, setOpen] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const plan = subscription?.plan ?? 'free'

  const handleCheckout = async () => {
    setLoadingCheckout(true)
    const checkoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL
    if (checkoutUrl) {
      window.location.href = `${checkoutUrl}?prefilled_email=${encodeURIComponent(user?.email || '')}`
    } else {
      alert('Configure VITE_STRIPE_CHECKOUT_URL no .env para ativar pagamentos.')
    }
    setLoadingCheckout(false)
  }

  // Trigger row — alinhada igualmente às outras rows do Settings
  const triggerRow = (
    <button
      type="button"
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors w-full bg-transparent border-0 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground"><Crown size={18} /></div>
        <span className="font-medium text-sm text-foreground">Plano & Assinatura</span>
      </div>
      <div className="flex items-center gap-3">
        <PlanBadge plan={plan} trialDaysLeft={trialDaysLeft} variant="inline" />
        <ChevronRight size={18} className="text-muted-foreground/50" />
      </div>
    </button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={
        <button
          type="button"
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors w-full bg-transparent border-0 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground"><Crown size={18} /></div>
            <span className="font-medium text-sm text-foreground">Plano & Assinatura</span>
          </div>
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} trialDaysLeft={trialDaysLeft} variant="inline" />
            <ChevronRight size={18} className="text-muted-foreground/50" />
          </div>
        </button>
      } />

      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-3xl p-0 overflow-y-auto">
        {/* Header */}
        <div className={`p-6 pb-5 ${isPro ? 'bg-gradient-to-br from-yellow-400/20 to-amber-500/10' : 'bg-gradient-to-br from-primary/10 to-primary/5'}`}>
          <SheetHeader className="text-left mb-0">
            <SheetTitle className="text-xl flex items-center gap-3">
              Plano & Assinatura
              <PlanBadge plan={plan} trialDaysLeft={trialDaysLeft} variant="card" />
            </SheetTitle>
          </SheetHeader>

          {isTrial && trialDaysLeft > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
              <FlaskConical className="h-4 w-4 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300">
                Período de teste termina em <strong>{trialDaysLeft} dias</strong>. Assine para não perder o acesso.
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

          {isPro ? (
            /* ── USUÁRIO PRO ── */
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
            /* ── USUÁRIO FREE / TRIAL EXPIRADO ── */
            <div className="space-y-3">

              {/* Plano atual */}
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

              {/* Card Pro */}
              <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-400/10 to-amber-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-400" />
                    <span className="font-bold text-sm">BrazeFlow Pro</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-yellow-400">R$ 9,00</span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </div>

                {/* Trial notice — o trial de 7 dias é gerenciado pelo Stripe no checkout */}
                <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
                  <FlaskConical className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                  <p className="text-xs text-violet-300">7 dias grátis no primeiro mês — cancele quando quiser.</p>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {PRO_FEATURES.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full h-12 font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:opacity-90 mt-1"
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                >
                  <span className="inline-flex items-center gap-2">
                    {loadingCheckout && <Spinner />}
                    {loadingCheckout ? 'Redirecionando...' : 'Começar 7 dias grátis'}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Cancelar assinatura */}
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
