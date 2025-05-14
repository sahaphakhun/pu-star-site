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
 * ส่งคำขอ OTP ไปยัง DeeSMSx API
 * @param phoneNumber เบอร์โทรศัพท์ที่ต้องการส่ง OTP (รูปแบบ 66xxxxxxxxx)
 * @returns ข้อมูลการตอบกลับจาก API
 */
export async function requestOTP(phoneNumber: string): Promise<OTPRequestResponse> {
  try {
    const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.requestOtp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        to: phoneNumber,
        sender: deeSMSxConfig.sender,
        lang: 'th',
        isShowRef: '1'
      }),
    });

    const data = await response.json() as OTPRequestResponse;
    
    if (data.error !== '0') {
      throw new Error(`DeeSMSx API Error: ${data.msg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
}

/**
 * ตรวจสอบ OTP กับ DeeSMSx API
 * @param token token ที่ได้จากการขอ OTP
 * @param pin รหัส OTP ที่ผู้ใช้กรอก
 * @returns ข้อมูลการตอบกลับจาก API
 */
export async function verifyOTP(token: string, pin: string): Promise<OTPVerifyResponse> {
  try {
    const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.verifyOtp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        token,
        pin
      }),
    });

    const data = await response.json() as OTPVerifyResponse;
    
    if (data.status !== '0') {
      throw new Error(`DeeSMSx API Error: ${data.msg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

/**
 * ส่ง SMS ทั่วไปผ่าน DeeSMSx API
 * @param phoneNumber เบอร์โทรศัพท์ที่ต้องการส่ง SMS (รูปแบบ 66xxxxxxxxx)
 * @param message ข้อความที่ต้องการส่ง
 * @returns ข้อมูลการตอบกลับจาก API
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
  try {
    const response = await fetch(`${deeSMSxConfig.baseUrl}${deeSMSxConfig.paths.sms}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secretKey: deeSMSxConfig.secretKey,
        apiKey: deeSMSxConfig.apiKey,
        to: phoneNumber,
        sender: deeSMSxConfig.sender,
        msg: message
      }),
    });

    const data = await response.json() as SMSResponse;
    
    if (data.code !== '0') {
      throw new Error(`DeeSMSx API Error: ${data.msg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
} 