import React from 'react';
import Link from 'next/link';

export default function WMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">ระบบจัดการคลังสินค้า (WMS)</h1>
            </div>
            
            <nav className="flex space-x-8">
              <Link href="/wms" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                ภาพรวม
              </Link>
              <Link href="/wms/inventory" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                สินค้าคงคลัง
              </Link>
              <Link href="/wms/movements" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                การเคลื่อนไหว
              </Link>
              <Link href="/wms/reports" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                รายงาน
              </Link>
            </nav>

            <div className="flex items-center">
              <Link
                href="/adminb2b"
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ← กลับไป B2B Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
