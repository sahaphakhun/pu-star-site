import React from 'react'
import Link from 'next/link'

export default function AdminB2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block border-r bg-white">
        <div className="h-14 flex items-center px-4 border-b">
          <Link href="/adminb2b" className="text-base font-semibold">B2B Admin</Link>
        </div>
        <nav className="p-3 space-y-1 text-sm">
          <Link href="/adminb2b" className="block px-3 py-2 rounded hover:bg-gray-100">ภาพรวม</Link>
          <Link href="/adminb2b/customers" className="block px-3 py-2 rounded hover:bg-gray-100">ลูกค้า</Link>
          <Link href="/adminb2b/quotations" className="block px-3 py-2 rounded hover:bg-gray-100">ใบเสนอราคา</Link>
          <Link href="/adminb2b/categories" className="block px-3 py-2 rounded hover:bg-gray-100">หมวดหมู่</Link>
          <Link href="/adminb2b/products" className="block px-3 py-2 rounded hover:bg-gray-100">สินค้า</Link>
          <Link href="/adminb2b/orders" className="block px-3 py-2 rounded hover:bg-gray-100">คำสั่งซื้อ</Link>
        </nav>
      </aside>

      <main className="flex flex-col min-h-screen">
        <header className="h-14 bg-white border-b flex items-center justify-between px-4">
          <div className="lg:hidden">
            <Link href="/adminb2b" className="text-sm font-semibold">B2B Admin</Link>
          </div>
          <div className="text-xs text-gray-500">มินิมอล • ใช้งานง่าย • ขยายได้</div>
        </header>
        <div className="p-4 md:p-6 lg:p-8 grow bg-gray-50">{children}</div>
      </main>
    </div>
  )
}


