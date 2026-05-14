import * as React from 'react'
import { cn } from '@/lib/utils'

type SheetCtxValue = { open: boolean; setOpen: (open: boolean) => void }
const SheetCtx = React.createContext<SheetCtxValue | null>(null)

export function Sheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return <SheetCtx.Provider value={{ open, setOpen }}>{children}</SheetCtx.Provider>
}

export function SheetTrigger({ children, render }: { children?: React.ReactNode; render?: React.ReactNode }) {
  const ctx = React.useContext(SheetCtx)
  const node = render ?? children
  if (!ctx || !React.isValidElement(node)) return <>{node}</>
  return React.cloneElement(node as React.ReactElement<any>, {
    onClick: () => ctx.setOpen(true),
  })
}

export function SheetContent({ children, className }: { children: React.ReactNode; className?: string; side?: string }) {
  const ctx = React.useContext(SheetCtx)
  if (!ctx?.open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/30 p-4" onClick={() => ctx.setOpen(false)}>
      <div className={cn('mx-auto mt-12 max-w-2xl rounded-lg border bg-background p-4', className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>
}
