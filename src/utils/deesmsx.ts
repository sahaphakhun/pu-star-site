/**
 * ไฟล์สำหรับเชื่อมต่อกับ deeSMSx API
 * ใช้สำหรับส่ง SMS และจัดการการยืนยันตัวตนด้วย OTP
 */

// API Keys (ควรเก็บไว้ใน .env file ในการใช้งานจริง)
const API_KEY = process.env.DEESMSX_API_KEY || '092cdf3c-25a2c466-040abba8-5ff5cb9a';
const SECRET_KEY = process.env.DEESMSX_SECRET_KEY || '87fb840d-1dfdd8fe-77402037-e52a9135';
const SENDER_NAME = process.env.DEESMSX_SENDER_NAME || 'deeSMS.OTP'; // ใช้ค่า default ของ DeeSMSx

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
    console.log(`[DeeSMSx] กำลังส่ง SMS ไปที่: ${to}, sender: ${sender}, ข้อความ: ${message}`);
    
    // เตรียมข้อมูลสำหรับส่ง
    const data = {
      secretKey: SECRET_KEY,
      apiKey: API_KEY,
      to: formatPhoneNumber(to),
      sender,
      msg: message
    };

    console.log('[DeeSMSx] ข้อมูลที่ส่งไป:', JSON.stringify(data, null, 2));

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
      const errorText = await response.text();
      console.error(`[DeeSMSx] HTTP error: ${response.status}, ${errorText}`);
      throw new Error(`HTTP error: ${response.status}, ${errorText}`);
    }

    const result = await response.json();
    console.log('[DeeSMSx] ผลลัพธ์:', result);

    return result;
  } catch (error) {
    console.error('[DeeSMSx] Error sending SMS:', error);
    if (error instanceof Error) {
      console.error('[DeeSMSx] Error message:', error.message);
      console.error('[DeeSMSx] Error stack:', error.stack);
    }
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
    console.log(`[DeeSMSx] กำลังขอ OTP ไปที่: ${to}, sender: ${sender}, lang: ${lang}, isShowRef: ${isShowRef}`);
    
    // เตรียมข้อมูลสำหรับส่ง
    const formattedPhoneNumber = formatPhoneNumber(to);
    console.log(`[DeeSMSx] เบอร์โทรศัพท์หลังจากแปลง: ${formattedPhoneNumber}`);
    
    const data = {
      secretKey: SECRET_KEY,
      apiKey: API_KEY,
      to: formattedPhoneNumber,
      sender,
      lang,
      isShowRef
    };

    console.log('[DeeSMSx] ข้อมูลที่ส่งไป:', JSON.stringify(data, null, 2));

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
      const errorText = await response.text();
      console.error(`[DeeSMSx] HTTP error: ${response.status}, ${errorText}`);
      throw new Error(`HTTP error: ${response.status}, ${errorText}`);
    }

    const result = await response.json();
    console.log('[DeeSMSx] ผลลัพธ์:', result);

    // DeeSMSx บาง endpoint ส่ง field เป็น error, บาง endpoint ใช้ code
    const errorCode = result.error !== undefined ? result.error : result.code;
    if (String(errorCode) !== '0') {
      console.error(`[DeeSMSx] API error: ${errorCode}, ${result.msg}`);
      throw new Error(`DeeSMSx API Error: ${result.msg}`);
    }

    return result;
  } catch (error) {
    console.error('[DeeSMSx] Error requesting OTP:', error);
    if (error instanceof Error) {
      console.error('[DeeSMSx] Error message:', error.message);
      console.error('[DeeSMSx] Error stack:', error.stack);
    }
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
    console.log(`[DeeSMSx] กำลังยืนยัน OTP token: ${token}, pin: ${pin}`);
    
    // เตรียมข้อมูลสำหรับส่ง
    const data = {
      secretKey: SECRET_KEY,
      apiKey: API_KEY,
      token,
      pin
    };

    console.log('[DeeSMSx] ข้อมูลที่ส่งไป:', JSON.stringify(data, null, 2));

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
      const errorText = await response.text();
      console.error(`[DeeSMSx] HTTP error: ${response.status}, ${errorText}`);
      throw new Error(`HTTP error: ${response.status}, ${errorText}`);
    }

    const result = await response.json();
    console.log('[DeeSMSx] ผลลัพธ์:', result);
    
    // DeeSMSx จะส่ง status และ error เป็น '0' (string) หรือ 0 (number) เมื่อสำเร็จ
    if (String(result.status) !== '0' || String(result.error) !== '0') {
      console.error(`[DeeSMSx] API error: ${result.error || result.status}, ${result.msg}`);
      throw new Error(result.msg || 'การยืนยัน OTP ล้มเหลว');
    }
    
    return result;
  } catch (error) {
    console.error('[DeeSMSx] Error verifying OTP:', error);
    if (error instanceof Error) {
      console.error('[DeeSMSx] Error message:', error.message);
      console.error('[DeeSMSx] Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * แปลงรูปแบบเบอร์โทรศัพท์ให้เป็นรูปแบบ E.164 (66xxxxxxxxx)
 * @param phoneNumber เบอร์โทรศัพท์ที่ต้องการแปลง
 * @returns เบอร์โทรศัพท์ในรูปแบบ E.164
 */
export function formatPhoneNumber(phoneNumber: string): string {
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