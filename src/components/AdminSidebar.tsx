'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  createdAt: string;
  paymentMethod: 'cod' | 'transfer';
  status: string;
}

interface Notification {
  _id: string;
  type: 'new_order' | 'claim_request' | 'quote_request' | 'general';
  title: string;
  message: string;
  relatedId?: string;
  createdAt: string;
  isRead: boolean;
}

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, isAdmin, loading: permissionsLoading } = usePermissions();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        tag: 'admin-notification',
      });
    }
  };

  useEffect(() => {
    // ขอสิทธิ์ notification เมื่อโหลดครั้งแรก
    requestNotificationPermission();
  }, []);

  // ฟังก์ชันดึงข้อมูลออเดอร์รอดำเนินการ
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
        
        setLastOrderCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // ฟังก์ชันดึงข้อมูลการแจ้งเตือน
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications);
          
          // นับการแจ้งเตือนที่ยังไม่อ่าน
          const unreadCount = data.notifications.filter((n: Notification) => !n.isRead).length;
          
          // แจ้งเตือนถ้ามีการแจ้งเตือนใหม่
          if (isInitialized && unreadCount > lastNotificationCount && lastNotificationCount >= 0) {
            const newNotificationsCount = unreadCount - lastNotificationCount;
            if (newNotificationsCount > 0) {
              // หาการแจ้งเตือนใหม่ล่าสุด
              const latestNotification = data.notifications.find((n: Notification) => !n.isRead);
              if (latestNotification) {
                if (latestNotification.type === 'claim_request') {
                  // เล่นเสียงแจ้งเตือน
                  playNotificationSound();
                  
                  // แสดง toast notification สำหรับการเคลม
                  toast.error(`🚨 ${latestNotification.title}`, {
                    duration: 10000,
                    position: 'top-right',
                    style: {
                      background: '#EF4444',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                  });
                  
                  // ส่ง browser notification
                  sendBrowserNotification(
                    latestNotification.title,
                    latestNotification.message
                  );
                } else if (latestNotification.type === 'quote_request') {
                  // เล่นเสียงแจ้งเตือน
                  playNotificationSound();
                  
                  // แสดง toast notification สำหรับคำขอใบเสนอราคา
                  toast.success(`💼 ${latestNotification.title}`, {
                    duration: 8000,
                    position: 'top-right',
                    style: {
                      background: '#3B82F6',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                  });
                  
                  // ส่ง browser notification
                  sendBrowserNotification(
                    latestNotification.title,
                    latestNotification.message
                  );
                }
              }
            }
          }
          
          setLastNotificationCount(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    fetchNotifications();
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // ตั้งให้เช็คออเดอร์และการแจ้งเตือนใหม่ทุก 15 วินาทีเพื่อความเร็วในการแจ้งเตือน
    const interval = setInterval(() => {
      fetchPendingOrders();
      fetchNotifications();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [lastOrderCount, lastNotificationCount, isInitialized]);

  // ฟังก์ชันทำเครื่องหมายอ่านแล้ว
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        // อัพเดตสถานะในหน้าจอ
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // ทำเครื่องหมายอ่านแล้ว
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    // นำทางไปยังหน้าที่เกี่ยวข้อง
    if (notification.type === 'claim_request' && notification.relatedId) {
      router.push(`/admin/orders/claims`);
    } else if (notification.type === 'quote_request' && notification.relatedId) {
      router.push(`/admin/quote-requests?highlight=${notification.relatedId}`);
    } else if (notification.type === 'new_order' && notification.relatedId) {
      router.push(`/admin/orders?highlight=${notification.relatedId}`);
    }
    
    setShowNotifications(false);
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/admin/orders?highlight=${orderId}`);
    setShowNotifications(false);
  };

  const allMenuItems = [
    { label: 'ภาพรวม', href: '/admin', icon: '📊', permission: PERMISSIONS.DASHBOARD_VIEW },
    { label: 'จัดการออเดอร์', href: '/admin/orders', icon: '📦', permission: PERMISSIONS.ORDERS_VIEW },
    { label: 'จัดการการเคลม', href: '/admin/orders/claims', icon: '🚨', permission: PERMISSIONS.ORDERS_CLAIMS_VIEW },
    { label: 'จัดการใบเสนอราคา', href: '/admin/quote-requests', icon: '💼', permission: PERMISSIONS.ORDERS_VIEW },
    { label: 'ลูกค้า', href: '/admin/customers', icon: '👥', permission: PERMISSIONS.CUSTOMERS_VIEW },
    { label: 'จัดการสินค้า', href: '/admin/products', icon: '🛍️', permission: PERMISSIONS.PRODUCTS_VIEW },
    { label: 'จัดการหมวดหมู่', href: '/admin/categories', icon: '🏷️', permission: PERMISSIONS.PRODUCTS_VIEW },
    { label: 'จัดการสิทธิ์', href: '/admin/permissions', icon: '🔐', permission: PERMISSIONS.USERS_PERMISSIONS_MANAGE },
    { label: 'จัดการแอดมิน', href: '/admin/admins', icon: '👥', adminOnly: true },
    { label: 'ส่งการแจ้งเตือน', href: '/admin/notification', icon: '📢', permission: PERMISSIONS.NOTIFICATIONS_SEND },
  ];

  // กรองเมนูตามสิทธิ์ของผู้ใช้
  const menuItems = allMenuItems.filter(item => {
    // ถ้ากำลังโหลดสิทธิ์ อย่าแสดงเมนูใดๆ เลย
    if (permissionsLoading) return false;
    
    // ถ้าเป็นแอดมิน แสดงทุกเมนู
    if (isAdmin) return true;
    
    // ถ้าเป็นเมนูเฉพาะแอดมิน และไม่ใช่แอดมิน ไม่แสดง
    if (item.adminOnly && !isAdmin) return false;
    
    // ถ้ามี permission และผู้ใช้มีสิทธิ์นั้น ให้แสดง
    if (item.permission && hasPermission(item.permission)) return true;
    
    // ถ้าไม่มี permission กำหนด (เช่น เมนูทั่วไป) ให้แสดง
    if (!item.permission && !item.adminOnly) return true;
    
    return false;
  });

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  
  // คำนวณการแจ้งเตือนที่แสดงตามสิทธิ์
  const visiblePendingOrders = (isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) ? pendingOrders.length : 0;
  const visibleNotifications = (isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) ? unreadNotificationsCount : 0;
  const totalNotifications = visiblePendingOrders + visibleNotifications;

  // ถ้ากำลังโหลดสิทธิ์ แสดง loading state
  if (permissionsLoading) {
    return (
      <>
        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button className="bg-white p-2 rounded-lg shadow-lg border">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </button>
        </div>
        
        {/* Desktop Sidebar */}
        <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">กำลังโหลด...</p>
            </div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          {/* Notification Badge for Mobile */}
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="md:hidden fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 z-50 overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
                
                {/* Notification Bell - Mobile */}
                {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW) || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      
                      {totalNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {totalNotifications > 99 ? '99+' : totalNotifications}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Items */}
            <nav className="p-4">
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 w-full px-3 py-3 text-left rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Mobile Notification Dropdown */}
            {showNotifications && (
              <div className="p-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🔔 แจ้งเตือน</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && `ออเดอร์รอดำเนินการ: ${pendingOrders.length}`}
                    {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && ' | '}
                    {(isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && `ยังไม่อ่าน: ${unreadNotificationsCount}`}
                  </p>
                  
                  {/* Mobile Notifications List (simplified) */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingOrders.slice(0, 3).map((order) => (
                      <div
                        key={order._id}
                        onClick={() => {
                          handleOrderClick(order._id);
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-sm p-2 bg-white rounded cursor-pointer hover:bg-blue-50"
                      >
                        <p className="font-medium">ออเดอร์ #{order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-gray-600">฿{order.totalAmount.toLocaleString()}</p>
                      </div>
                    ))}
                    
                    {notifications.slice(0, 3).map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => {
                          handleNotificationClick(notification);
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-sm p-2 bg-white rounded cursor-pointer hover:bg-blue-50"
                      >
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-gray-600 truncate">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
          
          {/* Notification Bell - แสดงเฉพาะคนที่มีสิทธิ์ดูออเดอร์หรือการแจ้งเตือน */}
          {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW) || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {/* Notification Badge */}
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {totalNotifications > 99 ? '99+' : totalNotifications}
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
                  className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">🔔 แจ้งเตือน</h3>
                    <p className="text-sm text-gray-600">
                      {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && `ออเดอร์รอดำเนินการ: ${pendingOrders.length}`}
                      {(isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && ' | '}
                      {(isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && `ยังไม่อ่าน: ${unreadNotificationsCount}`}
                    </p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {/* ออเดอร์รอดำเนินการ - แสดงเฉพาะคนที่มีสิทธิ์ดูออเดอร์ */}
                    {pendingOrders.length > 0 && (isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) && (
                      <div className="p-3 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-blue-600 mb-2">📦 ออเดอร์รอดำเนินการ</h4>
                        {pendingOrders.slice(0, 5).map((order) => (
                          <div
                            key={order._id}
                            onClick={() => handleOrderClick(order._id)}
                            className="flex items-center justify-between p-2 hover:bg-blue-50 rounded cursor-pointer mb-1"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-600">
                                {order.customerName} • ฿{order.totalAmount.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-xs text-blue-600">
                              {order.paymentMethod === 'cod' ? '💰' : '🏦'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* การแจ้งเตือนอื่น ๆ - แสดงเฉพาะคนที่มีสิทธิ์ดูการแจ้งเตือน */}
                    {notifications.length > 0 && (isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && (
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-red-600 mb-2">🚨 การแจ้งเตือน</h4>
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-3 rounded cursor-pointer mb-2 transition-colors ${
                              notification.isRead
                                ? 'bg-gray-50 hover:bg-gray-100'
                                : notification.type === 'claim_request'
                                ? 'bg-red-50 hover:bg-red-100 border border-red-200'
                                : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  notification.isRead ? 'text-gray-700' : 
                                  notification.type === 'claim_request' ? 'text-red-800' : 'text-blue-800'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  notification.isRead ? 'text-gray-500' : 
                                  notification.type === 'claim_request' ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {notification.message.length > 60 
                                    ? notification.message.substring(0, 60) + '...'
                                    : notification.message
                                  }
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Bangkok'
                                  })}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className={`w-2 h-2 rounded-full ${
                                  notification.type === 'claim_request' ? 'bg-red-500' : 'bg-blue-500'
                                } ml-2 mt-1`} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {((isAdmin || hasPermission(PERMISSIONS.ORDERS_VIEW)) ? pendingOrders.length === 0 : true) && 
                     ((isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) ? notifications.length === 0 : true) && (
                      <div className="p-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
    </>
  );
};

export default AdminSidebar; 