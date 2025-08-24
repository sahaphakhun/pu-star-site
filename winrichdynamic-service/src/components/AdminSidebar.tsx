'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  submenu?: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [siteInfo, setSiteInfo] = useState<{ siteName: string; logoUrl: string } | null>(null);

  // ปิดเมนูมือถือเมื่อมีการเปลี่ยนเส้นทาง
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // โหลดข้อมูลโลโก้/ชื่อเว็บ
  useEffect(() => {
    setSiteInfo({ 
      siteName: 'WinRich B2B Admin', 
      logoUrl: '/logo.jpg' 
    });
  }, []);

  const toggleSubmenu = (menuLabel: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuLabel)) {
        newSet.delete(menuLabel);
      } else {
        newSet.add(menuLabel);
      }
      return newSet;
    });
  };

  const isSubmenuExpanded = (menuLabel: string) => {
    return expandedMenus.has(menuLabel);
  };

  const menuItems: MenuItem[] = [
    // 1. ภาพรวมและแดชบอร์ด
    { 
      label: '📊 ภาพรวม', 
      href: '/adminb2b', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    
    // 2. การจัดการลูกค้า
    { 
      label: '👥 ลูกค้า', 
      href: '/adminb2b/customers', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    
    // 3. การจัดการใบเสนอราคา
    { 
      label: '📄 ใบเสนอราคา', 
      href: '/adminb2b/quotations', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    
    // 4. การจัดการสินค้าและคาตาล็อก
    { 
      label: '📦 สินค้าและคาตาล็อก', 
      href: '/adminb2b/products', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6m4 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2z" /></svg>,
      submenu: [
        { label: '🛍️ จัดการสินค้า', href: '/adminb2b/products', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6m4 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2z" /></svg> },
        { label: '🏷️ จัดการหมวดหมู่', href: '/adminb2b/categories', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
        { label: '🏭 ระบบจัดการคลังสินค้า (WMS)', href: '/wms', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> }
      ]
    },
    
    // 5. การจัดการออเดอร์
    { 
      label: '🛒 การจัดการออเดอร์', 
      href: '/adminb2b/orders', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    },
    
    // 6. การตั้งค่าและระบบ
    { 
      label: '⚙️ การตั้งค่าและระบบ', 
      href: '/adminb2b/settings', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.573 1.066c.8-.488 1.78.492 1.292 1.292a1.724 1.724 0 001.066 2.573c.921.3.921 1.603 0 1.902a1.724 1.724 0 00-1.066 2.573c.488.8-.492 1.78-1.292 1.292a1.724 1.724 0 00-2.573 1.066c-.3.921-1.603.921-1.902 0a1.724 1.724 0 00-2.573-1.066c-.8.488-1.78-.492-1.292-1.292a1.724 1.724 0 00-1.066-2.573c-.921-.3-.921-1.603 0-1.902a1.724 1.724 0 001.066-2.573c-.488-.8.492-1.78 1.292-1.292.996.608 2.296.07 2.573-1.066z" /></svg>,
      submenu: [
        { label: '🔧 ตั้งค่าทั่วไป', href: '/adminb2b/settings', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.573 1.066c.8-.488 1.78.492 1.292 1.292a1.724 1.724 0 001.066 2.573c.921.3.921 1.603 0 1.902a1.724 1.724 0 00-1.066 2.573c.488.8-.492 1.78-1.292 1.292a1.724 1.724 0 00-2.573 1.066c-.3.921-1.603.921-1.902 0a1.724 1.724 0 00-2.573-1.066c-.8.488-1.78-.492-1.292-1.292a1.724 1.724 0 00-1.066-2.573c-.921-.3-.921-1.603 0-1.902a1.724 1.724 0 001.066-2.573c-.488-.8.492-1.78 1.292-1.292.996.608 2.296.07 2.573-1.066z" /></svg> },
        { label: '🔐 บทบาทและสิทธิ์', href: '/adminb2b/permissions', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
        { label: '👨‍💼 จัดการแอดมิน', href: '/adminb2b/admins', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg> }
      ]
    },
  ];

  // ขยายเมนูย่อยอัตโนมัติเมื่อผู้ใช้อยู่ที่หน้าหนึ่งในเมนูย่อยนั้น
  useEffect(() => {
    const currentMenuItem = menuItems.find(item => 
      item.submenu && item.submenu.some(subItem => pathname === subItem.href)
    );
    
    if (currentMenuItem) {
      setExpandedMenus(prev => new Set([...prev, currentMenuItem.label]));
    }
  }, [pathname]);

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
            className="md:hidden fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 z-[9999] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {siteInfo?.logoUrl ? (
                  <div className="relative w-6 h-6">
                    <Image src={siteInfo.logoUrl} alt="Site Logo" fill sizes="24px" className="object-contain" />
                  </div>
                ) : null}
                <h1 className="text-xl font-bold text-blue-600">{siteInfo?.siteName || 'B2B Admin'}</h1>
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
                          type="button"
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-56 h-screen bg-white border-r border-gray-200 hidden md:block fixed top-0 left-0 z-[9999]">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {siteInfo?.logoUrl ? (
              <div className="relative w-7 h-7">
                <Image src={siteInfo.logoUrl} alt="Site Logo" fill sizes="28px" className="object-contain" />
              </div>
            ) : null}
            <h1 className="text-xl font-bold text-blue-600">{siteInfo?.siteName || 'B2B Admin'}</h1>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                {item.submenu ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(item.label)}
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
