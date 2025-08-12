import React from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block border-r bg-white">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="text-base font-semibold">WinRich B2B</span>
        </div>
        <nav className="p-3 space-y-1 text-sm">
          <Link href="/admin" className="block px-3 py-2 rounded hover:bg-gray-100">แดชบอร์ด</Link>
          <Link href="/admin/customers" className="block px-3 py-2 rounded hover:bg-gray-100">ลูกค้า</Link>
          <Link href="/admin/quotations" className="block px-3 py-2 rounded hover:bg-gray-100">ใบเสนอราคา</Link>
        </nav>
      </aside>

      <main className="flex flex-col min-h-screen">
        <header className="h-14 bg-white border-b flex items-center justify-between px-4">
          <div className="lg:hidden">
            <Link href="/admin" className="text-sm font-semibold">WinRich B2B</Link>
          </div>
          <div className="text-xs text-gray-500">Customers • Quotations</div>
        </header>
        <div className="p-4 md:p-6 lg:p-8 grow bg-gray-50">{children}</div>
      </main>
    </div>
  )
}


