'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import React, { useEffect } from 'react';
import { startAutoCartClearScheduler } from '@/utils/scheduler';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // เริ่มต้น scheduler สำหรับล้างตะกร้าอัตโนมัติ
    startAutoCartClearScheduler();
  }, []);

  return (
    <html lang="th">
      <head>
        <meta name="theme-color" content="#223f81" />
        <link rel="icon" href="/favicon.ico" />
        <title>PU STAR Shop</title>
      </head>
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
