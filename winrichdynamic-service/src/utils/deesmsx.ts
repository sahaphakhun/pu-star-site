/**
 * ไฟล์สำหรับเชื่อมต่อกับ deeSMSx API
 * ใช้สำหรับส่ง SMS และจัดการการยืนยันตัวตนด้วย OTP
 */

import { deeSMSxConfig } from '@/config/deesmsx';

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
export async function sendSMS(to: string, message: string, sender: string = deeSMSxConfig.sender) {
  if (!deeSMSxConfig.apiKey || !deeSMSxConfig.secretKey) {
    throw new Error('DeeSMSx is not configured. Please set DEESMSX_API_KEY and DEESMSX_SECRET_KEY');
  }
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= deeSMSxConfig.maxRetries; attempt++) {
    try {
      console.log(`[B2B][DeeSMSx] กำลังส่ง SMS ไปที่: ${to}, sender: ${sender}, ข้อความ: ${message} (attempt ${attempt}/${deeSMSxConfig.maxRetries})`);
      
      // เตรียมข้อมูลสำหรับส่ง
      const data = {
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        to: formatPhoneNumber(to),
        sender,
        msg: message
      };

      console.log('[B2B][DeeSMSx] ข้อมูลที่ส่งไป:', JSON.stringify(data, null, 2));

      // สร้าง AbortController สำหรับ timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), deeSMSxConfig.timeout);

      try {
        // ส่งคำขอไปยัง API
        const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.sms}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // ตรวจสอบสถานะการตอบกลับ
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[B2B][DeeSMSx] HTTP error: ${response.status}, ${errorText}`);
          throw new Error(`HTTP error: ${response.status}, ${errorText}`);
        }

        const result = await response.json();
        console.log('[B2B][DeeSMSx] ผลลัพธ์:', result);

        return result;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[B2B][DeeSMSx] Error sending SMS (attempt ${attempt}/${deeSMSxConfig.maxRetries}):`, lastError);
      
      if (error instanceof Error) {
        console.error('[B2B][DeeSMSx] Error message:', error.message);
        console.error('[B2B][DeeSMSx] Error stack:', error.stack);
      }
      
      // ถ้าเป็น attempt สุดท้ายแล้ว ให้ throw error
      if (attempt === deeSMSxConfig.maxRetries) {
        break;
      }
      
      // รอก่อนที่จะลองใหม่
      console.log(`[B2B][DeeSMSx] Retrying in ${deeSMSxConfig.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, deeSMSxConfig.retryDelay));
    }
  }
  
  // ถ้าทำทุก attempt แล้วยังไม่สำเร็จ
  console.error(`[B2B][DeeSMSx] All ${deeSMSxConfig.maxRetries} attempts failed`);
  throw lastError || new Error('Failed to send SMS after all retries');
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
  sender: string = deeSMSxConfig.sender,
  lang: 'th' | 'en' = 'th',
  isShowRef: '0' | '1' = '1'
) {
  if (!deeSMSxConfig.apiKey || !deeSMSxConfig.secretKey) {
    throw new Error('DeeSMSx is not configured. Please set DEESMSX_API_KEY and DEESMSX_SECRET_KEY');
  }
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= deeSMSxConfig.maxRetries; attempt++) {
    try {
      console.log(`[B2B][DeeSMSx] กำลังขอ OTP ไปที่: ${to}, sender: ${sender}, lang: ${lang}, isShowRef: ${isShowRef} (attempt ${attempt}/${deeSMSxConfig.maxRetries})`);
      
      // เตรียมข้อมูลสำหรับส่ง
      const formattedPhoneNumber = formatPhoneNumber(to);
      console.log(`[B2B][DeeSMSx] เบอร์โทรศัพท์หลังจากแปลง: ${formattedPhoneNumber}`);
      
      const data = {
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        to: formattedPhoneNumber,
        sender,
        lang,
        isShowRef
      };

      console.log('[B2B][DeeSMSx] ข้อมูลที่ส่งไป:', JSON.stringify(data, null, 2));

      // สร้าง AbortController สำหรับ timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), deeSMSxConfig.timeout);

      try {
        // ส่งคำขอไปยัง API
        const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.requestOtp}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // ตรวจสอบสถานะการตอบกลับ
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[B2B][DeeSMSx] HTTP error: ${response.status}, ${errorText}`);
          throw new Error(`HTTP error: ${response.status}, ${errorText}`);
        }

        const result = await response.json();
        console.log('[B2B][DeeSMSx] ผลลัพธ์:', result);

        // DeeSMSx บาง endpoint ส่ง field เป็น error, บาง endpoint ใช้ code
        const errorCode = result.error !== undefined ? result.error : result.code;
        if (String(errorCode) !== '0') {
          console.error(`[B2B][DeeSMSx] API error: ${errorCode}, ${result.msg}`);
          throw new Error(`DeeSMSx API Error: ${result.msg}`);
        }

        return result;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[B2B][DeeSMSx] Error requesting OTP (attempt ${attempt}/${deeSMSxConfig.maxRetries}):`, lastError);
      
      if (error instanceof Error) {
        console.error('[B2B][DeeSMSx] Error message:', error.message);
        console.error('[B2B][DeeSMSx] Error stack:', error.stack);
      }
      
      // ถ้าเป็น attempt สุดท้ายแล้ว ให้ throw error
      if (attempt === deeSMSxConfig.maxRetries) {
        break;
      }
      
      // รอก่อนที่จะลองใหม่
      console.log(`[B2B][DeeSMSx] Retrying in ${deeSMSxConfig.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, deeSMSxConfig.retryDelay));
    }
  }
  
  // ถ้าทำทุก attempt แล้วยังไม่สำเร็จ
  console.error(`[B2B][DeeSMSx] All ${deeSMSxConfig.maxRetries} attempts failed`);
  throw lastError || new Error('Failed to request OTP after all retries');
}

