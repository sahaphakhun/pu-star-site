'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <AuthProvider>
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
