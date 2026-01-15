"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "./cn"

type AppModalAlign = "content" | "screen"
type AppModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full"
type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
type PointerDownOutsideEvent = Parameters<NonNullable<DialogContentProps["onPointerDownOutside"]>>[0]
type FocusOutsideEvent = Parameters<NonNullable<DialogContentProps["onFocusOutside"]>>[0]
type InteractOutsideEvent = Parameters<NonNullable<DialogContentProps["onInteractOutside"]>>[0]
type OutsideEvent = PointerDownOutsideEvent | FocusOutsideEvent | InteractOutsideEvent

const sizeClasses: Record<AppModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
  full: "max-w-[92vw]",
}

const AppModal = DialogPrimitive.Root

const AppModalTrigger = DialogPrimitive.Trigger

const AppModalClose = DialogPrimitive.Close

const AppModalPortal = DialogPrimitive.Portal

const AppModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
AppModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const AppModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    align?: AppModalAlign
    size?: AppModalSize
    showClose?: boolean
  }
>(({
  className,
  children,
  align = "content",
  size = "lg",
  showClose = true,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  ...props
}, ref) => {
  const isAddressDropdownTarget = (event: OutsideEvent) => {
    const target = (event as { detail?: { originalEvent?: Event } }).detail?.originalEvent?.target ?? event.target
    return target instanceof HTMLElement && !!target.closest('[data-address-dropdown]')
  }

  const handlePointerDownOutside: DialogContentProps["onPointerDownOutside"] = (event) => {
    if (isAddressDropdownTarget(event)) {
      event.preventDefault()
    }
    onPointerDownOutside?.(event)
  }

  const handleFocusOutside: DialogContentProps["onFocusOutside"] = (event) => {
    if (isAddressDropdownTarget(event)) {
      event.preventDefault()
    }
    onFocusOutside?.(event)
  }

  const handleInteractOutside: DialogContentProps["onInteractOutside"] = (event) => {
    if (isAddressDropdownTarget(event)) {
      event.preventDefault()
    }
    onInteractOutside?.(event)
  }

  return (
    <AppModalPortal>
      <AppModalOverlay />
      <div
        className={cn(
          "fixed inset-0 z-[70] flex items-center justify-center p-4",
          align === "content" && "md:pl-[var(--admin-sidebar-width)]"
        )}
      >
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "relative w-full rounded-2xl border border-slate-200 bg-white shadow-xl outline-none",
            "max-h-[88vh] overflow-hidden",
            sizeClasses[size],
            className
          )}
          onPointerDownOutside={handlePointerDownOutside}
          onFocusOutside={handleFocusOutside}
          onInteractOutside={handleInteractOutside}
          {...props}
        >
          {children}
          {showClose ? (
            <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </div>
    </AppModalPortal>
  )
})
AppModalContent.displayName = DialogPrimitive.Content.displayName

const AppModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border-b border-slate-200 px-6 py-4",
      className
    )}
    {...props}
  />
)
AppModalHeader.displayName = "AppModalHeader"

const AppModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-slate-900", className)}
    {...props}
  />
))
AppModalTitle.displayName = DialogPrimitive.Title.displayName

const AppModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
))
AppModalDescription.displayName = DialogPrimitive.Description.displayName

const AppModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("max-h-[calc(88vh-7.5rem)] overflow-y-auto px-6 py-5", className)} {...props} />
)
AppModalBody.displayName = "AppModalBody"

const AppModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
)
AppModalFooter.displayName = "AppModalFooter"

export {
  AppModal,
  AppModalTrigger,
  AppModalClose,
  AppModalPortal,
  AppModalOverlay,
  AppModalContent,
  AppModalHeader,
  AppModalTitle,
  AppModalDescription,
  AppModalBody,
  AppModalFooter,
}
