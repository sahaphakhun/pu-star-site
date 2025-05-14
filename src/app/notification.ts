/**
 * ไฟล์สำหรับจัดการการแจ้งเตือนในแอปพลิเคชัน
 */
import { sendSMS as deeSMSxSendSMS } from '@/utils/deesmsx';

/**
 * ส่ง SMS ไปยังเบอร์โทรศัพท์ของผู้ใช้
 * @param phoneNumber เบอร์โทรศัพท์ของผู้รับ (รูปแบบ 0xxxxxxxxx หรือ 66xxxxxxxxx)
 * @param message ข้อความที่ต้องการส่ง
 * @returns ผลลัพธ์การส่ง SMS
 */
export async function sendSMS(phoneNumber: string, message: string) {
  try {
    // เรียกใช้ฟังก์ชัน sendSMS จาก deesmsx.ts เพื่อส่ง SMS
    const result = await deeSMSxSendSMS(phoneNumber, message);
    
    // บันทึกประวัติการส่ง SMS ลงในฐานข้อมูลหรือทำอย่างอื่นตามต้องการ (อาจเพิ่มโค้ดส่วนนี้ในอนาคต)
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่ง SMS:', error);
    throw error;
  }
}

/**
 * ส่งการแจ้งเตือนเมื่อมีออเดอร์ใหม่ไปยังผู้ดูแลระบบ
 * @param orderData ข้อมูลออเดอร์
 * @param adminPhoneNumber เบอร์โทรศัพท์ของผู้ดูแลระบบ
 * @returns ผลลัพธ์การส่ง SMS
 */
export async function sendNewOrderNotification(orderData: any, adminPhoneNumber: string) {
  const message = `มีออเดอร์ใหม่! ลูกค้า: ${orderData.customerName} จำนวน: ฿${orderData.totalAmount.toLocaleString()} บาท วิธีชำระเงิน: ${orderData.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เก็บเงินปลายทาง'}`;
  
  return await sendSMS(adminPhoneNumber, message);
}

/**
 * ส่งการแจ้งเตือนสถานะออเดอร์ให้ลูกค้า
 * @param customerPhoneNumber เบอร์โทรศัพท์ของลูกค้า
 * @param orderId รหัสออเดอร์
 * @param status สถานะใหม่ของออเดอร์
 * @returns ผลลัพธ์การส่ง SMS
 */
export async function sendOrderStatusUpdate(customerPhoneNumber: string, orderId: string, status: string) {
  const statusText = getStatusText(status);
  const message = `อัปเดตสถานะออเดอร์ #${orderId}: ${statusText} ขอบคุณที่ใช้บริการ`;
  
  return await sendSMS(customerPhoneNumber, message);
}

/**
 * แปลงรหัสสถานะเป็นข้อความภาษาไทย
 * @param status รหัสสถานะ
 * @returns ข้อความสถานะภาษาไทย
 */
function getStatusText(status: string): string {
  const statusMap: {[key: string]: string} = {
    'pending': 'รอดำเนินการ',
    'processing': 'กำลังจัดส่ง',
    'shipped': 'จัดส่งแล้ว',
    'delivered': 'ส่งถึงแล้ว',
    'cancelled': 'ยกเลิกแล้ว'
  };
  
  return statusMap[status] || status;
} 