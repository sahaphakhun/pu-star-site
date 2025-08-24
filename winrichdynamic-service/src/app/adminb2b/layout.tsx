import React from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Toaster } from 'react-hot-toast'

export default function AdminB2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden md:pl-56">
      <Toaster position="top-right" />
      <AdminSidebar />
      <main className="pt-16 md:pt-8 p-4 md:p-8 overflow-x-auto">{children}</main>
    </div>
  )
}


