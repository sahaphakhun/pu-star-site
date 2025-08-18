'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  adminOnly?: boolean;
  submenu?: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
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
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<{ siteName: string; logoUrl: string } | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // ฟังก์ชันเล่นเสียงแจ้งเตือน
  const playNotificationSound = () => {
    if (!hasUserInteracted) return;
    try {
      // ใช้ Web Audio API แทน HTML5 Audio เพื่อหลีกเลี่ยงปัญหา browser policy
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // สร้างเสียงแจ้งเตือนอย่างง่ายด้วย oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // ทำความสะอาด audioContext หลังใช้งาน
        setTimeout(() => {
          audioContext.close().catch(() => {});
        }, 500);
      }
    } catch (error) {
      // เงียบๆ ไม่แสดง error log เพื่อไม่ให้รบกวนผู้ใช้
    }
  };

  // ฟังก์ชันขอสิทธิ์ browser notification
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    // ขอเฉพาะเมื่อยังไม่ได้ตัดสินใจ (default) เท่านั้น เพื่อลดการโดนบล็อก
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // ฟังก์ชันส่ง browser notification
  const sendBrowserNotification = (title: string, body: string) => {
    if (!hasUserInteracted) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: siteInfo?.logoUrl || '/logo.jpg',
        badge: siteInfo?.logoUrl || '/logo.jpg',
        tag: 'admin-notification',
      });
    }
  };

  // ติดธงว่าผู้ใช้มี interaction แล้ว เพื่อให้เล่นเสียง/แจ้งเตือนได้ตามนโยบายเบราว์เซอร์
  useEffect(() => {
    const onFirstInteraction = () => {
      setHasUserInteracted(true);
      // ไม่ขอสิทธิ์ Notification อัตโนมัติ เพื่อลดการโดนบล็อกจากผู้ใช้เมินพรอมป์ซ้ำ
      ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt =>
        document.removeEventListener(evt, onFirstInteraction)
      );
    };
    ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt =>
      document.addEventListener(evt, onFirstInteraction, { once: true })
    );
    return () => {
      ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt =>
        document.removeEventListener(evt, onFirstInteraction)
      );
    };
  }, []);

  // โหลดข้อมูลโลโก้/ชื่อเว็บให้ใช้ใน Sidebar แอดมิน
  useEffect(() => {
    fetch('/api/admin/settings/logo', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data?.success) setSiteInfo({ siteName: data.data.siteName, logoUrl: data.data.logoUrl });
      })
      .catch(() => {});
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
            toast.success(`มีออเดอร์ใหม่ ${newOrdersCount} รายการ!`, {
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
                  toast.error(`${latestNotification.title}`, {
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
                  toast.success(`${latestNotification.title}`, {
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
    // ขอสิทธิ์เมื่อผู้ใช้กดที่ศูนย์แจ้งเตือนเป็นครั้งแรก และยังไม่เคยอนุญาต/ปฏิเสธ
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await requestNotificationPermission();
    }
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

  const toggleSubmenu = (menuLabel: string) => {
    console.log('Toggle submenu clicked:', menuLabel); // Debug log
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuLabel)) {
        newSet.delete(menuLabel);
      } else {
        newSet.add(menuLabel);
      }
      console.log('New expanded menus:', Array.from(newSet)); // Debug log
      return newSet;
    });
  };

  const isSubmenuExpanded = (menuLabel: string) => {
    const expanded = expandedMenus.has(menuLabel);
    console.log(`Is ${menuLabel} expanded:`, expanded); // Debug log
    return expanded;
  };

  // เพิ่มฟังก์ชัน debug สำหรับตรวจสอบสิทธิ์
  const debugPermissions = () => {
    console.log('=== DEBUG PERMISSIONS ===');
    console.log('isAdmin:', isAdmin);
    console.log('permissionsLoading:', permissionsLoading);
    console.log('hasPermission function:', typeof hasPermission);
    console.log('Current pathname:', pathname);
    console.log('All menu items:', allMenuItems);
    console.log('=======================');
  };

  const allMenuItems: MenuItem[] = [
    { label: 'ภาพรวม', href: '/admin', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, permission: PERMISSIONS.DASHBOARD_VIEW },
    { 
      label: 'จัดการออเดอร์', 
      href: '/admin/orders', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, 
      permission: PERMISSIONS.ORDERS_VIEW,
      submenu: [
        { label: 'จัดการออเดอร์', href: '/admin/orders', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
        { label: 'จัดการการเชื่อมโยงออเดอร์', href: '/admin/orders/mapping', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> }
      ]
    },
    { label: 'จัดการการเคลม', href: '/admin/orders/claims', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" /></svg>, permission: PERMISSIONS.ORDERS_CLAIMS_VIEW },
    { label: 'จัดการใบเสนอราคา', href: '/admin/quote-requests', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, permission: PERMISSIONS.ORDERS_VIEW },
    { label: 'ลูกค้า', href: '/admin/customers', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, permission: PERMISSIONS.CUSTOMERS_VIEW },
    { label: 'จัดการสินค้า', href: '/admin/products', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6m4 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2z" /></svg>, permission: PERMISSIONS.PRODUCTS_VIEW },
    { label: 'จัดการ SKU', href: '/admin/sku-configs', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, permission: PERMISSIONS.PRODUCTS_VIEW },
    { label: 'จัดการหมวดหมู่', href: '/admin/categories', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, permission: PERMISSIONS.PRODUCTS_VIEW },
    { label: 'จัดการภาพ', href: '/admin/images', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, permission: PERMISSIONS.PRODUCTS_VIEW },
    { label: 'จัดการสิทธิ์', href: '/admin/permissions', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, permission: PERMISSIONS.USERS_PERMISSIONS_MANAGE },
    { label: 'จัดการแอดมิน', href: '/admin/admins', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>, adminOnly: true },
    { label: 'จัดการบทความ', href: '/admin/articles', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, permission: PERMISSIONS.ARTICLES_VIEW },
    { label: 'ส่งการแจ้งเตือน', href: '/admin/notification', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>, permission: PERMISSIONS.NOTIFICATIONS_SEND },
    { label: 'ตั้งค่าทั่วไป', href: '/admin/settings', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.573 1.066c.8-.488 1.78.492 1.292 1.292a1.724 1.724 0 001.066 2.573c.921.3.921 1.603 0 1.902a1.724 1.724 0 00-1.066 2.573c.488.8-.492 1.78-1.292 1.292a1.724 1.724 0 00-2.573 1.066c-.3.921-1.603.921-1.902 0a1.724 1.724 0 00-2.573-1.066c-.8.488-1.78-.492-1.292-1.292a1.724 1.724 0 00-1.066-2.573c-.921-.3-.921-1.603 0-1.902a1.724 1.724 0 001.066-2.573c-.488-.8.492-1.78 1.292-1.292.996.608 2.296.07 2.573-1.066z" /></svg>, permission: PERMISSIONS.SETTINGS_GENERAL },
    { label: 'Catalog', href: '/admin/catalog', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h6m0-14l2-2h5a2 2 0 012 2v12a2 2 0 01-2 2h-7m0-14v14" /></svg>, permission: PERMISSIONS.SETTINGS_GENERAL },
    { label: 'Test Menu', href: '/admin/test-menu', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, adminOnly: true },
  ];

  // กรองเมนูตามสิทธิ์ของผู้ใช้
  const menuItems: MenuItem[] = allMenuItems.filter(item => {
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

  // ขยายเมนูย่อยอัตโนมัติเมื่อผู้ใช้อยู่ที่หน้าหนึ่งในเมนูย่อยนั้น
  useEffect(() => {
    const currentMenuItem = menuItems.find(item => 
      item.submenu && item.submenu.some(subItem => pathname === subItem.href)
    );
    
    if (currentMenuItem) {
      setExpandedMenus(prev => new Set([...prev, currentMenuItem.label]));
    }
  }, [pathname, menuItems]);

  // เรียกใช้ debug เมื่อ component mount และเมื่อ menuItems เปลี่ยน
  useEffect(() => {
    if (!permissionsLoading) {
      debugPermissions();
      console.log('Menu items count:', menuItems.length);
      console.log('Filtered menu items:', menuItems);
    }
  }, [permissionsLoading, isAdmin, pathname, menuItems]);

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
        <aside className="w-56 h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0">
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
                <div className="flex items-center gap-2">
                  {siteInfo?.logoUrl ? (
                    <div className="relative w-6 h-6">
                      <Image src={siteInfo.logoUrl} alt="Site Logo" fill sizes="24px" className="object-contain" />
                    </div>
                  ) : null}
                  <h1 className="text-xl font-bold text-blue-600">{siteInfo?.siteName || 'Admin Panel'}</h1>
                </div>
                
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
                  <div key={index}>
                    {item.submenu ? (
                      <div>
                        <button
                          onClick={() => toggleSubmenu(item.label)}
                          className={`flex items-center justify-between w-full px-3 py-3 text-left rounded-lg transition-colors ${
                            pathname === item.href || pathname.startsWith(item.href + '/')
                              ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <svg
                            className={`w-4 h-4 transition-transform ${isSubmenuExpanded(item.label) ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isSubmenuExpanded(item.label) && (
                          <div className="ml-6 mt-2 space-y-1">
                            {item.submenu.map((subItem, subIndex) => (
                              <Link
                                key={subIndex}
                                href={subItem.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 w-full px-3 py-2 text-left rounded-lg transition-colors text-sm ${
                                  pathname === subItem.href
                                    ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <span className="text-sm">{subItem.icon}</span>
                                <span>{subItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
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
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Mobile Notification Dropdown */}
            {showNotifications && (
              <div className="p-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 12.344l7.083 7.083c.047.047.135.103.211.103.076 0 .164-.056.211-.103l7.083-7.083a.75.75 0 000-1.061L11.25 3.602a.75.75 0 00-1.061 0L2.508 11.283a.75.75 0 000 1.061zM7 14h.01" />
            </svg>
            แจ้งเตือน
          </h3>
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
      <aside className="w-56 h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {siteInfo?.logoUrl ? (
              <div className="relative w-7 h-7">
                <Image src={siteInfo.logoUrl} alt="Site Logo" fill sizes="28px" className="object-contain" />
              </div>
            ) : null}
            <h1 className="text-xl font-bold text-blue-600">{siteInfo?.siteName || 'Admin Panel'}</h1>
          </div>
          
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
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 12.344l7.083 7.083c.047.047.135.103.211.103.076 0 .164-.056.211-.103l7.083-7.083a.75.75 0 000-1.061L11.25 3.602a.75.75 0 00-1.061 0L2.508 11.283a.75.75 0 000 1.061zM7 14h.01" />
          </svg>
          แจ้งเตือน
        </h3>
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
                        <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              ออเดอร์รอดำเนินการ
            </h4>
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
                              {order.paymentMethod === 'cod' ? (
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* การแจ้งเตือนอื่น ๆ - แสดงเฉพาะคนที่มีสิทธิ์ดูการแจ้งเตือน */}
                    {notifications.length > 0 && (isAdmin || hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) && (
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            การแจ้งเตือน
          </h4>
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
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => {
                      console.log('Menu button clicked:', item.label, item.href);
                      toggleSubmenu(item.label);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${isSubmenuExpanded(item.label) ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isSubmenuExpanded(item.label) && (
                    <ul className="ml-6 mt-2 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            href={subItem.href}
                            onClick={() => console.log('Submenu link clicked:', subItem.label, subItem.href)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                              pathname === subItem.href
                                ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-sm">{subItem.icon}</span>
                            <span>{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => console.log('Menu link clicked:', item.label, item.href)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
    </>
  );
};

export default AdminSidebar; 