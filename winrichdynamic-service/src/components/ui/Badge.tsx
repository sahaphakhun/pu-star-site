import React from 'react'
import { cn } from './cn'

type Color = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

const colors: Record<Color, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
}

export default function Badge({ className, color = 'gray', children }: { className?: string; color?: Color; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex px-2 py-1 text-xs font-semibold rounded-full', colors[color], className)}>
      {children}
    </span>
  )
}


