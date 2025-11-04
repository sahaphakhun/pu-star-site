import { NextRequest, NextResponse } from 'next/server';
import { 
  checkAndSendCODReminders, 
  checkAndSendCreditDueNotifications 
} from '@/app/notification/paymentNotifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    let result;

    switch (type) {
      case 'cod_reminders':
        result = await checkAndSendCODReminders();
        break;
      case 'credit_due_notifications':
        result = await checkAndSendCreditDueNotifications();
        break;
      case 'all':
        // ตรวจสอบทั้ง COD และเครดิต
        const codResult = await checkAndSendCODReminders();
        const creditResult = await checkAndSendCreditDueNotifications();
        
        result = {
          success: codResult.success && creditResult.success,
          message: `COD: ${codResult.message}, Credit: ${creditResult.message}`,
          processed: {
            cod: codResult.processed,
            credit: creditResult.processed,
            total: codResult.processed + creditResult.processed
          }
        };
        break;
      default:
        return NextResponse.json({ error: 'ประเภทการแจ้งเตือนไม่ถูกต้อง' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Payments] Error sending notifications:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' }, { status: 500 });
  }
}

// สำหรับ cron job เรียกใช้งาน
export async function GET() {
  try {
    // ตรวจสอบทั้งหมดโดยอัตโนมัติเมื่อมีการเรียก GET
    const codResult = await checkAndSendCODReminders();
    const creditResult = await checkAndSendCreditDueNotifications();
    
    const result = {
      success: codResult.success && creditResult.success,
      message: `COD: ${codResult.message}, Credit: ${creditResult.message}`,
      processed: {
        cod: codResult.processed,
        credit: creditResult.processed,
        total: codResult.processed + creditResult.processed
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Payments] Error in scheduled notifications:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือนตามกำหนดการ' }, { status: 500 });
  }
}