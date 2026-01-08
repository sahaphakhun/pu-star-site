"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/ui/Loading';
import { useTokenManager } from '@/utils/tokenManager';

interface AdminB2BGuardProps {
  children: React.ReactNode;
}

export default function AdminB2BGuard({ children }: AdminB2BGuardProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useTokenManager();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/adminb2b/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" label="กำลังตรวจสอบการเข้าสู่ระบบ..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
