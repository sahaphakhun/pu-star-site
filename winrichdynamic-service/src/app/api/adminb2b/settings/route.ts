import { NextRequest, NextResponse } from 'next/server';

// Mock database - ในอนาคตจะใช้ MongoDB
let settings = {
  companyName: 'WinRich Dynamic Co., Ltd.',
  companyAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  companyPhone: '+66 2 123 4567',
  companyEmail: 'info@winrich.com',
  companyTaxId: '0123456789012',
  quotationPrefix: 'QT',
  quotationValidityDays: 30,
  defaultVatRate: 7,
  defaultPaymentTerms: 'ชำระเงินภายใน 30 วัน',
  defaultDeliveryTerms: 'จัดส่งภายใน 7 วันหลังจากยืนยันออเดอร์',
  emailSettings: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: 'noreply@winrich.com',
    fromName: 'WinRich Dynamic'
  },
  notificationSettings: {
    emailNotifications: true,
    lineNotifications: false,
    lineChannelSecret: '',
    lineChannelAccessToken: ''
  }
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // อัปเดตการตั้งค่า
    settings = { ...settings, ...body };
    
    // ในอนาคตจะบันทึกลง MongoDB
    // await Settings.findOneAndUpdate({}, settings, { upsert: true });
    
    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
      data: settings
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' },
      { status: 500 }
    );
  }
}
