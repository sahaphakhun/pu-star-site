'use client'

import Link from 'next/link'

export default function AdminB2BDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">B2B Admin</h1>
        <p className="text-gray-600 mt-1">ศูนย์ควบคุมระบบ B2B แบบมินิมอล</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/adminb2b/customers" className="block border rounded-lg p-5 bg-white hover:bg-gray-50 transition-colors">
          <div className="text-sm text-gray-500">โมดูล</div>
          <div className="mt-1 text-lg font-medium text-gray-900">ลูกค้า</div>
          <div className="mt-2 text-sm text-gray-500">เพิ่ม/แก้ไข/ค้นหา ลูกค้า</div>
        </Link>

        <Link href="/adminb2b/quotations" className="block border rounded-lg p-5 bg-white hover:bg-gray-50 transition-colors">
          <div className="text-sm text-gray-500">โมดูล</div>
          <div className="mt-1 text-lg font-medium text-gray-900">ใบเสนอราคา</div>
          <div className="mt-2 text-sm text-gray-500">สร้าง/แก้ไข/ส่ง ใบเสนอราคา</div>
        </Link>
      </div>
    </div>
  )
}


