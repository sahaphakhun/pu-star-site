'use client';

import { Inter } from 'next/font/google';
import '../globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

function MainNavBar() {
  const pathname = usePathname();
  const { isLoggedIn, user, logout, loading } = useAuth();

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { href: '/', label: 'หน้าหลัก' },
    { href: '/articles', label: 'บทความ' },
    { href: '/contact', label: 'ติดต่อเรา' },
    { href: '/customer-service', label: 'ศูนย์ช่วยเหลือ' },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
            PU STAR
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive(href)
                    ? 'bg-white text-blue-600 font-medium shadow-md'
                    : 'text-white hover:bg-blue-500 hover:shadow-md'
                }`}
              >
                {label}
              </Link>
            ))}
            
            <Link
              href="/shop"
              className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold px-6 py-2 rounded-lg shadow-md transition-all transform hover:scale-105"
            >
              🛍️ ร้านค้า
            </Link>
            
            {!loading && (
              isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm">สวัสดี, {user?.name}</span>
                  <button
                    onClick={logout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
              )
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              href="/shop"
              className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold px-4 py-2 rounded-lg text-sm"
            >
              🛍️ ร้านค้า
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 pt-4 border-t border-blue-500">
          <div className="flex flex-wrap gap-2">
            {menuItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive(href)
                    ? 'bg-white text-blue-600 font-medium'
                    : 'text-white hover:bg-blue-500'
                }`}
              >
                {label}
              </Link>
            ))}
            {!loading && (
              isLoggedIn ? (
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  ออกจากระบบ
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-white hover:bg-gray-100 text-blue-600 px-3 py-2 rounded-lg text-sm"
                >
                  เข้าสู่ระบบ
                </Link>
              )
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function MainFooter() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">PU STAR</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              ผู้เชี่ยวชาญด้านซีลแลนท์และกาวอุตสาหกรรม 
              มีประสบการณ์กว่า 20 ปี จัดจำหน่ายสินค้าคุณภาพสูง
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">เมนูหลัก</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">หน้าหลัก</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">ร้านค้า</Link></li>
              <li><Link href="/articles" className="text-gray-300 hover:text-white transition-colors">บทความ</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">ติดต่อเรา</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">ติดต่อเรา</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>📞 02-123-4567</li>
              <li>📧 info@pustar.com</li>
              <li>📍 กรุงเทพมหานคร</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">ติดตามเรา</h4>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors">Facebook</a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">Instagram</a>
              <a href="#" className="text-gray-300 hover:text-green-400 transition-colors">Line</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} PU STAR - สงวนลิขสิทธิ์ทุกการใช้งาน
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavBar />
      <main className="flex-1 bg-gray-50">{children}</main>
      <MainFooter />
    </div>
  );
} 