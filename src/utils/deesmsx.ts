/**
 * ไฟล์สำหรับเชื่อมต่อกับ deeSMSx API
 * ใช้สำหรับส่ง SMS และจัดการการยืนยันตัวตนด้วย OTP
 */

// API Keys (ควรเก็บไว้ใน .env file ในการใช้งานจริง)
const API_KEY = process.env.DEESMSX_API_KEY || '092cdf3c-25a2c466-040abba8-5ff5cb9a';
const SECRET_KEY = process.env.DEESMSX_SECRET_KEY || '87fb840d-1dfdd8fe-77402037-e52a9135';
const SENDER_NAME = process.env.DEESMSX_SENDER_NAME || 'deeSMSX'; // หรือชื่อ sender ที่ได้รับอนุมัติ

// Base URL
const BASE_URL = 'https://apicall.deesmsx.com';

// interface สำหรับ response ของ DeeSMSx API
interface APIResponse {
  error: string;
  msg: string;
  status: string;
  [key: string]: unknown;
}

// interface สำหรับ response ของ DeeSMSx OTP Request
interface OTPRequestResponse extends APIResponse {
  credit_balance: number;
  result: {
    requestNo: string;
    token: string;
    ref: string;
  };
}

// interface สำหรับ response ของ DeeSMSx OTP Verify
interface OTPVerifyResponse extends APIResponse {
  result: Record<string, unknown>;
}

// interface สำหรับ response ของ DeeSMSx SMS
interface SMSResponse {
  code: string;
  status: string;
  msg: string;
  creditUsed: string;
  requestNo: string;
  credit_balance: number;
  [key: string]: unknown;
}

/**
 * ส่งข้อความ SMS ไปยังเบอร์โทรศัพท์
 * @param to เบอร์โทรศัพท์ปลายทางในรูปแบบ 66xxxxxxxxx
 * @param message ข้อความที่ต้องการส่ง
 * @param sender ชื่อผู้ส่ง (Sender Name) ที่ได้รับอนุมัติ
 * @returns ผลลัพธ์จาก API
 */
export async function sendSMS(to: string, message: string, sender: string = SENDER_NAME) {
  try {
    // เตรียมข้อมูลสำหรับส่ง
    const data = {
      secretKey: SECRET_KEY,
      apiKey: API_KEY,
      to: formatPhoneNumber(to),
      sender,
      msg: message
    };

    // ส่งคำขอไปยัง API
    const response = await fetch(`${BASE_URL}/v1/SMSWebService`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // ตรวจสอบสถานะการตอบกลับ
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * ส่งคำขอรหัส OTP ไปยังเบอร์โทรศัพท์
 * @param to เบอร์โทรศัพท์ปลายทางในรูปแบบ 66xxxxxxxxx หรือ 0xxxxxxxxx
 * @param sender ชื่อผู้ส่ง (Sender Name) ที่ได้รับอนุมัติ
 * @param lang ภาษาของข้อความ (th หรือ en)
 * @param isShowRef แสดงรหัสอ้างอิงในข้อความ SMS (0 หรือ 1)
 * @returns ผลลัพธ์จาก API รวมถึง token และ ref
 */
export async function requestOTP(
  to: string,
  sender: string = SENDER_NAME,
  lang: 'th' | 'en' = 'th',
  isShowRef: '0' | '1' = '1'
) {
  try {
    // เตรียมข้อมูลสำหรับส่ง
    const data = {
      secretKey: SECRET_KEY,
      apiKey: API_KEY,
      to: formatPhoneNumber(to),
      sender,
      lang,
      isShowRef
    };

    // ส่งคำขอไปยัง API
    const response = await fetch(`${BASE_URL}/v1/otp/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // ตรวจสอบสถานะการตอบกลับ
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
}

/**
 * ยืนยันรหัส OTP
 * @param token token ที่ได้รับจากการขอ OTP
 * @param pin รหัส OTP ที่ผู้ใช้กรอก
 * @returns ผลลัพธ์จาก API
 */
export async function verifyOTP(token: string, pin: string) {
  try {
    // เตรียมข้อมูลสำหรับส่ง
    const data = {
      secretKey: SECRET_KEY,
      apiKey: API_KEY,
      token,
      pin
    };

    // ส่งคำขอไปยัง API
    const response = await fetch(`${BASE_URL}/v1/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // ตรวจสอบสถานะการตอบกลับ
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status !== "0" || result.error !== "0") {
      throw new Error(result.msg || "การยืนยัน OTP ล้มเหลว");
    }
    
    return result;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

/**
 * แปลงรูปแบบเบอร์โทรศัพท์ให้เป็นรูปแบบ E.164 (66xxxxxxxxx)
 * @param phoneNumber เบอร์โทรศัพท์ที่ต้องการแปลง
 * @returns เบอร์โทรศัพท์ในรูปแบบ E.164
 */
function formatPhoneNumber(phoneNumber: string): string {
  // ลบช่องว่างและอักขระพิเศษ
  let cleaned = phoneNumber.replace(/\D/g, '');

  // ตรวจสอบรูปแบบและแปลง
  if (cleaned.startsWith('0')) {
    // แปลงจาก 08xxxxxxxx เป็น 668xxxxxxxx
    return '66' + cleaned.substring(1);
  } else if (cleaned.startsWith('66')) {
    // เป็นรูปแบบที่ถูกต้องแล้ว
    return cleaned;
  } else if (cleaned.length >= 9 && cleaned.length <= 10) {
    // สันนิษฐานว่าเป็นเบอร์ไทยที่ไม่มีรหัสประเทศนำหน้า
    return '66' + cleaned;
  }

  // คืนค่าเดิมหากไม่สามารถแปลงได้
  return phoneNumber;
} 