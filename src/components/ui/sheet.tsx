"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

import { cn } from "@/lib/utils"

type SheetProps = DrawerPrimitive.Root.Props & React.HTMLAttributes<HTMLDivElement>

function Sheet({ children, ...props }: SheetProps) {
  return (
    <DrawerPrimitive.Root {...(props as DrawerPrimitive.Root.Props)}>
      {children}
    </DrawerPrimitive.Root>
  )
}

const SheetTrigger = DrawerPrimitive.Trigger

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: DrawerPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  const sideClassName =
    side === "top"
      ? "inset-x-0 top-0 border-b"
      : side === "bottom"
        ? "inset-x-0 bottom-0 border-t"
        : side === "left"
          ? "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm"
          : "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm"

  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="sheet-backdrop"
        className="fixed inset-0 z-50 bg-black/50"
      />
      <DrawerPrimitive.Viewport
        data-slot="sheet-viewport"
        className="fixed inset-0 z-50"
      >
        <DrawerPrimitive.Popup
          data-slot="sheet-content"
          data-side={side}
          className={cn(
            "fixed z-50 bg-background text-foreground shadow-lg ring-1 ring-foreground/10",
            sideClassName,
            className
          )}
          {...props}
        >
          <DrawerPrimitive.Content data-slot="sheet-inner">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription }

