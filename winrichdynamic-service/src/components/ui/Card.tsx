import React from 'react'
import { cn } from './cn'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...rest }: { className?: string; children: React.ReactNode } & DivProps) {
  return <div className={cn('bg-white border rounded-lg shadow-sm', className)} {...rest}>{children}</div>
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-4 border-b', className)}>{children}</div>
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}


