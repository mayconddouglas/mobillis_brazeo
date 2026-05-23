import { Crown, Zap, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type PlanType } from '@/hooks/useSubscription'

interface PlanBadgeProps {
  plan: PlanType
  trialDaysLeft?: number
  className?: string
  /** 
   * avatar  → badge pequeno posicionado sobre a foto (absoluto, externo ao avatar)
   * inline  → badge em linha dentro de listas/rows
   * card    → badge maior dentro de cards/sheets
   */
  variant?: 'avatar' | 'inline' | 'card'
}

export function PlanBadge({ plan, trialDaysLeft = 0, className, variant = 'inline' }: PlanBadgeProps) {

  const base = 'inline-flex items-center gap-1 font-bold rounded-full whitespace-nowrap leading-none'

  const sizes = {
    avatar: 'text-[8px] px-1.5 py-0.5',
    inline: 'text-[10px] px-2 py-0.5',
    card:   'text-xs px-2.5 py-1',
  }

  const iconSizes = {
    avatar: 'h-2 w-2',
    inline: 'h-2.5 w-2.5',
    card:   'h-3 w-3',
  }

  const s = sizes[variant]
  const i = iconSizes[variant]

  if (plan === 'pro') {
    return (
      <span className={cn(base, s, 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm', className)}>
        <Crown className={i} />
        PRO
      </span>
    )
  }

  if (plan === 'trial') {
    return (
      <span className={cn(base, s, 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm', className)}>
        <FlaskConical className={i} />
        {trialDaysLeft > 0 ? `TRIAL ${trialDaysLeft}d` : 'TRIAL'}
      </span>
    )
  }

  // FREE
  return (
    <span className={cn(base, s, 'bg-muted text-muted-foreground border border-border', className)}>
      <Zap className={i} />
      FREE
    </span>
  )
}
