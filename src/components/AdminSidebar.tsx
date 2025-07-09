'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const adminLinks = [
  { href: '/admin/orders', label: 'คำสั่งซื้อ' },
  { href: '/admin/products', label: 'สินค้า' },
  { href: '/admin/admins', label: 'ผู้ดูแล' },
  { href: '/admin/notification', label: 'บอร์ดแคสต์' },
  // สามารถเพิ่มเมนูเพิ่มเติมได้ในอนาคต
];

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch('/api/orders?status=pending');
        if (response.ok) {
          const data = await response.json();
          setPendingOrders(data);
          
          // แจ้งเตือนถ้ามีออเดอร์ใหม่
          if (data.length > lastOrderCount && lastOrderCount > 0) {
            toast.success(`มีออเดอร์ใหม่ ${data.length - lastOrderCount} รายการ!`, {
              icon: '🔔',
              duration: 5000,
            });
          }
          setLastOrderCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrders();
    
    // ตั้งให้เช็คออเดอร์ใหม่ทุก 30 วินาที
    const interval = setInterval(fetchPendingOrders, 30000);
    
    return () => clearInterval(interval);
  }, [lastOrderCount]);

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
          
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              
              {/* Notification Badge */}
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingOrders.length > 99 ? '99+' : pendingOrders.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">แจ้งเตือนออเดอร์</h3>
                    <p className="text-sm text-gray-600">{pendingOrders.length} ออเดอร์ใหม่รอดำเนินการ</p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {pendingOrders.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        ไม่มีออเดอร์ใหม่
                      </div>
                    ) : (
                      pendingOrders.map((order) => (
                        <div key={order._id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{order.customerName}</p>
                              <p className="text-sm text-gray-600">{order.customerPhone}</p>
                              <p className="text-sm font-medium text-blue-600">
                                ฿{order.totalAmount.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {pendingOrders.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <Link
                        href="/admin/orders"
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => setShowNotifications(false)}
                      >
                        ดูออเดอร์ทั้งหมด
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <nav className="px-4 space-y-2 pt-4">
        {adminLinks.map(link => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
              {link.href === '/admin/orders' && pendingOrders.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar; 