'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ShopLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { isLoggedIn, user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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
      {/* Main content with Header */}
      <main className="flex-1 bg-gray-100">
        <div className="container mx-auto px-4 py-6">
          <AppHeader showSearch={true} />
          {children}
        </div>
      </main>
    </div>
  );
} 