import type { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import MainLayout from '@/components/layout/MainLayout'

export default function AdminB2BLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      <MainLayout>
        <div className="p-4 md:p-8">{children}</div>
      </MainLayout>
    </>
  )
}
