import React, { useState } from 'react'
import { Crown, Zap, Check, FlaskConical, AlertTriangle, ExternalLink, ChevronRight, Sparkles, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PlanBadge } from '@/components/shared/plan-badge'

const PRO_FEATURES = [
  { label: 'Carteiras ilimitadas',   icon: '🏦' },
  { label: 'Categorias ilimitadas',  icon: '🏷️' },
  { label: 'Lançamentos ilimitados', icon: '♾️' },
  { label: 'Metas mensais',          icon: '🎯' },
  { label: 'Exportar CSV e PDF',     icon: '📄' },
  { label: 'Histórico completo',     icon: '📊' },
  { label: 'Relatórios avançados',   icon: '✨' },
]

const FREE_LIMITS = [
  '1 carteira',
  '3 cat. de receita',
  '3 cat. de despesa',
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

      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-3xl p-0 overflow-y-auto bg-background">

        {/* Header — igual padrão das outras abas */}
        <SheetHeader className="px-6 pt-6 pb-4 text-left border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Plano & Assinatura</SheetTitle>
            <PlanBadge plan={plan} trialDaysLeft={trialDaysLeft} variant="card" />
          </div>

          {/* Preço só para free */}
          {!isPro && (
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl font-black text-yellow-400">R$ 9,00</span>
              <span className="text-xs text-muted-foreground">/mês após o trial</span>
            </div>
          )}

          {/* Alertas trial */}
          {isTrial && trialDaysLeft > 0 && (
            <div className="flex items-center gap-2 mt-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
              <FlaskConical className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300">Trial termina em <strong>{trialDaysLeft} dias</strong>.</p>
            </div>
          )}
          {isTrial && trialDaysLeft === 0 && (
            <div className="flex items-center gap-2 mt-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">Trial expirado. Assine para continuar.</p>
            </div>
          )}
        </SheetHeader>

        <div className="px-6 py-5 space-y-4">

          {isPro ? (
            /* ── PRO ATIVO ── */
            <div className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/8 to-transparent p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-bold">BrazeFlow Pro</span>
                </div>
                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">ATIVO</span>
              </div>
              {subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  Renova em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              )}
              <div className="space-y-2 pt-1">
                {PRO_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <Check className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Trial badge */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-violet-300">7 dias grátis incluídos</p>
                  <p className="text-[11px] text-muted-foreground">Sem cobrança até o fim do período</p>
                </div>
              </div>

              {/* Features */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">O que você vai ter</p>
                {PRO_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <span className="text-sm leading-none w-5 text-center">{f.icon}</span>
                    <span className="text-xs text-foreground/80">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Free limits */}
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plano Free atual</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {FREE_LIMITS.map((f) => (
                    <p key={f} className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {f}
                    </p>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-12 font-bold rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:opacity-95 shadow-md shadow-yellow-500/15 border-0"
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                >
                  <span className="inline-flex items-center gap-2">
                    {loadingCheckout ? <Spinner /> : <Star className="h-4 w-4 fill-black" />}
                    {loadingCheckout ? 'Redirecionando...' : 'Começar 7 dias grátis'}
                  </span>
                </Button>
              </motion.div>

              <p className="text-center text-[11px] text-muted-foreground/50">
                Após o trial, R$ 9,00/mês · Cancele quando quiser
              </p>
            </>
          )}

          {/* Cancelar */}
          {isPro && subscription?.stripe_subscription_id && (
            <div className="pt-1 border-t border-border/30">
              <AnimatePresence mode="wait">
                {!cancelOpen ? (
                  <motion.button
                    key="btn"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    type="button"
                    className="text-xs text-muted-foreground/40 underline underline-offset-4 hover:text-muted-foreground w-full text-center py-2"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancelar assinatura
                  </motion.button>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"
                  >
                    <p className="text-sm font-bold text-red-400">Cancelar assinatura?</p>
                    <p className="text-xs text-muted-foreground">Você perde o acesso Pro ao fim do período. Seus dados ficam salvos.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setCancelOpen(false)}>
                        Manter Pro
                      </Button>
                      <Button variant="destructive" className="flex-1 h-10 rounded-xl"
                        onClick={() => {
                          const url = import.meta.env.VITE_STRIPE_PORTAL_URL
                          if (url) window.open(url, '_blank')
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
