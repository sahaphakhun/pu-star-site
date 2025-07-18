import User from '@/models/User';
import Order from '@/models/Order';

/**
 * อัปเดตชื่อผู้ใช้จากออเดอร์แรก หากผู้ใช้ยังไม่ได้ตั้งชื่อ
 * @param userId - ID ของผู้ใช้
 * @param customerName - ชื่อจากออเดอร์
 * @returns Promise<boolean> - true หากอัปเดตสำเร็จ, false หากไม่ต้องอัปเดต
 */
export async function updateUserNameFromOrder(userId: string, customerName: string): Promise<boolean> {
  try {
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('ไม่พบผู้ใช้ ID:', userId);
      return false;
    }

    // ตรวจสอบว่าผู้ใช้ยังไม่ได้ตั้งชื่อ หรือชื่อเป็นค่าเริ่มต้น
    const shouldUpdateName = !user.name || 
                            user.name === 'ลูกค้า' || 
                            user.name === user.phoneNumber ||
                            user.name.trim() === '';

    if (!shouldUpdateName) {
      console.log('ผู้ใช้มีชื่อแล้ว:', user.name);
      return false;
    }

    // ตรวจสอบว่าชื่อจากออเดอร์มีค่าและไม่ใช่เบอร์โทรศัพท์
    if (!customerName || 
        customerName.trim() === '' || 
        customerName === 'ลูกค้า' ||
        /^(\+?66|0)\d{9}$/.test(customerName.trim())) {
      console.log('ชื่อจากออเดอร์ไม่เหมาะสม:', customerName);
      return false;
    }

    // อัปเดตชื่อผู้ใช้
    user.name = customerName.trim();
    await user.save();
    
    console.log(`อัปเดตชื่อผู้ใช้ ${userId} จาก "${user.name}" เป็น "${customerName}"`);
    return true;
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตชื่อผู้ใช้:', error);
    return false;
  }
}

/**
 * ตรวจสอบและอัปเดตชื่อผู้ใช้จากออเดอร์แรกของพวกเขา
 * @param userId - ID ของผู้ใช้
 * @returns Promise<boolean> - true หากอัปเดตสำเร็จ, false หากไม่ต้องอัปเดต
 */
export async function syncUserNameFromFirstOrder(userId: string): Promise<boolean> {
  try {
    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(userId);
    
    if (!user) {
      return false;
    }

    // ตรวจสอบว่าผู้ใช้ยังไม่ได้ตั้งชื่อ หรือชื่อเป็นค่าเริ่มต้น
    const shouldUpdateName = !user.name || 
                            user.name === 'ลูกค้า' || 
                            user.name === user.phoneNumber ||
                            user.name.trim() === '';

    if (!shouldUpdateName) {
      return false;
    }

    // ดึงออเดอร์แรกของผู้ใช้
    const firstOrder = await Order.findOne({ userId })
      .sort({ createdAt: 1 }) // เรียงตามวันที่สร้างจากเก่าสุด
      .lean();

    if (!firstOrder || !firstOrder.customerName) {
      return false;
    }

    // อัปเดตชื่อจากออเดอร์แรก
    return await updateUserNameFromOrder(userId, firstOrder.customerName);
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการซิงค์ชื่อผู้ใช้:', error);
    return false;
  }
}

/**
 * อัปเดตชื่อผู้ใช้ทั้งหมดที่ยังไม่ได้ตั้งชื่อจากออเดอร์แรกของพวกเขา
 * ใช้สำหรับการ migrate ข้อมูลเก่า
 * @returns Promise<{ updated: number, total: number }>
 */
export async function migrateAllUserNamesFromOrders(): Promise<{ updated: number, total: number }> {
  try {
    // ดึงผู้ใช้ทั้งหมดที่ยังไม่ได้ตั้งชื่อ
    const usersWithoutName = await User.find({
      $or: [
        { name: { $exists: false } },
        { name: '' },
        { name: 'ลูกค้า' },
        { $expr: { $eq: ['$name', '$phoneNumber'] } }
      ]
    });

    let updatedCount = 0;
    const totalUsers = usersWithoutName.length;

    console.log(`พบผู้ใช้ที่ยังไม่ได้ตั้งชื่อ ${totalUsers} คน`);

    for (const user of usersWithoutName) {
      const success = await syncUserNameFromFirstOrder(user._id.toString());
      if (success) {
        updatedCount++;
      }
    }

    console.log(`อัปเดตชื่อผู้ใช้สำเร็จ ${updatedCount} จาก ${totalUsers} คน`);
    
    return { updated: updatedCount, total: totalUsers };
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการ migrate ชื่อผู้ใช้:', error);
    return { updated: 0, total: 0 };
  }
}

/**
 * ตรวจสอบว่าชื่อเป็นค่าเริ่มต้นหรือไม่
 * @param name - ชื่อที่ต้องการตรวจสอบ
 * @param phoneNumber - เบอร์โทรศัพท์ (เพื่อเปรียบเทียบ)
 * @returns boolean - true หากเป็นชื่อเริ่มต้น
 */
export function isDefaultName(name: string, phoneNumber?: string): boolean {
  if (!name || name.trim() === '') return true;
  if (name === 'ลูกค้า') return true;
  if (phoneNumber && name === phoneNumber) return true;
  if (/^(\+?66|0)\d{9}$/.test(name.trim())) return true;
  
  return false;
}

/**
 * ตรวจสอบว่าชื่อเป็นชื่อที่ใช้ได้หรือไม่
 * @param name - ชื่อที่ต้องการตรวจสอบ
 * @returns boolean - true หากเป็นชื่อที่ใช้ได้
 */
export function isValidName(name: string): boolean {
  if (!name || name.trim() === '') return false;
  if (name === 'ลูกค้า') return false;
  if (/^(\+?66|0)\d{9}$/.test(name.trim())) return false;
  if (name.trim().length < 2) return false;
  if (name.trim().length > 50) return false;
  
  return true;
} 