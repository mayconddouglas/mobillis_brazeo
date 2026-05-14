import * as React from 'react'
import { cn } from '@/lib/utils'
export function Sheet({children}:{children:React.ReactNode}){return <>{children}</>}
export function SheetTrigger({children,render}:{children?:React.ReactNode;render?:React.ReactNode}){return <>{render||children}</>}
export function SheetContent({children,className}:{children:React.ReactNode;className?:string;side?:string}){return <div className={cn('mt-2 rounded-lg border bg-background p-4',className)}>{children}</div>}
export function SheetHeader({children,className}:{children:React.ReactNode;className?:string}){return <div className={className}>{children}</div>}
export function SheetTitle({children}:{children:React.ReactNode}){return <h3 className='text-lg font-semibold'>{children}</h3>}