/**
 * ยืนยันรหัส OTP
 * @param token token ที่ได้รับจากการขอ OTP
 * @param pin รหัส OTP ที่ผู้ใช้กรอก
 * @returns ผลลัพธ์จาก API
 */
export async function verifyOTP(token: string, pin: string) {
  if (!deeSMSxConfig.apiKey || !deeSMSxConfig.secretKey) {
    throw new Error('DeeSMSx is not configured. Please set DEESMSX_API_KEY and DEESMSX_SECRET_KEY');
  }
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= deeSMSxConfig.maxRetries; attempt++) {
    try {
      console.log(`[B2B][DeeSMSx] กำลังยืนยัน OTP token: ${token}, pin: ${pin} (attempt ${attempt}/${deeSMSxConfig.maxRetries})`);
      
      // เตรียมข้อมูลสำหรับส่ง
      const data = {
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        token,
        pin
      };

      console.log('[B2B][DeeSMSx] ข้อมูลที่ส่งไป:', JSON.stringify(data, null, 2));

      // สร้าง AbortController สำหรับ timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), deeSMSxConfig.timeout);

      try {
        // ส่งคำขอไปยัง API
        const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.verifyOtp}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // ตรวจสอบสถานะการตอบกลับ
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[B2B][DeeSMSx] HTTP error: ${response.status}, ${errorText}`);
          throw new Error(`HTTP error: ${response.status}, ${errorText}`);
        }

        const result = await response.json();
        console.log('[B2B][DeeSMSx] ผลลัพธ์:', result);
        
        // -----------------------------
        // ปรับปรุงเงื่อนไขตรวจสอบความสำเร็จ
        // DeeSMSx อาจส่งกลับ field ต่างกันไปตาม endpoint เช่น
        //   { code: '0', status: '200', msg: 'Verify Success', ... }
        //   { error: '0', status: '0', msg: 'Success', ... }
        //   { status: '0', msg: 'Success', ... }
        // โดยทั่วไป "0" หมายถึงสำเร็จ
        // -----------------------------
        const statusCode = String(result.status);
        const codeField   = result.code   !== undefined ? String(result.code)   : undefined;
        const errorField  = result.error  !== undefined ? String(result.error)  : undefined;

        const isSuccess = (
          // กรณีมี code และเท่ากับ 0
          (codeField === '0') ||
          // หรือ error (ในบาง endpointใช้ field error แทน code)
          (errorField === '0') ||
          // หรือ status เป็น 0 หรือ 200 (API บางตัว)
          statusCode === '0' || statusCode === '200'
        );

        if (!isSuccess) {
          console.error(`[B2B][DeeSMSx] API error: ${errorField ?? codeField ?? statusCode}, ${result.msg}`);
          throw new Error(result.msg || 'การยืนยัน OTP ล้มเหลว');
        }
        
        return result;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[B2B][DeeSMSx] Error verifying OTP (attempt ${attempt}/${deeSMSxConfig.maxRetries}):`, lastError);
      
      if (error instanceof Error) {
        console.error('[B2B][DeeSMSx] Error message:', error.message);
        console.error('[B2B][DeeSMSx] Error stack:', error.stack);
      }
      
      // ถ้าเป็น attempt สุดท้ายแล้ว ให้ throw error
      if (attempt === deeSMSxConfig.maxRetries) {
        break;
      }
      
      // รอก่อนที่จะลองใหม่
      console.log(`[B2B][DeeSMSx] Retrying in ${deeSMSxConfig.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, deeSMSxConfig.retryDelay));
    }
  }
  
  // ถ้าทำทุก attempt แล้วยังไม่สำเร็จ
  console.error(`[B2B][DeeSMSx] All ${deeSMSxConfig.maxRetries} attempts failed`);
  throw lastError || new Error('Failed to verify OTP after all retries');
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
