import * as React from 'react'
import { cn } from '@/lib/utils'
const Ctx = React.createContext<any>(null)
export function Select({value,onValueChange,children}:{value?:string;onValueChange?:(v:string)=>void;children:React.ReactNode}){return <Ctx.Provider value={{value,onValueChange}}>{children}</Ctx.Provider>}
export function SelectTrigger({className,children}:{className?:string;children:React.ReactNode}){return <div className={cn('border rounded-md px-3 py-2',className)}>{children}</div>}
export function SelectValue({placeholder}:{placeholder?:string}){const c=React.useContext(Ctx);return <span>{c?.value||placeholder}</span>}
export function SelectContent({children}:{children:React.ReactNode}){return <div className='mt-2 space-y-1'>{children}</div>}
export function SelectItem({value,children}:{value:string;children:React.ReactNode}){const c=React.useContext(Ctx);return <button type='button' className='block w-full rounded border px-3 py-2 text-left' onClick={()=>c?.onValueChange?.(value)}>{children}</button>}
