import { sendSMS, sendOrderConfirmation as sendSMSOrderConfirmation, sendShippingNotification as sendSMSShippingNotification } from './sms';
import { 
  sendMessengerNotification, 
  sendMessengerOrderConfirmation, 
  sendMessengerShippingNotification,
  sendBulkMessengerNotification 
} from './messenger';

/**
 * ส่งการแจ้งเตือนผ่านทั้ง SMS และ Messenger พร้อมกัน
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของผู้รับ
 * @param message ข้อความที่ต้องการส่ง
 * @returns Promise<{sms: boolean, messenger: boolean}> - สถานะการส่งของแต่ละช่องทาง
 */
export async function sendDualNotification(
  phoneNumber: string, 
  message: string
): Promise<{sms: boolean, messenger: boolean}> {
  console.log(`[DualNotification] ส่งการแจ้งเตือนไปยัง ${phoneNumber}`);
  
  const results = await Promise.allSettled([
    sendSMS(phoneNumber, message).then(() => true).catch(() => false),
    sendMessengerNotification(phoneNumber, message)
  ]);
  
  const smsResult = results[0].status === 'fulfilled' ? results[0].value : false;
  const messengerResult = results[1].status === 'fulfilled' ? results[1].value : false;
  
  console.log(`[DualNotification] ผลลัพธ์ - SMS: ${smsResult}, Messenger: ${messengerResult}`);
  
  return {
    sms: smsResult,
    messenger: messengerResult
  };
}

/**
 * ส่งการแจ้งเตือนการยืนยันออเดอร์ผ่านทั้ง SMS และ Messenger
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของลูกค้า
 * @param orderNumber เลขที่ออเดอร์
 * @param totalAmount ยอดรวมการสั่งซื้อ
 * @returns Promise<{sms: boolean, messenger: boolean}>
 */
export async function sendDualOrderConfirmation(
  phoneNumber: string, 
  orderNumber: string, 
  totalAmount: number
): Promise<{sms: boolean, messenger: boolean}> {
  console.log(`[DualNotification] ส่งการยืนยันออเดอร์ #${orderNumber} ไปยัง ${phoneNumber}`);
  
  const results = await Promise.allSettled([
    sendSMSOrderConfirmation(phoneNumber, orderNumber, totalAmount).then(() => true).catch(() => false),
    sendMessengerOrderConfirmation(phoneNumber, orderNumber, totalAmount)
  ]);
  
  const smsResult = results[0].status === 'fulfilled' ? results[0].value : false;
  const messengerResult = results[1].status === 'fulfilled' ? results[1].value : false;
  
  console.log(`[DualNotification] ผลลัพธ์การยืนยันออเดอร์ - SMS: ${smsResult}, Messenger: ${messengerResult}`);
  
  return {
    sms: smsResult,
    messenger: messengerResult
  };
}

/**
 * ส่งการแจ้งเตือนการจัดส่งสินค้าผ่านทั้ง SMS และ Messenger
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของลูกค้า
 * @param orderNumber เลขที่ออเดอร์
 * @param trackingNumber เลขพัสดุ
 * @param courier บริษัทขนส่ง
 * @returns Promise<{sms: boolean, messenger: boolean}>
 */
export async function sendDualShippingNotification(
  phoneNumber: string, 
  orderNumber: string, 
  trackingNumber: string, 
  courier: string
): Promise<{sms: boolean, messenger: boolean}> {
  console.log(`[DualNotification] ส่งการแจ้งเตือนการจัดส่ง #${orderNumber} ไปยัง ${phoneNumber}`);
  
  const results = await Promise.allSettled([
    sendSMSShippingNotification(phoneNumber, orderNumber, trackingNumber, courier).then(() => true).catch(() => false),
    sendMessengerShippingNotification(phoneNumber, orderNumber, trackingNumber, courier)
  ]);
  
  const smsResult = results[0].status === 'fulfilled' ? results[0].value : false;
  const messengerResult = results[1].status === 'fulfilled' ? results[1].value : false;
  
  console.log(`[DualNotification] ผลลัพธ์การแจ้งเตือนการจัดส่ง - SMS: ${smsResult}, Messenger: ${messengerResult}`);
  
  return {
    sms: smsResult,
    messenger: messengerResult
  };
}

/**
 * ส่งการแจ้งเตือนไปยังหลายผู้ใช้พร้อมกันผ่านทั้ง SMS และ Messenger
 * 
 * @param phoneNumbers รายการเบอร์โทรศัพท์
 * @param message ข้อความที่ต้องการส่ง
 * @returns Promise<{sms: {success: number, failed: number}, messenger: {success: number, failed: number}}>
 */
export async function sendBulkDualNotification(
  phoneNumbers: string[], 
  message: string
): Promise<{
  sms: {success: number, failed: number}, 
  messenger: {success: number, failed: number}
}> {
  console.log(`[DualNotification] ส่งการแจ้งเตือนไปยัง ${phoneNumbers.length} เบอร์`);
  
  const [smsResults, messengerResults] = await Promise.allSettled([
    Promise.allSettled(phoneNumbers.map(phone => 
      sendSMS(phone, message).then(() => true).catch(() => false)
    )),
    sendBulkMessengerNotification(phoneNumbers, message)
  ]);
  
  // ประมวลผลผลลัพธ์ SMS
  let smsSuccess = 0;
  if (smsResults.status === 'fulfilled') {
    smsSuccess = smsResults.value.filter(r => r.status === 'fulfilled' && r.value === true).length;
  }
  const smsFailed = phoneNumbers.length - smsSuccess;
  
  // ประมวลผลผลลัพธ์ Messenger
  let messengerSuccess = 0;
  let messengerFailed = phoneNumbers.length;
  if (messengerResults.status === 'fulfilled') {
    messengerSuccess = messengerResults.value.success;
    messengerFailed = messengerResults.value.failed;
  }
  
  const result = {
    sms: { success: smsSuccess, failed: smsFailed },
    messenger: { success: messengerSuccess, failed: messengerFailed }
  };
  
  console.log(`[DualNotification] ผลลัพธ์รวม:`, result);
  
  return result;
} 