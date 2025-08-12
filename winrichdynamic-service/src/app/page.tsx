'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            WinRich Dynamic Service
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 mb-8"
          >
            ระบบจัดการธุรกิจที่ครบครัน พร้อมเทคโนโลยีล่าสุด
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ระบบใบเสนอราคา
            </h3>
            <p className="text-gray-600">
              สร้างและจัดการใบเสนอราคาอย่างมืออาชีพ พร้อมการคำนวณราคาอัตโนมัติ
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ระบบจัดการลูกค้า
            </h3>
            <p className="text-gray-600">
              จัดการข้อมูลลูกค้า ฐานข้อมูลลูกค้า และประวัติการติดต่อ
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ระบบคลังสินค้า
            </h3>
            <p className="text-gray-600">
              ซิงค์ข้อมูลสต็อกแบบ Real-time พร้อมการจัดการสินค้าคงคลัง
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link href="/admin">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-lg font-semibold">
              เข้าสู่ระบบจัดการ
            </button>
          </Link>
          <p className="text-gray-500 mt-4">
            สำหรับผู้ดูแลระบบและพนักงานขาย
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center text-gray-500"
        >
          <p>ระบบจัดการธุรกิจ v1.0.0</p>
          <p className="text-sm mt-2">พัฒนาโดย WinRich Dynamic Service</p>
        </motion.div>
      </div>
    </div>
  )
}
