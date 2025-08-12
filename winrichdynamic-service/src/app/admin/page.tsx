'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const menuItems = [
    {
      title: 'จัดการลูกค้า',
      description: 'เพิ่ม แก้ไข ลบ และค้นหาข้อมูลลูกค้า',
      icon: '👥',
      href: '/admin/customers',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'จัดการใบเสนอราคา',
      description: 'สร้าง แก้ไข และส่งใบเสนอราคา',
      icon: '📋',
      href: '/admin/quotations',
      color: 'bg-green-500 hover:bg-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ระบบจัดการธุรกิจ
          </h1>
          <p className="text-xl text-gray-600">
            จัดการลูกค้า ใบเสนอราคา และระบบอื่นๆ
          </p>
        </div>

        {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
                          <Link href={item.href} className="block group">
                            <div className="rounded-lg border bg-white p-6 shadow-sm transition-all duration-200 group-hover:shadow-md">
                              <div className="text-4xl mb-4">{item.icon}</div>
                              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                              <p className="text-gray-500">{item.description}</p>
                            </div>
                          </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            สถิติระบบ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6 text-center"
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-gray-600">ลูกค้าทั้งหมด</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg p-6 text-center"
            >
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-gray-600">ใบเสนอราคาทั้งหมด</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-6 text-center"
            >
              <div className="text-3xl font-bold text-yellow-600 mb-2">0</div>
              <div className="text-gray-600">ใบเสนอราคาที่รอการตอบกลับ</div>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            การดำเนินการด่วน
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/admin/customers">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
              >
                + เพิ่มลูกค้าใหม่
              </motion.button>
            </Link>
            
            <Link href="/admin/quotations">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
              >
                + สร้างใบเสนอราคาใหม่
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500">
          <p>ระบบจัดการธุรกิจ v1.0.0</p>
          <p className="text-sm mt-2">พัฒนาโดย WinRich Dynamic Service</p>
        </div>
      </div>
    </div>
  );
}
