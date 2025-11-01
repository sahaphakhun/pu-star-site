import { deeSMSxConfig } from '@/config/deesmsx';

interface SMSResponse {
  code: string;
  status: string;
  msg: string;
  creditUsed: string;
  requestNo: string;
  credit_balance: number;
}

/**
 * ส่งข้อความ SMS ไปยังเบอร์โทรศัพท์ที่ระบุ
 * 
 * @param phoneNumber เบอร์โทรศัพท์ที่ต้องการส่ง (รูปแบบ 66xxxxxxxxx เช่น 66912345678)
 * @param message ข้อความที่ต้องการส่ง
 * @returns ข้อมูลการตอบกลับจาก API
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
  try {
    // ตรวจสอบรูปแบบเบอร์โทรศัพท์
    const thaiPhoneRegex = /^0\d{9}$/;  // เบอร์ไทยที่ขึ้นต้นด้วย 0 เช่น 0812345678
    const e164PhoneRegex = /^66\d{9}$/; // เบอร์ในรูปแบบ E.164 เช่น 66812345678

    // แปลงเบอร์โทรศัพท์ให้เป็นรูปแบบที่ถูกต้อง
    let formattedPhoneNumber = phoneNumber;
    if (thaiPhoneRegex.test(phoneNumber)) {
      // แปลงเบอร์ไทย 08xxxxxxxx เป็น 668xxxxxxxx
      formattedPhoneNumber = '66' + phoneNumber.substring(1);
    } else if (!e164PhoneRegex.test(phoneNumber)) {
      throw new Error('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง กรุณาใช้รูปแบบ 0xxxxxxxxx หรือ 66xxxxxxxxx');
    }

    // ส่งคำขอไปยัง DeeSMSx API
    const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.sms}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        to: formattedPhoneNumber,
        sender: deeSMSxConfig.sender,
        msg: message
      }),
    });

    const data = await response.json();
    
    if (data.code !== '0') {
      throw new Error(`DeeSMSx API Error: ${data.msg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * ส่ง SMS ไปยังหลายเบอร์โทรศัพท์พร้อมกัน
 * 
 * @param phoneNumbers รายการเบอร์โทรศัพท์ที่ต้องการส่ง (รูปแบบ 66xxxxxxxxx)
 * @param message ข้อความที่ต้องการส่ง
 * @returns ข้อมูลการตอบกลับจาก API
 */
export async function sendBulkSMS(phoneNumbers: string[], message: string): Promise<SMSResponse> {
  try {
    // ตรวจสอบและแปลงรูปแบบเบอร์โทรศัพท์
    const formattedPhoneNumbers = phoneNumbers.map(phone => {
      const thaiPhoneRegex = /^0\d{9}$/;
      if (thaiPhoneRegex.test(phone)) {
        return '66' + phone.substring(1);
      }
      return phone;
    });

    // เตรียมเบอร์โทรศัพท์ในรูปแบบที่ API ต้องการ (คั่นด้วยเครื่องหมายคอมม่า)
    const phoneNumbersString = formattedPhoneNumbers.join(',');

    // ส่งคำขอไปยัง DeeSMSx API
    const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.sms}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        to: phoneNumbersString,
        sender: deeSMSxConfig.sender,
        msg: message
      }),
    });

    const data = await response.json();
    
    if (data.code !== '0') {
      throw new Error(`DeeSMSx API Error: ${data.msg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
}

/**
 * ส่งข้อความแจ้งเตือนการสั่งซื้อสำเร็จ
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของลูกค้า
 * @param orderNumber เลขที่ออเดอร์
 * @param totalAmount ยอดรวมการสั่งซื้อ
 * @returns ข้อมูลการตอบกลับจาก API
 */
export async function sendOrderConfirmation(
  phoneNumber: string, 
  orderNumber: string, 
  totalAmount: number
): Promise<SMSResponse> {
  const message = `ขอบคุณที่สั่งซื้อสินค้ากับเรา! ออเดอร์ #${orderNumber} จำนวนเงิน ${totalAmount} บาท ได้รับการยืนยันเรียบร้อยแล้ว เราจะจัดส่งสินค้าให้เร็วที่สุด`;
  return sendSMS(phoneNumber, message);
}

/**
 * ส่งข้อความแจ้งเตือนเมื่อจัดส่งสินค้า
 * 
 * @param phoneNumber เบอร์โทรศัพท์ของลูกค้า
 * @param orderNumber เลขที่ออเดอร์
 * @param trackingNumber เลขพัสดุ
 * @param courier บริษัทขนส่ง
 * @returns ข้อมูลการตอบกลับจาก API
 */
export async function sendShippingNotification(
  phoneNumber: string, 
  orderNumber: string, 
  trackingNumber: string, 
  courier: string
): Promise<SMSResponse> {
  const message = `ออเดอร์ #${orderNumber} ได้จัดส่งแล้ว! เลขพัสดุ: ${trackingNumber} (${courier}) ติดตามสถานะได้ที่เว็บไซต์ของบริษัทขนส่ง`;
  return sendSMS(phoneNumber, message);
}
