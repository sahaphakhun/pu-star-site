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
          {/* Logo / Brand - Enhanced for Mobile */}
          <Link href="/shop" className="text-xl sm:text-2xl font-bold text-blue-600 py-2">
            <span className="inline-block">
              🏗️ <span className="ml-1">WINRICH</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 ${
                  isActive(href) ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                }`}
              >
                {label}
              </Link>
            ))}
            {!loading && (
              isLoggedIn ? (
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  ออกจากระบบ
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 font-medium"
                >
                  เข้าสู่ระบบ
                </Link>
              )
            )}
          </nav>

          {/* Mobile hamburger - Enhanced */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden p-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="เปิดเมนู"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile navigation - Enhanced */}
        {isOpen && (
          <nav className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <ul className="flex flex-col py-2">
              {navItems.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-6 py-4 text-base transition-colors border-l-4 ${
                      isActive(href) 
                        ? 'text-blue-600 font-medium bg-blue-50 border-blue-600' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 border-transparent hover:border-blue-300'
                    }`}
                  >
                    <span className="flex items-center">
                      {label === 'หน้าร้าน' && '🏪'}
                      {label === 'ข้อมูลส่วนตัว' && '👤'}
                      {label === 'แอดมิน' && '⚙️'}
                      <span className="ml-2">{label}</span>
                    </span>
                  </Link>
                </li>
              ))}
              
              {/* Auth Button in Mobile Menu */}
              {!loading && (
                <li className="border-t border-gray-100 mt-2 pt-2">
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-6 py-4 text-base text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border-l-4 border-transparent hover:border-red-300"
                    >
                      <span className="flex items-center">
                        <span className="text-lg">🚪</span>
                        <span className="ml-2">ออกจากระบบ</span>
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-6 py-4 text-base text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors border-l-4 border-transparent hover:border-blue-300 font-medium"
                    >
                      <span className="flex items-center">
                        <span className="text-lg">🔑</span>
                        <span className="ml-2">เข้าสู่ระบบ</span>
                      </span>
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