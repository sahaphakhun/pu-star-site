'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { startAutoCartClearScheduler } from '@/utils/scheduler';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteInfo, setSiteInfo] = useState<{ siteName: string; logoUrl: string } | null>(null);
  useEffect(() => {
    // เริ่มต้น scheduler สำหรับล้างตะกร้าอัตโนมัติ
    startAutoCartClearScheduler();
  }, []);

  useEffect(() => {
    fetch('/api/admin/settings/logo', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data?.success) setSiteInfo({ siteName: data.data.siteName, logoUrl: data.data.logoUrl });
      })
      .catch(() => {});
  }, []);

  return (
    <html lang="th">
      <head>
        <meta name="theme-color" content="#223f81" />
        <link rel="icon" href="/favicon.ico" />
        <title>{siteInfo?.siteName || 'WINRICH DYNAMIC'}</title>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-gray-100">{children}</main>
          <div className="container mx-auto px-4 py-4">
            <div className="text-center">
              <p className="text-sm">&copy; {new Date().getFullYear()} {siteInfo?.siteName || 'WINRICH DYNAMIC'} - สงวนลิขสิทธิ์</p>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
