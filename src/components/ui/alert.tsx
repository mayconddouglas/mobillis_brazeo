import * as React from 'react'
import { cn } from '@/lib/utils'
export function Alert({className,variant, ...props}: React.ComponentProps<'div'> & {variant?:'default'|'destructive'}){return <div role='alert' className={cn('w-full rounded-lg border p-4',variant==='destructive'&&'border-destructive/50 text-destructive',className)} {...props} />}
export function AlertTitle({className,...props}:React.ComponentProps<'h5'>){return <h5 className={cn('mb-1 font-medium leading-none',className)} {...props} />}
export function AlertDescription({className,...props}:React.ComponentProps<'div'>){return <div className={cn('text-sm',className)} {...props} />}
