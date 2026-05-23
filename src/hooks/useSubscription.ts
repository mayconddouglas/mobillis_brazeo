import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type PlanType = 'free' | 'pro' | 'trial'

export interface Subscription {
  plan: PlanType
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | null
  trial_ends_at: string | null
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export function useSubscription() {
  const { user, isDemo } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || isDemo) {
      setSubscription({ plan: 'free', status: null, trial_ends_at: null, current_period_end: null, stripe_customer_id: null, stripe_subscription_id: null })
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !data) {
        setSubscription({ plan: 'free', status: null, trial_ends_at: null, current_period_end: null, stripe_customer_id: null, stripe_subscription_id: null })
      } else {
        // Check if trial is still valid
        let plan: PlanType = data.plan
        if (plan === 'trial' && data.trial_ends_at) {
          const trialEnd = new Date(data.trial_ends_at)
          if (trialEnd < new Date()) {
            plan = 'free' // trial expired
          }
        }
        setSubscription({ ...data, plan })
      }
      setLoading(false)
    }

    fetchSubscription()
  }, [user, isDemo])

  const isPro = subscription?.plan === 'pro' || subscription?.plan === 'trial'
  const isTrial = subscription?.plan === 'trial'
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const startTrial = async () => {
    if (!user) return
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: 'trial',
        status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (!error && data) {
      setSubscription({ ...data, plan: 'trial' })
    }
    return { error }
  }

  return { subscription, loading, isPro, isTrial, trialDaysLeft, startTrial }
}
