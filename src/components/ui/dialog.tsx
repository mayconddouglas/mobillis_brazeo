import * as React from 'react'
import { cn } from '@/lib/utils'
export function Dialog({open=true,children}:{open?:boolean;onOpenChange?:(o:boolean)=>void;children:React.ReactNode}){return open? <>{children}</>:null}
export function DialogTrigger({children}:{children:React.ReactNode}){return <>{children}</>}
export function DialogContent({className,children}:{className?:string;children:React.ReactNode}){return <div className={cn('fixed inset-0 z-50 grid place-items-center bg-black/40 p-4')}><div className={cn('w-full max-w-lg rounded-lg bg-background',className)}>{children}</div></div>}
export function DialogHeader({className,children}:{className?:string;children:React.ReactNode}){return <div className={cn('space-y-1.5',className)}>{children}</div>}
export function DialogTitle({className,children}:{className?:string;children:React.ReactNode}){return <h2 className={cn('text-lg font-semibold',className)}>{children}</h2>}
