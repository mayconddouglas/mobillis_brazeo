import { Crown, Zap, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type PlanType } from '@/hooks/useSubscription'

interface PlanBadgeProps {
  plan: PlanType
  trialDaysLeft?: number
  className?: string
  size?: 'sm' | 'md'
}

export function PlanBadge({ plan, trialDaysLeft = 0, className, size = 'sm' }: PlanBadgeProps) {
  const isSm = size === 'sm'

  if (plan === 'pro') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 font-bold rounded-full',
        'bg-gradient-to-r from-yellow-400 to-amber-500 text-black',
        isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}>
        <Crown className={isSm ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        PRO
      </span>
    )
  }

  if (plan === 'trial') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 font-bold rounded-full',
        'bg-gradient-to-r from-violet-500 to-purple-600 text-white',
        isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}>
        <FlaskConical className={isSm ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        {trialDaysLeft > 0 ? `TRIAL • ${trialDaysLeft}d` : 'TRIAL'}
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-bold rounded-full',
      'bg-muted text-muted-foreground',
      isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1',
      className
    )}>
      <Zap className={isSm ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      FREE
    </span>
  )
}
