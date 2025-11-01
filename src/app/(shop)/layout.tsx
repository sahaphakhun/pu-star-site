'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ShopLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { isLoggedIn, user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isAdminRoute = pathname?.startsWith('/admin');

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const navItems = [
    { href: '/shop', label: 'หน้าร้าน' },
    ...(isLoggedIn ? [{ href: '/profile', label: 'ข้อมูลส่วนตัว' }] : []),
    ...(isLoggedIn && user?.role === 'admin'
      ? [ { href: '/admin/orders', label: 'แอดมิน' } ]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - Full Width */}
      <AppHeader showSearch={true} />
      
      {/* Main content */}
      <main className="flex-1 bg-gray-100 pb-16 md:pb-0">
        {isAdminRoute ? (
          <div className="py-6">{children}</div>
        ) : (
          <div className="container mx-auto px-4 py-6">{children}</div>
        )}
      </main>

      {/* แถบเมนูด้านล่างสำหรับมือถือ เฉพาะฝั่งลูกค้า */}
      <MobileBottomNav hideOnPrefix={["/admin"]} />
    </div>
  );
} 