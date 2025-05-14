'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

function NavBar() {
  const pathname = usePathname();
  const { isLoggedIn, user, logout, loading } = useAuth();

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { href: '/shop', label: 'ร้านค้า' },
    ...(isLoggedIn && user?.role === 'admin' ? [
      { href: '/admin/products', label: 'จัดการสินค้า' },
      { href: '/admin/orders', label: 'รายการสั่งซื้อ' },
    ] : []),
    ...(isLoggedIn ? [
      { href: '/profile', label: 'โปรไฟล์' },
    ] : []),
  ];

  // ซ่อน header เฉพาะหน้า /shop และ /shop/*
  const hideHeader = pathname === '/shop' || pathname.startsWith('/shop/');

  if (hideHeader) return null;

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            ร้านค้าออนไลน์
          </Link>
          <div className="flex items-center">
            <nav className="mr-4">
              <ul className="flex space-x-1 md:space-x-4">
                {menuItems.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`px-3 py-2 rounded-lg text-sm md:text-base ${
                        isActive(href)
                          ? 'bg-white text-blue-600 font-medium'
                          : 'text-white hover:bg-blue-500'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {!loading && (
              isLoggedIn ? (
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm md:text-base"
                >
                  ออกจากระบบ
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-white hover:bg-gray-100 text-blue-600 px-3 py-1 rounded-lg text-sm md:text-base"
                >
                  เข้าสู่ระบบ
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <AuthProvider>
          <NavBar />
          <main className="min-h-screen bg-gray-100">{children}</main>
          <div className="container mx-auto px-4 py-4">
            <div className="text-center">
              <p className="text-sm">&copy; {new Date().getFullYear()} ร้านค้าออนไลน์ - สงวนลิขสิทธิ์</p>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
