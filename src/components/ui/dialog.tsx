import * as React from 'react'
import { cn } from '@/lib/utils'

type DialogProps = { open?: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }
const DialogCtx = React.createContext<{ onOpenChange?: (o: boolean) => void } | null>(null)

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  if (!open) return null
  return <DialogCtx.Provider value={{ onOpenChange }}>{children}</DialogCtx.Provider>
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DialogCtx)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => ctx?.onOpenChange?.(false)}>
      <div className={cn('w-full max-w-lg rounded-lg bg-background', className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('space-y-1.5', className)}>{children}</div>
}
export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
}
