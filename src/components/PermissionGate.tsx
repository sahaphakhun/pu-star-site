import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Component สำหรับ wrap เนื้อหาที่ต้องการสิทธิ์
 */
interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // ต้องการสิทธิ์ทุกอันใน permissions array หรือไม่
}

export function PermissionGate({ 
  permission, 
  permissions, 
  children, 
  fallback,
  requireAll = false 
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, loading, isAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  let hasAccess = false;

  if (isAdmin) {
    hasAccess = true;
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    if (requireAll) {
      hasAccess = permissions.every(p => hasPermission(p));
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
        <p className="text-red-600">คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้ กรุณาติดต่อผู้ดูแลระบบ</p>
      </div>
    );
  }

  return <>{children}</>;
} 