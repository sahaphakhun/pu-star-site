import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { smtpHost, smtpPort, smtpUser, smtpPass } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูล SMTP ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ในอนาคตจะทดสอบการเชื่อมต่อ SMTP จริง
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransporter({
    //   host: smtpHost,
    //   port: smtpPort,
    //   secure: smtpPort === 465,
    //   auth: {
    //     user: smtpUser,
    //     pass: smtpPass
    //   }
    // });
    // await transporter.verify();

    // Mock การทดสอบ - จำลองการเชื่อมต่อสำเร็จ
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'การเชื่อมต่อ SMTP สำเร็จ'
    });
  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json(
      { success: false, error: 'การเชื่อมต่อ SMTP ล้มเหลว กรุณาตรวจสอบการตั้งค่า' },
      { status: 500 }
    );
  }
}
