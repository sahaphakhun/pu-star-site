"use client"

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import MainLayout from '@/components/layout/MainLayout';
import AdminB2BGuard from '@/components/layout/AdminB2BGuard';

export default function AdminB2BLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute =
    pathname === '/adminb2b/login' ||
    pathname === '/adminb2b/register' ||
    pathname.startsWith('/adminb2b/login/') ||
    pathname.startsWith('/adminb2b/register/');

  if (isPublicRoute) {
    return (
      <>
        <Toaster position="top-right" />
        {children}
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <AdminB2BGuard>
        <MainLayout>
          {children}
        </MainLayout>
      </AdminB2BGuard>
    </>
  )
}
