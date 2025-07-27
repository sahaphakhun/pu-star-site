import { callSendAPI } from '@/utils/messenger';
import connectDB from '@/lib/mongodb';
import MessengerUser from '@/models/MessengerUser';

/**
 * ส่งการแจ้งเตือนผ่าน Messenger ไปยังผู้ใช้ที่มีเบอร์โทรศัพท์ที่ระบุ
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของผู้ใช้ (รูปแบบ 66xxxxxxxxx หรือ 0xxxxxxxxx)
 * @param message ข้อความที่ต้องการส่ง
 * @returns Promise<boolean> - คืนค่า true หากส่งสำเร็จ, false หากล้มเหลว
 */
export async function sendMessengerNotification(phoneNumber: string, message: string): Promise<boolean> {
  try {
    await connectDB();
    
    // แปลงรูปแบบเบอร์โทรศัพท์ให้เป็นมาตรฐาน
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '66' + phoneNumber.substring(1);
    }
    
    // ค้นหา MessengerUser จากเบอร์โทรศัพท์
    const messengerUser = await MessengerUser.findOne({ phoneNumber: formattedPhone });
    
    if (!messengerUser || !messengerUser.psid) {
      console.log(`[MessengerNotification] ไม่พบ MessengerUser สำหรับเบอร์ ${phoneNumber}`);
      return false;
    }
    
    // ส่งข้อความผ่าน Messenger
    await callSendAPI(messengerUser.psid, {
      text: message,
      quick_replies: [
        { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        { content_type: 'text', title: 'ดูออเดอร์ของฉัน', payload: 'MY_ORDERS' },
      ],
    });
    
    console.log(`[MessengerNotification] ส่งแจ้งเตือนสำเร็จไปยัง psid: ${messengerUser.psid}`);
    return true;
  } catch (error) {
    console.error(`[MessengerNotification] เกิดข้อผิดพลาดในการส่งแจ้งเตือน:`, error);
    return false;
  }
}

/**
 * ส่งการแจ้งเตือนการยืนยันออเดอร์ผ่าง Messenger
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของลูกค้า
 * @param orderNumber เลขที่ออเดอร์
 * @param totalAmount ยอดรวมการสั่งซื้อ
 * @returns Promise<boolean>
 */
export async function sendMessengerOrderConfirmation(
  phoneNumber: string, 
  orderNumber: string, 
  totalAmount: number
): Promise<boolean> {
  const message = `✅ ขอบคุณที่สั่งซื้อสินค้ากับเรา!\n\n📦 ออเดอร์ #${orderNumber}\n💰 ยอดรวม ${totalAmount.toLocaleString()} บาท\n\nได้รับการยืนยันเรียบร้อยแล้ว เราจะจัดส่งสินค้าให้เร็วที่สุดค่ะ`;
  return sendMessengerNotification(phoneNumber, message);
}

/**
 * ส่งการแจ้งเตือนเมื่อจัดส่งสินค้าผ่าง Messenger
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของลูกค้า
 * @param orderNumber เลขที่ออเดอร์
 * @param trackingNumber เลขพัสดุ
 * @param courier บริษัทขนส่ง
 * @returns Promise<boolean>
 */
export async function sendMessengerShippingNotification(
  phoneNumber: string, 
  orderNumber: string, 
  trackingNumber: string, 
  courier: string
): Promise<boolean> {
  const message = `🚚 ออเดอร์ #${orderNumber} ได้จัดส่งแล้ว!\n\n📋 เลขพัสดุ: ${trackingNumber}\n🏢 บริษัทขนส่ง: ${courier}\n\nติดตามสถานะได้ที่เว็บไซต์ของบริษัทขนส่งค่ะ`;
  return sendMessengerNotification(phoneNumber, message);
}

/**
 * ส่งการแจ้งเตือนผ่าง Messenger ไปยังหลายผู้ใช้พร้อมกัน
 * 
 * @param phoneNumbers รายการเบอร์โทรศัพท์
 * @param message ข้อความที่ต้องการส่ง
 * @returns Promise<{success: number, failed: number}> - จำนวนการส่งที่สำเร็จและล้มเหลว
 */
export async function sendBulkMessengerNotification(
  phoneNumbers: string[], 
  message: string
): Promise<{success: number, failed: number}> {
  const results = await Promise.allSettled(
    phoneNumbers.map(phone => sendMessengerNotification(phone, message))
  );
  
  const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;
  
  console.log(`[MessengerNotification] ส่งแจ้งเตือนไปยัง ${phoneNumbers.length} เบอร์: สำเร็จ ${success}, ล้มเหลว ${failed}`);
  
  return { success, failed };
} 