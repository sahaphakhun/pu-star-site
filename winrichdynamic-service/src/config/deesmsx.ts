/**
 * การตั้งค่า DeeSMSx API
 */

export const deeSMSxConfig = {
  // API Configuration
  baseUrl: process.env.DEESMSX_BASE_URL || 'https://api.deesmsx.com',
  
  // API Keys
  apiKey: process.env.DEESMSX_API_KEY || '',
  secretKey: process.env.DEESMSX_SECRET_KEY || '',
  
  // Sender Configuration
  sender: process.env.DEESMSX_SENDER_NAME || 'deeSMS.OTP',
  
  // API Endpoints
  paths: {
    sms: '/api/sms',
    requestOtp: '/api/otp/request',
    verifyOtp: '/api/otp/verify'
  },
  
  // Default Settings
  defaultLang: 'th' as 'th' | 'en',
  defaultShowRef: '1' as '0' | '1',
  
  // Timeout Settings
  timeout: 30000, // 30 seconds
  
  // Retry Settings
  maxRetries: 3,
  retryDelay: 1000 // 1 second
};

/**
 * ตรวจสอบว่าการตั้งค่า DeeSMSx ครบถ้วนหรือไม่
 */
export function isDeeSMSxConfigured(): boolean {
  return !!(deeSMSxConfig.apiKey && deeSMSxConfig.secretKey);
}

/**
 * แสดงข้อความเตือนหากการตั้งค่าไม่ครบถ้วน
 */
export function validateDeeSMSxConfig(): void {
  if (!isDeeSMSxConfigured()) {
    console.warn('[B2B] DeeSMSx configuration is incomplete. Please check environment variables:');
    console.warn('[B2B] - DEESMSX_API_KEY');
    console.warn('[B2B] - DEESMSX_SECRET_KEY');
    console.warn('[B2B] - DEESMSX_SENDER_NAME (optional)');
    console.warn('[B2B] - DEESMSX_BASE_URL (optional)');
  }
}
