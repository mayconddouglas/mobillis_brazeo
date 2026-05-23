import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
)

export const STRIPE_PRICES = {
  pro_monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
}

export const PLAN_LIMITS = {
  free: {
    wallets: 1,
    incomeCategories: 3,
    expenseCategories: 3,
    monthlyTransactions: 30,
  },
}
