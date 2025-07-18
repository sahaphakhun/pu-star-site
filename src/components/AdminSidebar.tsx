'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
}

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);


  // ฟังก์ชันเล่นเสียงแจ้งเตือน
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N+QQAoUXrTp66hVFApGn+DyvmwhC');
      audio.play().catch(e => console.log('Cannot play sound:', e));
    } catch (error) {
      console.log('Sound notification not available');
    }
  };

  // ฟังก์ชันขอสิทธิ์ browser notification
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // ฟังก์ชันส่ง browser notification
  const sendBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        tag: 'new-order',
      });
    }
  };

  useEffect(() => {
    // ขอสิทธิ์ notification เมื่อโหลดครั้งแรก
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch('/api/orders?status=pending');
        if (response.ok) {
          const data = await response.json();
          setPendingOrders(data);
          
          // แจ้งเตือนถ้ามีออเดอร์ใหม่ (หลังจากที่ initialized แล้ว)
          if (isInitialized && data.length > lastOrderCount && lastOrderCount >= 0) {
            const newOrdersCount = data.length - lastOrderCount;
            if (newOrdersCount > 0) {
              // เล่นเสียงแจ้งเตือน
              playNotificationSound();
              
              // แสดง toast notification
              toast.success(`🔔 มีออเดอร์ใหม่ ${newOrdersCount} รายการ!`, {
                duration: 8000,
                position: 'top-right',
                style: {
                  background: '#10B981',
                  color: 'white',
                  fontWeight: 'bold',
                },
              });
              
              // ส่ง browser notification
              sendBrowserNotification(
                'ออเดอร์ใหม่!', 
                `มีออเดอร์ใหม่ ${newOrdersCount} รายการรอดำเนินการ`
              );
            }
          }
          
          if (!isInitialized) {
            setIsInitialized(true);
          }
          
          setLastOrderCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrders();
    
    // ตั้งให้เช็คออเดอร์ใหม่ทุก 15 วินาทีเพื่อความเร็วในการแจ้งเตือน
    const interval = setInterval(fetchPendingOrders, 15000);
    
    return () => clearInterval(interval);
  }, [lastOrderCount, isInitialized]);

  const menuItems = [
    { label: 'ภาพรวม', href: '/admin', icon: '📊' },
    { label: 'จัดการออเดอร์', href: '/admin/orders', icon: '📦' },
    { label: 'ลูกค้า', href: '/admin/customers', icon: '👥' },
    { label: 'จัดการสินค้า', href: '/admin/products', icon: '🛍️' },
    { label: 'จัดการแอดมิน', href: '/admin/admins', icon: '👥' },
    { label: 'ส่งการแจ้งเตือน', href: '/admin/notification', icon: '📢' },
  ];

  const handleOrderClick = (orderId: string) => {
    router.push(`/admin/orders?highlight=${orderId}`);
    setShowNotifications(false);
  };

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
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
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
                  className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">🔔 แจ้งเตือนออเดอร์</h3>
                    <p className="text-sm text-gray-600">{pendingOrders.length} ออเดอร์รอดำเนินการ</p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {pendingOrders.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        ✅ ไม่มีออเดอร์ที่รอดำเนินการ
                      </div>
                    ) : (
                      pendingOrders.slice(0, 10).map((order) => (
                        <div
                          key={order._id}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleOrderClick(order._id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {order.customerName}
                              </p>
                              <p className="text-sm text-gray-600">
                                #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-sm text-blue-600 font-semibold">
                                ฿{order.totalAmount.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  รอดำเนินการ
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {pendingOrders.length > 10 && (
                      <div className="p-4 text-center">
                        <button
                          onClick={() => {
                            router.push('/admin/orders');
                            setShowNotifications(false);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ดูทั้งหมด ({pendingOrders.length} รายการ)
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.href === '/admin/orders' && pendingOrders.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">
            🟢 ออนไลน์ - ตรวจสอบออเดอร์ใหม่ทุก 15 วินาที
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar; 