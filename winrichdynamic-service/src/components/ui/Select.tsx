'use client'

import React from 'react'
import { cn } from './cn'

export default function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500', className)}
      {...props}
    >
      {children}
    </select>
  )
}


