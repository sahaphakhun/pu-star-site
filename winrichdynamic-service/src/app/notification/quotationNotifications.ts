import { sendLineTextToGroup } from './line';
import { sendSMS } from './sms';

interface QuotationNotificationData {
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  totalAmount: number;
  order?: {
    id: string;
    totalAmount: number;
  };
  salesOrder?: {
    id: string;
    number: string;
  };
}

const adminGroupId = process.env.LINE_ADMIN_GROUP_ID;

/**
 * Send notification when quotation is generated from order
 */
export async function sendQuotationGeneratedNotification(data: QuotationNotificationData) {
  const message = `สร้างใบเสนอราคา ${data.quotationNumber} จากคำสั่งซื้อของ ${data.customerName} แล้ว\nยอดรวม: ฿${data.totalAmount.toLocaleString()}`;
  
  try {
    // Send LINE notification (using admin group if configured)
    if (adminGroupId) {
      await sendLineTextToGroup(adminGroupId, message);
    }
    
    // Send SMS to customer
    await sendSMS(data.customerPhone, `เรียน ${data.customerName}\n\nได้รับการสร้างใบเสนอราคา ${data.quotationNumber} จากคำสั่งซื้อของคุณ\nยอดรวม: ฿${data.totalAmount.toLocaleString()}\n\nกรุณาตรวจสอบรายละเอียดและยืนยันการสั่งซื้อ`);
    
    // TODO: Implement email notification if needed
    
    console.log(`Quotation generated notification sent for ${data.quotationNumber}`);
  } catch (error) {
    console.error('Failed to send quotation generated notification:', error);
  }
}

/**
 * Send notification when quotation is accepted by customer
 */
export async function sendQuotationAcceptedNotification(data: QuotationNotificationData) {
  const message = `ลูกค้า ${data.customerName} ยอมรับใบเสนอราคา ${data.quotationNumber}\nยอดรวม: ฿${data.totalAmount.toLocaleString()}`;
  
  try {
    // Send LINE notification to admin
    if (adminGroupId) {
      await sendLineTextToGroup(adminGroupId, message);
    }
    
    // Send confirmation to customer
    await sendSMS(data.customerPhone, `เรียน ${data.customerName}\n\nขอบคุณที่ยอมรับใบเสนอราคา ${data.quotationNumber}\nเราจะดำเนินการจัดส่งสินค้าตามเงื่อนไขที่กำหนด\nยอดรวม: ฿${data.totalAmount.toLocaleString()}`);
    
    console.log(`Quotation accepted notification sent for ${data.quotationNumber}`);
  } catch (error) {
    console.error('Failed to send quotation accepted notification:', error);
  }
}

/**
 * Send notification when quotation is converted to sales order
 */
export async function sendQuotationConvertedNotification(data: QuotationNotificationData) {
  const message = `แปลงใบเสนอราคา ${data.quotationNumber} เป็นใบสั่งขาย ${data.salesOrder?.number} แล้ว\nลูกค้า: ${data.customerName}\nยอดรวม: ฿${data.totalAmount.toLocaleString()}`;
  
  try {
    // Send LINE notification to admin
    if (adminGroupId) {
      await sendLineTextToGroup(adminGroupId, message);
    }
    
    // Send notification to customer
    await sendSMS(data.customerPhone, `เรียน ${data.customerName}\n\nใบเสนอราคา ${data.quotationNumber} ได้รับการแปลงเป็นใบสั่งขาย ${data.salesOrder?.number} แล้ว\nเรากำลังดำเนินการจัดส่งสินค้าของคุณ\nยอดรวม: ฿${data.totalAmount.toLocaleString()}`);
    
    console.log(`Quotation converted notification sent for ${data.quotationNumber}`);
  } catch (error) {
    console.error('Failed to send quotation converted notification:', error);
  }
}

/**
 * Send notification when quotation conversion fails
 */
export async function sendQuotationConversionFailedNotification(data: QuotationNotificationData, errorReason: string) {
  const message = `การแปลงใบเสนอราคา ${data.quotationNumber} เป็นใบสั่งขายล้มเหลว\nลูกค้า: ${data.customerName}\nสาเหตุ: ${errorReason}`;
  
  try {
    // Send LINE notification to admin
    if (adminGroupId) {
      await sendLineTextToGroup(adminGroupId, message);
    }
    
    console.log(`Quotation conversion failed notification sent for ${data.quotationNumber}`);
  } catch (error) {
    console.error('Failed to send quotation conversion failed notification:', error);
  }
}

/**
 * Send notification when quotation is about to expire
 */
export async function sendQuotationExpiryNotification(data: QuotationNotificationData, daysUntilExpiry: number) {
  const message = `ใบเสนอราคา ${data.quotationNumber} จะหมดอายุใน ${daysUntilExpiry} วัน\nลูกค้า: ${data.customerName}\nยอดรวม: ฿${data.totalAmount.toLocaleString()}`;
  
  try {
    // Send LINE notification to admin
    if (adminGroupId) {
      await sendLineTextToGroup(adminGroupId, message);
    }
    
    // Send reminder to customer
    await sendSMS(data.customerPhone, `เรียน ${data.customerName}\n\nใบเสนอราคา ${data.quotationNumber} ของคุณจะหมดอายุใน ${daysUntilExpiry} วัน\nยอดรวม: ฿${data.totalAmount.toLocaleString()}\n\nกรุณาติดต่อเราหากต้องการต่ออายุหรือมีข้อสงสัย`);
    
    console.log(`Quotation expiry notification sent for ${data.quotationNumber}`);
  } catch (error) {
    console.error('Failed to send quotation expiry notification:', error);
  }
}

/**
 * Send notification when quotation is rejected by customer
 */
export async function sendQuotationRejectedNotification(data: QuotationNotificationData, reason?: string) {
  const message = `ลูกค้า ${data.customerName} ปฏิเสธใบเสนอราคา ${data.quotationNumber}\nยอดรวม: ฿${data.totalAmount.toLocaleString()}${reason ? `\nสาเหตุ: ${reason}` : ''}`;
  
  try {
    // Send LINE notification to admin
    if (adminGroupId) {
      await sendLineTextToGroup(adminGroupId, message);
    }
    
    // Send confirmation to customer
    await sendSMS(data.customerPhone, `เรียน ${data.customerName}\n\nเราได้รับการปฏิเสธใบเสนอราคา ${data.quotationNumber} ของคุณ${reason ? `\nสาเหตุ: ${reason}` : ''}\n\nหากมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม กรุณาติดต่อเรา`);
    
    console.log(`Quotation rejected notification sent for ${data.quotationNumber}`);
  } catch (error) {
    console.error('Failed to send quotation rejected notification:', error);
  }
}

/**
 * Send daily summary of quotation activities
 */
export async function sendQuotationDailySummary(date: Date) {
  try {
    // This would typically fetch statistics from the database
    // For now, we'll just create a template
    
    const summaryMessage = `สรุปกิจกรรมใบเสนอราคาประจำวันที่ ${date.toLocaleDateString('th-TH')}\n\n- สร้างใหม่: X รายการ\n- ยอมรับ: X รายการ\n- ปฏิเสธ: X รายการ\n- แปลงเป็นใบสั่งขาย: X รายการ`;
    
    if (adminGroupId) {
      await sendLineTextToGroup(adminGroupId, summaryMessage);
    }
    
    console.log(`Daily quotation summary sent for ${date.toLocaleDateString('th-TH')}`);
  } catch (error) {
    console.error('Failed to send daily quotation summary:', error);
  }
}
