import { connectDB } from '@/lib/mongodb';
import UserPermission from '@/models/UserPermission';
import User from '@/models/User';

/**
 * ตรวจสอบว่าผู้ใช้มีสิทธิ์ที่ระบุหรือไม่
 * @param phoneNumber เบอร์โทรศัพท์ของผู้ใช้
 * @param permission สิทธิ์ที่ต้องการตรวจสอบ
 * @returns Promise<boolean>
 */
export async function hasPermission(phoneNumber: string, permission: string): Promise<boolean> {
  try {
    await connectDB();
    
    // ตรวจสอบว่าเป็นแอดมินหรือไม่ (แอดมินมีสิทธิ์ทุกอย่าง)
    const user = await User.findOne({ phoneNumber });
    if (user && user.role === 'admin') {
      return true;
    }

    // ตรวจสอบสิทธิ์เฉพาะ
    return await UserPermission.hasPermission(phoneNumber, permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * ตรวจสอบว่าผู้ใช้มีสิทธิ์อย่างน้อยหนึ่งใน permissions ที่ระบุหรือไม่
 * @param phoneNumber เบอร์โทรศัพท์ของผู้ใช้
 * @param permissions รายการสิทธิ์ที่ต้องการตรวจสอบ
 * @returns Promise<boolean>
 */
export async function hasAnyPermission(phoneNumber: string, permissions: string[]): Promise<boolean> {
  try {
    await connectDB();
    
    // ตรวจสอบว่าเป็นแอดมินหรือไม่ (แอดมินมีสิทธิ์ทุกอย่าง)
    const user = await User.findOne({ phoneNumber });
    if (user && user.role === 'admin') {
      return true;
    }

    // ตรวจสอบสิทธิ์เฉพาะ
    return await UserPermission.hasAnyPermission(phoneNumber, permissions);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * ดึงรายการสิทธิ์ทั้งหมดของผู้ใช้
 * @param phoneNumber เบอร์โทรศัพท์ของผู้ใช้
 * @returns Promise<string[]>
 */
export async function getUserPermissions(phoneNumber: string): Promise<string[]> {
  try {
    await connectDB();
    
    // ตรวจสอบว่าเป็นแอดมินหรือไม่ (แอดมินมีสิทธิ์ทุกอย่าง)
    const user = await User.findOne({ phoneNumber });
    if (user && user.role === 'admin') {
      // แอดมินมีสิทธิ์ทุกอย่าง - return ค่าพิเศษ
      return ['ADMIN_ALL_PERMISSIONS'];
    }

    // ดึงสิทธิ์เฉพาะ
    return await UserPermission.getUserPermissions(phoneNumber);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * ตรวจสอบว่าผู้ใช้เป็นแอดมินหรือไม่
 * @param phoneNumber เบอร์โทรศัพท์ของผู้ใช้
 * @returns Promise<boolean>
 */
export async function isAdmin(phoneNumber: string): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findOne({ phoneNumber });
    return user && user.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * สร้าง middleware สำหรับตรวจสอบสิทธิ์ใน API routes
 * @param requiredPermissions รายการสิทธิ์ที่ต้องการ
 * @returns function สำหรับเช็คสิทธิ์
 */
export function requirePermissions(requiredPermissions: string | string[]) {
  return async (request: Request, phoneNumber: string): Promise<boolean> => {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    return await hasAnyPermission(phoneNumber, permissions);
  };
}

// Client-side permission checker (ใช้กับ React components)
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