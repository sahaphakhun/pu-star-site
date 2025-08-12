'use client'

import React from 'react'

export default function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}


