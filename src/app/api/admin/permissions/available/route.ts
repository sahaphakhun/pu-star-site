import { NextRequest, NextResponse } from 'next/server';
import { PERMISSIONS, ALL_PERMISSIONS } from '@/models/UserPermission';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// ฟังก์ชันตรวจสอบว่าเป็นแอดมินหรือไม่
async function isAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return false;
    }

    const adminPhone = request.headers.get('x-admin-phone');
    if (adminPhone) {
      await connectDB();
      const admin = await User.findOne({ phoneNumber: adminPhone, role: 'admin' });
      return !!admin;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// GET - ดูรายการสิทธิ์ทั้งหมดที่มีในระบบ
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // จัดกลุ่มสิทธิ์ตามหมวดหมู่
    const permissionGroups = {
      orders: {
        name: 'การจัดการออเดอร์',
        icon: '📦',
        permissions: [
          { key: PERMISSIONS.ORDERS_VIEW, name: 'ดูรายการออเดอร์', description: 'สามารถดูรายการออเดอร์ทั้งหมด' },
          { key: PERMISSIONS.ORDERS_CREATE, name: 'สร้างออเดอร์', description: 'สามารถสร้างออเดอร์ใหม่' },
          { key: PERMISSIONS.ORDERS_EDIT, name: 'แก้ไขออเดอร์', description: 'สามารถแก้ไขสถานะ tracking number' },
          { key: PERMISSIONS.ORDERS_DELETE, name: 'ลบออเดอร์', description: 'สามารถลบออเดอร์ได้' },
          { key: PERMISSIONS.ORDERS_EXPORT, name: 'ส่งออกข้อมูลออเดอร์', description: 'สามารถ export ข้อมูลออเดอร์เป็น CSV' },
          { key: PERMISSIONS.ORDERS_CLAIMS_VIEW, name: 'ดูการเคลม', description: 'สามารถดูรายการการเคลม' },
          { key: PERMISSIONS.ORDERS_CLAIMS_MANAGE, name: 'จัดการการเคลม', description: 'สามารถอนุมัติ/ปฏิเสธการเคลม' },
        ]
      },
      customers: {
        name: 'การจัดการลูกค้า',
        icon: '👥',
        permissions: [
          { key: PERMISSIONS.CUSTOMERS_VIEW, name: 'ดูข้อมูลลูกค้า', description: 'สามารถดูข้อมูลลูกค้าทั้งหมด' },
          { key: PERMISSIONS.CUSTOMERS_EDIT, name: 'แก้ไขข้อมูลลูกค้า', description: 'สามารถแก้ไขข้อมูลลูกค้า' },
          { key: PERMISSIONS.CUSTOMERS_ASSIGN, name: 'มอบหมายลูกค้า', description: 'สามารถมอบหมายลูกค้าให้เจ้าหน้าที่' },
          { key: PERMISSIONS.CUSTOMERS_STATS_UPDATE, name: 'อัปเดตสถิติลูกค้า', description: 'สามารถอัปเดตสถิติและประเภทลูกค้า' },
          { key: PERMISSIONS.CUSTOMERS_EXPORT, name: 'ส่งออกข้อมูลลูกค้า', description: 'สามารถ export ข้อมูลลูกค้าเป็น CSV' },
        ]
      },
      products: {
        name: 'การจัดการสินค้า',
        icon: '🛍️',
        permissions: [
          { key: PERMISSIONS.PRODUCTS_VIEW, name: 'ดูรายการสินค้า', description: 'สามารถดูรายการสินค้าทั้งหมด' },
          { key: PERMISSIONS.PRODUCTS_CREATE, name: 'เพิ่มสินค้าใหม่', description: 'สามารถเพิ่มสินค้าใหม่' },
          { key: PERMISSIONS.PRODUCTS_EDIT, name: 'แก้ไขสินค้า', description: 'สามารถแก้ไขข้อมูลสินค้า' },
          { key: PERMISSIONS.PRODUCTS_DELETE, name: 'ลบสินค้า', description: 'สามารถลบสินค้า' },
          { key: PERMISSIONS.PRODUCTS_EXPORT, name: 'ส่งออกข้อมูลสินค้า', description: 'สามารถ export ข้อมูลสินค้าเป็น CSV' },
        ]
      },
      settings: {
        name: 'การตั้งค่าระบบ',
        icon: '⚙️',
        permissions: [
          { key: PERMISSIONS.SETTINGS_GENERAL, name: 'ตั้งค่าข้อมูลร้าน', description: 'สามารถตั้งค่าชื่อร้าน โลโก้ ติดต่อ' },
          { key: PERMISSIONS.SETTINGS_PAYMENT, name: 'ตั้งค่าการชำระเงิน', description: 'สามารถตั้งค่า COD โอนเงิน QR Code' },
          { key: PERMISSIONS.SETTINGS_SHIPPING, name: 'ตั้งค่าการจัดส่ง', description: 'สามารถตั้งค่าค่าส่ง เงื่อนไขฟรี' },
          { key: PERMISSIONS.SETTINGS_NOTIFICATION, name: 'ตั้งค่าการแจ้งเตือน', description: 'สามารถตั้งค่าความถี่ SMS Email' },
          { key: PERMISSIONS.SETTINGS_SMS, name: 'ตั้งค่า SMS/OTP', description: 'สามารถตั้งค่า DeeSMSx API Templates' },
          { key: PERMISSIONS.SETTINGS_THEME, name: 'ตั้งค่าธีม/UI', description: 'สามารถตั้งค่าสี ฟอนต์ โหมดมืด' },
          { key: PERMISSIONS.SETTINGS_BACKUP, name: 'สำรองข้อมูล', description: 'สามารถ Export CSV Excel JSON' },
          { key: PERMISSIONS.SETTINGS_SCHEDULER, name: 'ตั้งค่างานอัตโนมัติ', description: 'สามารถตั้งค่าล้างตะกร้า สำรองข้อมูล' },
        ]
      },
      users: {
        name: 'การจัดการผู้ใช้',
        icon: '🔐',
        permissions: [
          { key: PERMISSIONS.USERS_VIEW, name: 'ดูรายการผู้ใช้', description: 'สามารถดูรายการผู้ใช้ทั้งหมด' },
          { key: PERMISSIONS.USERS_PERMISSIONS_MANAGE, name: 'จัดการสิทธิ์ผู้ใช้', description: 'สามารถมอบสิทธิ์และจัดการสิทธิ์ผู้ใช้' },
        ]
      },
      notifications: {
        name: 'การแจ้งเตือน',
        icon: '🔔',
        permissions: [
          { key: PERMISSIONS.NOTIFICATIONS_SEND, name: 'ส่งการแจ้งเตือน', description: 'สามารถส่งการแจ้งเตือนให้ลูกค้า' },
          { key: PERMISSIONS.NOTIFICATIONS_VIEW, name: 'ดูการแจ้งเตือน', description: 'สามารถดูประวัติการแจ้งเตือน' },
        ]
      },
      reports: {
        name: 'รายงานและข้อมูล',
        icon: '📊',
        permissions: [
          { key: PERMISSIONS.DASHBOARD_VIEW, name: 'ดูแดชบอร์ด', description: 'สามารถดูแดชบอร์ดและสถิติ' },
          { key: PERMISSIONS.REPORTS_VIEW, name: 'ดูรายงาน', description: 'สามารถดูรายงานต่างๆ' },
          { key: PERMISSIONS.DATA_EXPORT, name: 'ส่งออกข้อมูลทั้งหมด', description: 'สามารถ export ข้อมูลทั้งหมด' },
        ]
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        groups: permissionGroups,
        allPermissions: ALL_PERMISSIONS,
      },
    });

  } catch (error) {
    console.error('Error fetching available permissions:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์' },
      { status: 500 }
    );
  }
} 