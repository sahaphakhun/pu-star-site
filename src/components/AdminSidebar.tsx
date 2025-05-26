'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin/orders', label: 'คำสั่งซื้อ' },
  { href: '/admin/products', label: 'สินค้า' },
  { href: '/admin/admins', label: 'ผู้ดูแล' },
  { href: '/admin/notification', label: 'บอร์ดแคสต์' },
  // สามารถเพิ่มเมนูเพิ่มเติมได้ในอนาคต
];

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0">
      <div className="p-6 text-xl font-bold text-blue-600">Admin Panel</div>
      <nav className="px-4 space-y-2">
        {adminLinks.map(link => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar; 