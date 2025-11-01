// Client-side permission utilities (ไม่มี MongoDB connection)

export interface UserPermissionsContext {
  permissions: string[];
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

/**
 * สร้าง context สำหรับใช้งานใน React components
 * @param permissions รายการสิทธิ์ของผู้ใช้
 * @param isAdminFlag สถานะว่าเป็นแอดมินหรือไม่
 * @returns UserPermissionsContext
 */
export function createPermissionsContext(permissions: string[], isAdminFlag: boolean): UserPermissionsContext {
  return {
    permissions,
    isAdmin: isAdminFlag,
    hasPermission: (permission: string) => {
      if (isAdminFlag) return true;
      return permissions.includes(permission);
    },
    hasAnyPermission: (permissionsToCheck: string[]) => {
      if (isAdminFlag) return true;
      return permissionsToCheck.some(permission => permissions.includes(permission));
    },
  };
} 