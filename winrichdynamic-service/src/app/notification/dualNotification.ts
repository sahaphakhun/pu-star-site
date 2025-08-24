import { sendSMS, sendOrderConfirmation as sendSMSOrderConfirmation, sendShippingNotification as sendSMSShippingNotification } from './sms';

/**
 * ส่งการแจ้งเตือนแบบ Dual (SMS + Messenger)
 * @param phoneNumber เบอร์โทรศัพท์
 * @param message ข้อความ
 * @returns ผลลัพธ์การส่ง
 */
export async function sendDualNotification(phoneNumber: string, message: string) {
  try {
    // ส่ง SMS
    const smsResult = await sendSMS(phoneNumber, message);
    
    // TODO: เพิ่มการส่ง Messenger เมื่อมีการเชื่อมต่อ LINE Bot
    const messengerResult = 'not_implemented';
    
    console.log(`[DualNotification] ผลลัพธ์ - SMS: ${smsResult}, Messenger: ${messengerResult}`);
    
    return {
      success: true,
      sms: smsResult,
      messenger: messengerResult
    };
  } catch (error) {
    console.error('[DualNotification] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * ส่งการแจ้งเตือนการยืนยันออเดอร์แบบ Dual
 * @param phoneNumber เบอร์โทรศัพท์
 * @param orderNumber เลขที่ออเดอร์
 * @param totalAmount ยอดรวม
 * @returns ผลลัพธ์การส่ง
 */
export async function sendDualOrderConfirmation(
  phoneNumber: string, 
  orderNumber: string, 
  totalAmount: number
) {
  try {
    // ส่ง SMS
    const smsResult = await sendSMSOrderConfirmation(phoneNumber, orderNumber, totalAmount);
    
    // TODO: เพิ่มการส่ง Messenger เมื่อมีการเชื่อมต่อ LINE Bot
    const messengerResult = 'not_implemented';
    
    console.log(`[DualNotification] ผลลัพธ์การยืนยันออเดอร์ - SMS: ${smsResult}, Messenger: ${messengerResult}`);
    
    return {
      success: true,
      sms: smsResult,
      messenger: messengerResult
    };
  } catch (error) {
    console.error('[DualNotification] Error sending order confirmation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * ส่งการแจ้งเตือนการจัดส่งแบบ Dual
 * @param phoneNumber เบอร์โทรศัพท์
 * @param orderNumber เลขที่ออเดอร์
 * @param trackingNumber เลขพัสดุ
 * @param courier บริษัทขนส่ง
 * @returns ผลลัพธ์การส่ง
 */
export async function sendDualShippingNotification(
  phoneNumber: string, 
  orderNumber: string, 
  trackingNumber: string, 
  courier: string
) {
  try {
    // ส่ง SMS
    const smsResult = await sendSMSShippingNotification(phoneNumber, orderNumber, trackingNumber, courier);
    
    // TODO: เพิ่มการส่ง Messenger เมื่อมีการเชื่อมต่อ LINE Bot
    const messengerResult = 'not_implemented';
    
    console.log(`[DualNotification] ผลลัพธ์การแจ้งเตือนการจัดส่ง - SMS: ${smsResult}, Messenger: ${messengerResult}`);
    
    return {
      success: true,
      sms: smsResult,
      messenger: messengerResult
    };
  } catch (error) {
    console.error('[DualNotification] Error sending shipping notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
