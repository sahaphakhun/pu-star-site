'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { href: '/shop', label: 'ร้านค้า' },
    { href: '/admin/products', label: 'จัดการสินค้า' },
    { href: '/admin/orders', label: 'รายการสั่งซื้อ' },
  ];

  return (
    <html lang="th">
      <body className={inter.className}>
        <header className="bg-blue-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold">
                ร้านค้าออนไลน์
              </Link>
              <nav>
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
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gray-100">{children}</main>
        <footer className="bg-gray-800 text-white py-6">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-sm">&copy; {new Date().getFullYear()} ร้านค้าออนไลน์ - สงวนลิขสิทธิ์</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
