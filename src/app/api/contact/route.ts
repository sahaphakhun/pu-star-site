import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LineNotificationGroup from '@/models/LineNotificationGroup';
import ContactForm from '@/models/ContactForm';
import { linePush } from '@/utils/line';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, subject, category, message } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await connectDB();

    // สร้างข้อความแจ้งเตือนสำหรับกลุ่มไลน์
    const lineMessage = `🔔 แจ้งเตือน: ลูกค้าต้องการติดต่อแอดมิน

👤 ชื่อ: ${name}
📧 อีเมล: ${email}
📱 เบอร์โทร: ${phone || 'ไม่ระบุ'}
🏢 บริษัท: ${company || 'ไม่ระบุ'}
📋 หัวข้อ: ${subject}
🏷️ ประเภท: ${getCategoryText(category)}
💬 ข้อความ: ${message}

⏰ เวลา: ${new Date().toLocaleString('th-TH', { 
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

📞 กรุณาติดต่อลูกค้าภายใน 24 ชั่วโมง`;

    // ส่งแจ้งเตือนไปยังกลุ่มไลน์ทั้งหมดที่เปิดใช้งาน
    const lineGroups = await LineNotificationGroup.find({ enabled: true }).lean();
    
    if (lineGroups.length > 0) {
      const notificationPromises = lineGroups.map(async (group) => {
        try {
          await linePush(group.groupId, lineMessage);
          console.log(`[Contact Form] ส่งแจ้งเตือนไปยังกลุ่มไลน์ ${group.groupId} สำเร็จ`);
        } catch (error) {
          console.error(`[Contact Form] เกิดข้อผิดพลาดในการส่งแจ้งเตือนไปยังกลุ่มไลน์ ${group.groupId}:`, error);
        }
      });

      await Promise.allSettled(notificationPromises);
    } else {
      console.log('[Contact Form] ไม่มีกลุ่มไลน์ที่เปิดใช้งานสำหรับการแจ้งเตือน');
    }

    // บันทึกข้อมูลการติดต่อลงฐานข้อมูล
    await ContactForm.create({ name, email, phone, company, subject, category, message });

    return NextResponse.json({ 
      success: true, 
      message: 'ส่งข้อความเรียบร้อยแล้ว เราจะติดต่อกลับภายใน 24 ชั่วโมง' 
    });

  } catch (error) {
    console.error('[Contact Form] เกิดข้อผิดพลาด:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

// ฟังก์ชันแปลงประเภทการติดต่อเป็นข้อความภาษาไทย
function getCategoryText(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'sales': 'สอบถามข้อมูลสินค้า/บริการ',
    'support': 'ขอรับการสนับสนุนทางเทคนิค',
    'partnership': 'ติดต่อเรื่องความร่วมมือ/ตัวแทนจำหน่าย',
    'complaint': 'แจ้งปัญหาการใช้งานสินค้า',
    'other': 'อื่นๆ'
  };
  
  return categoryMap[category] || category;
}
