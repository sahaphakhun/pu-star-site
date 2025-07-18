'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/shop" className="text-xl font-semibold text-blue-600">
            ร้านค้าออนไลน์
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`hover:text-blue-600 transition-colors ${
                  isActive(href) ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {label}
              </Link>
            ))}
            {!loading && (
              isLoggedIn ? (
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                >
                  ออกจากระบบ
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
              )
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden text-gray-700 focus:outline-none"
            aria-label="เปิดเมนู"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Mobile navigation */}
        {isOpen && (
          <nav className="md:hidden bg-white border-t border-gray-100">
            <ul className="flex flex-col py-2">
              {navItems.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-2 transition-colors ${
                      isActive(href) ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {!loading && (
                <li>
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-600 hover:text-red-600"
                    >
                      ออกจากระบบ
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2 text-blue-600 hover:text-blue-800"
                    >
                      เข้าสู่ระบบ
                    </Link>
                  )}
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 bg-gray-100">{children}</main>
    </div>
  );
} 