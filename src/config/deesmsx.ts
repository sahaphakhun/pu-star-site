export const deeSMSxConfig = {
  apiKey: process.env.DEESMSX_API_KEY || '092cdf3c-25a2c466-040abba8-5ff5cb9a',
  secretKey: process.env.DEESMSX_SECRET_KEY || '87fb840d-1dfdd8fe-77402037-e52a9135',
  // รองรับได้ทั้ง DEESMSX_SENDER_NAME และ DEESMSX_SENDER เพื่อความยืดหยุ่นของ env
  sender: process.env.DEESMSX_SENDER_NAME || process.env.DEESMSX_SENDER || 'deeSMS.OTP',
  baseUrl: 'https://apicall.deesmsx.com',
  paths: {
    sms: '/v1/SMSWebService',
    requestOtp: '/v1/otp/request',
    verifyOtp: '/v1/otp/verify'
  }
}; 