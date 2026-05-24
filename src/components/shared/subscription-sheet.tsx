import React, { useState } from 'react'
import { Crown, Zap, Check, FlaskConical, AlertTriangle, ExternalLink, ChevronRight, Sparkles, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PlanBadge } from '@/components/shared/plan-badge'

const PRO_FEATURES = [
  { label: 'Carteiras ilimitadas',     icon: '🏦' },
  { label: 'Categorias ilimitadas',    icon: '🏷️' },
  { label: 'Lançamentos ilimitados',   icon: '♾️' },
  { label: 'Metas mensais',            icon: '🎯' },
  { label: 'Exportar CSV e PDF',       icon: '📄' },
  { label: 'Histórico completo',       icon: '📊' },
  { label: 'Relatórios avançados',     icon: '✨' },
]

const FREE_LIMITS = [
  '1 carteira',
  '3 categorias de receita',
  '3 categorias de despesa',
  '30 lançamentos/mês',
]

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
      setLoadingCheckout(false)
    }
  }

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

      <SheetContent side="bottom" className="max-h-[95vh] rounded-t-3xl p-0 overflow-y-auto bg-background border-0">

        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden px-6 pt-8 pb-6">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/8 via-amber-500/4 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-amber-500/8 rounded-full blur-2xl pointer-events-none" />

          <SheetTitle className="sr-only">Plano & Assinatura</SheetTitle>

          {isPro ? (
            <div className="relative space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/25">
                  <Crown className="h-4 w-4 text-black" />
                </div>
                <span className="text-xs font-bold tracking-widest text-yellow-400 uppercase">Assinante</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">BrazeFlow Pro</h2>
              <p className="text-sm text-muted-foreground">
                {subscription?.current_period_end
                  ? `Renova em ${new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}`
                  : 'Acesso completo ativo'}
              </p>
            </div>
          ) : (
            <div className="relative space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <PlanBadge plan={plan} trialDaysLeft={trialDaysLeft} variant="card" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Desbloqueie o Pro</h2>
              <p className="text-sm text-muted-foreground">Controle financeiro sem limites por apenas</p>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-4xl font-black text-yellow-400 tracking-tight">R$&nbsp;9</span>
                <span className="text-xl font-bold text-yellow-400">,00</span>
                <span className="text-sm text-muted-foreground ml-1">/mês</span>
              </div>
            </div>
          )}
        </div>

        {/* ── TRIAL ALERTS ── */}
        <AnimatePresence>
          {isTrial && trialDaysLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mb-2 flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3"
            >
              <FlaskConical className="h-4 w-4 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300">
                Trial termina em <strong>{trialDaysLeft} dias</strong>. Assine para manter o acesso.
              </p>
            </motion.div>
          )}
          {isTrial && trialDaysLeft === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3"
            >
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">Trial expirado. Assine para continuar.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 pb-8 space-y-4">

          {isPro ? (
            /* ── PRO ATIVO ── */
            <div className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/8 to-amber-500/4 overflow-hidden">
              <div className="px-5 pt-5 pb-4 space-y-3">
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Seus benefícios</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {PRO_FEATURES.map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-yellow-400" />
                      </div>
                      <span className="text-sm text-foreground/80">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── FREE → UPGRADE ── */
            <>
              {/* Trial badge */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500/15 to-purple-600/10 border border-violet-500/20">
                <div className="h-8 w-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-violet-300">7 dias grátis incluídos</p>
                  <p className="text-xs text-muted-foreground">Sem cobrança até o fim do período</p>
                </div>
              </div>

              {/* Features Pro */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 pt-4 pb-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">O que você vai ter</p>
                </div>
                <div className="px-5 pb-5 grid grid-cols-1 gap-2">
                  {PRO_FEATURES.map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      <span className="text-base leading-none">{f.icon}</span>
                      <span className="text-sm text-foreground/80">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plano Free limitações */}
              <div className="rounded-2xl border border-border/50 bg-muted/30 overflow-hidden">
                <div className="px-5 pt-4 pb-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Plano Free atual</p>
                  </div>
                </div>
                <div className="px-5 pb-4 grid grid-cols-2 gap-2">
                  {FREE_LIMITS.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-14 font-black text-base rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:opacity-95 shadow-lg shadow-yellow-500/20 border-0"
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                >
                  <span className="inline-flex items-center gap-2">
                    {loadingCheckout ? <Spinner /> : <Star className="h-4 w-4 fill-black" />}
                    {loadingCheckout ? 'Redirecionando...' : 'Começar 7 dias grátis'}
                  </span>
                </Button>
              </motion.div>

              <p className="text-center text-xs text-muted-foreground/60">
                Após o trial, R$ 9,00/mês · Cancele quando quiser
              </p>
            </>
          )}

          {/* Cancelar assinatura */}
          {isPro && subscription?.stripe_subscription_id && (
            <div className="pt-2 border-t border-border/40">
              <AnimatePresence mode="wait">
                {!cancelOpen ? (
                  <motion.button
                    key="cancel-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    className="text-xs text-muted-foreground/50 underline underline-offset-4 hover:text-muted-foreground w-full text-center py-2"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancelar assinatura
                  </motion.button>
                ) : (
                  <motion.div
                    key="cancel-confirm"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"
                  >
                    <p className="text-sm font-bold text-red-400">Cancelar assinatura?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Você perde o acesso Pro ao fim do período atual. Seus dados financeiros ficam salvos.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setCancelOpen(false)}>
                        Manter Pro
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 h-10 rounded-xl"
                        onClick={() => {
                          const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL
                          if (portalUrl) window.open(portalUrl, '_blank')
                          else alert('Configure VITE_STRIPE_PORTAL_URL no .env')
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Cancelar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
