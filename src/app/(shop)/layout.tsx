'use client';

import { Inter } from 'next/font/google';
import '../globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const inter = Inter({ subsets: ['latin'] });

function ShopNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const shopMenuItems = [
    { href: '/shop', label: '🛍️ ร้านค้า', icon: '🛍️' },
  ];

  const adminMenuItems = [
    { href: '/admin/products', label: '📦 จัดการสินค้า', icon: '📦' },
    { href: '/admin/orders', label: '📋 จัดการคำสั่งซื้อ', icon: '📋' },
  ];

  const handleBackToMain = () => {
    router.push('/');
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo และปุ่มกลับ */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToMain}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all transform hover:scale-105"
            >
              <span>←</span>
              <span className="hidden sm:inline">กลับหน้าหลัก</span>
            </button>
            <Link href="/shop" className="text-xl font-bold hover:text-pink-200 transition-colors">
              PU STAR SHOP
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {shopMenuItems.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isActive(href)
                    ? 'bg-white text-indigo-600 font-medium shadow-lg'
                    : 'text-white hover:bg-white/20 hover:shadow-md'
                }`}
              >
                <span>{icon}</span>
                <span>{label.replace(/🛍️\s/, '')}</span>
              </Link>
            ))}

            {/* Admin Menu (เฉพาะ Admin) */}
            {isLoggedIn && user?.role === 'admin' && (
              <>
                <div className="h-6 border-l border-white/30"></div>
                {adminMenuItems.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive(href)
                        ? 'bg-white text-indigo-600 font-medium shadow-lg'
                        : 'text-white hover:bg-white/20 hover:shadow-md'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label.replace(/📦\s|📋\s/, '')}</span>
                  </Link>
                ))}
              </>
            )}

            {/* User Section */}
            {!loading && (
              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg">
                      <span className="text-sm">👋 {user?.name}</span>
                      {user?.role === 'admin' && (
                        <span className="bg-yellow-500 text-xs px-2 py-1 rounded-full font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <button
                      onClick={logout}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-md"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="bg-white hover:bg-gray-100 text-indigo-600 px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
                  >
                    เข้าสู่ระบบ
                  </Link>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex items-center p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
              <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 pt-4 border-t border-white/30"
            >
              <div className="flex flex-col space-y-2">
                {shopMenuItems.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(href)
                        ? 'bg-white text-indigo-600 font-medium'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label.replace(/🛍️\s/, '')}</span>
                  </Link>
                ))}

                {isLoggedIn && user?.role === 'admin' && (
                  <>
                    <div className="border-t border-white/30 my-2"></div>
                    {adminMenuItems.map(({ href, label, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive(href)
                            ? 'bg-white text-indigo-600 font-medium'
                            : 'text-white hover:bg-white/20'
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{label.replace(/📦\s|📋\s/, '')}</span>
                      </Link>
                    ))}
                  </>
                )}

                <div className="border-t border-white/30 my-2"></div>
                {!loading && (
                  isLoggedIn ? (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2 px-3 py-2 bg-white/20 rounded-lg">
                        <span className="text-sm">👋 {user?.name}</span>
                        {user?.role === 'admin' && (
                          <span className="bg-yellow-500 text-xs px-2 py-1 rounded-full font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        ออกจากระบบ
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="bg-white hover:bg-gray-100 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      เข้าสู่ระบบ
                    </Link>
                  )
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ShopNavBar />
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
} 