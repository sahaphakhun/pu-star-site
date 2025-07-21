import { useState, useEffect } from 'react';
import { createPermissionsContext, UserPermissionsContext } from '@/lib/permissions-client';

/**
 * Hook สำหรับจัดการสิทธิ์ของผู้ใช้ใน React components
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        // ดึงข้อมูลผู้ใช้ปัจจุบันจาก API หรือ localStorage
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.user) {
            setUserPhone(userData.user.phoneNumber);
            setIsAdmin(userData.user.role === 'admin');

            // ถ้าเป็นแอดมิน ให้สิทธิ์ทุกอย่าง
            if (userData.user.role === 'admin') {
              setPermissions(['ADMIN_ALL_PERMISSIONS']);
            } else {
              // ดึงสิทธิ์เฉพาะของผู้ใช้
              const permResponse = await fetch(`/api/admin/permissions/${encodeURIComponent(userData.user.phoneNumber)}`, {
                headers: {
                  'Authorization': 'Bearer admin-token',
                  'x-admin-phone': userData.user.phoneNumber,
                },
              });

              if (permResponse.ok) {
                const permData = await permResponse.json();
                setPermissions(permData.data?.permissions || []);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  // สร้าง context object
  const permissionsContext: UserPermissionsContext = createPermissionsContext(permissions, isAdmin);

  return {
    ...permissionsContext,
    loading,
    userPhone,
  };
}

/**
 * Hook สำหรับตรวจสอบสิทธิ์เฉพาะ
 * @param requiredPermission สิทธิ์ที่ต้องการ
 * @returns { hasAccess: boolean, loading: boolean }
 */
export function useRequirePermission(requiredPermission: string) {
  const { hasPermission, loading, isAdmin } = usePermissions();

  return {
    hasAccess: isAdmin || hasPermission(requiredPermission),
    loading,
  };
}

/**
 * Hook สำหรับตรวจสอบสิทธิ์หลายอัน (อย่างน้อย 1 สิทธิ์)
 * @param requiredPermissions รายการสิทธิ์ที่ต้องการ
 * @returns { hasAccess: boolean, loading: boolean }
 */
export function useRequireAnyPermission(requiredPermissions: string[]) {
  const { hasAnyPermission, loading, isAdmin } = usePermissions();

  return {
    hasAccess: isAdmin || hasAnyPermission(requiredPermissions),
    loading,
  };
}

 