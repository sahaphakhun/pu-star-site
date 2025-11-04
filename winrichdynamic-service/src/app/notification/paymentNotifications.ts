
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Activity from '@/models/Activity';
import { sendSMS } from '@/app/notification/sms';
import { sendLineTextToGroup } from '@/app/notification/line';
import { createPaymentNotification } from '@/lib/notifications';

async function createPaymentFollowUpActivity(order: any, {
  subject,
  notes,
  scheduledAt
}: {
  subject: string;
  notes: string;
  scheduledAt?: Date;
}) {
  try {
    await Activity.create({
      type: 'task',
      subject,
      notes,
      customerId: undefined,
      quotationId: order.generatedQuotationId || undefined,
      ownerId: undefined,
      scheduledAt: scheduledAt || new Date(),
      status: 'planned',
    });
  } catch (error) {
    console.error('Error creating follow-up activity:', error);
  }
}

/**
 * ส่งการแจ้งเตือนการชำระเงิน COD หลังจากส่งสินค้า 3 วัน
 * @param orderId ID ของออเดอร์
 * @returns ผลการดำเนินการ
 */
export async function sendCODPaymentReminder(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'ไม่พบออเดอร์' };
    }

    if (order.paymentMethod !== 'cod') {
      return { success: false, message: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบ COD' };
    }

    if (order.codPaymentStatus === 'collected') {
      return { success: false, message: 'ชำระเงินเรียบร้อยแล้ว' };
    }

    if (order.codReminderSent) {
      return { success: false, message: 'ส่งการแจ้งเตือนไปแล้ว' };
    }

    // ส่ง SMS แจ้งเตือนลูกค้า
    const message = `แจ้งเตือน: ออเดอร์ #${order._id.toString().slice(-6)} ยังไม่ได้ชำระเงิน COD กรุณาตรวจสอบและดำเนินการชำระเงินภายในวันนี้ ขอบคุณครับ/ค่ะ`;
    await sendSMS(order.customerPhone, message);

    // ส่งแจ้งเตือนไปยังกลุ่ม LINE (ถ้ามีการตั้งค่า)
    try {
      const lineGroupId = process.env.LINE_GROUP_ID;
      if (lineGroupId) {
        const adminMessage = `⚠️ แจ้งเตือน COD ค้างชำระ\n\nออเดอร์: #${order._id.toString().slice(-6)}\nลูกค้า: ${order.customerName}\nเบอร์โทร: ${order.customerPhone}\nยอด: ฿${order.totalAmount.toLocaleString()}\nสถานะ: รอชำระเงิน`;
        await sendLineTextToGroup(lineGroupId, adminMessage);
      }
    } catch (lineError) {
      console.error('Error sending LINE notification:', lineError);
    }

    // อัพเดทสถานะการส่งการแจ้งเตือน
    await Order.findByIdAndUpdate(orderId, { codReminderSent: true });

    await createPaymentNotification({
      orderId: order._id.toString(),
      type: 'cod_reminder'
    });

    await createPaymentFollowUpActivity(order, {
      subject: `ติดตามการชำระเงิน COD #${order._id.toString().slice(-6)}`,
      notes: `ระบบแจ้งเตือนการชำระเงิน COD อัตโนมัติสำหรับลูกค้า ${order.customerName}`,
      scheduledAt: new Date()
    });

    return { success: true, message: 'ส่งการแจ้งเตือน COD เรียบร้อยแล้ว' };
  } catch (error) {
    console.error('Error sending COD payment reminder:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' };
  }
}

/**
 * ส่งการแจ้งเตือนการชำระเงินเครดิตครบกำหนด
 * @param orderId ID ของออเดอร์
 * @returns ผลการดำเนินการ
 */
export async function sendCreditPaymentDueNotification(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'ไม่พบออเดอร์' };
    }

    if (order.paymentMethod !== 'credit') {
      return { success: false, message: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบเครดิต' };
    }

    if (!order.creditPaymentDueDate) {
      return { success: false, message: 'ไม่มีวันกำหนดชำระเงิน' };
    }

    // ส่ง SMS แจ้งเตือนลูกค้า
    const dueDate = new Date(order.creditPaymentDueDate).toLocaleDateString('th-TH');
    const message = `แจ้งเตือน: ออเดอร์ #${order._id.toString().slice(-6)} กำหนดชำระเงินวันที่ ${dueDate} ยอด ฿${order.totalAmount.toLocaleString()} กรุณาดำเนินการชำระเงินตามกำหนด ขอบคุณครับ/ค่ะ`;
    await sendSMS(order.customerPhone, message);

    // ส่งแจ้งเตือนไปยังกลุ่ม LINE (ถ้ามีการตั้งค่า)
    try {
      const lineGroupId = process.env.LINE_GROUP_ID;
      if (lineGroupId) {
        const adminMessage = `⚠️ แจ้งเตือนเครดิตครบกำหนด\n\nออเดอร์: #${order._id.toString().slice(-6)}\nลูกค้า: ${order.customerName}\nเบอร์โทร: ${order.customerPhone}\nยอด: ฿${order.totalAmount.toLocaleString()}\nกำหนดชำระ: ${dueDate}`;
        await sendLineTextToGroup(lineGroupId, adminMessage);
      }
    } catch (lineError) {
      console.error('Error sending LINE notification:', lineError);
    }

    // อัพเดทสถานะการส่งการแจ้งเตือน
    await Order.findByIdAndUpdate(orderId, { creditReminderSent: true });

    await createPaymentNotification({
      orderId: order._id.toString(),
      type: 'credit_due'
    });

    await createPaymentFollowUpActivity(order, {
      subject: `ติดตามเครดิตครบกำหนด #${order._id.toString().slice(-6)}`,
      notes: `ระบบแจ้งเตือนเครดิตครบกำหนดสำหรับลูกค้า ${order.customerName} ให้ชำระภายในวันที่ ${dueDate}`,
      scheduledAt: new Date(order.creditPaymentDueDate)
    });

    return { success: true, message: 'ส่งการแจ้งเตือนเครดิตครบกำหนดเรียบร้อยแล้ว' };
  } catch (error) {
    console.error('Error sending credit payment due notification:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' };
  }
}

/**
 * ส่งการแจ้งเตือนเมื่อสถานะการชำระเงินเปลี่ยนแปลง
 * @param orderId ID ของออเดอร์
 * @param newStatus สถานะการชำระเงินใหม่
 * @returns ผลการดำเนินการ
 */
export async function sendPaymentStatusChangeNotification(
  orderId: string, 
  newStatus: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'ไม่พบออเดอร์' };
    }

    let message = '';
    let adminMessage = '';

    switch (newStatus) {
      case 'collected':
        message = `ขอบคุณครับ/ค่ะ! ออเดอร์ #${order._id.toString().slice(-6)} ชำระเงินเรียบร้อยแล้ว ยอด ฿${order.totalAmount.toLocaleString()}`;
        adminMessage = `✅ ชำระเงินเรียบร้อย\n\nออเดอร์: #${order._id.toString().slice(-6)}\nลูกค้า: ${order.customerName}\nยอด: ฿${order.totalAmount.toLocaleString()}\nวิธีชำระ: ${order.paymentMethod}`;
        break;
      case 'failed':
        message = `เกิดข้อผิดพลาดในการชำระเงินออเดอร์ #${order._id.toString().slice(-6)} กรุณาติดต่อเราเพื่อดำเนินการต่อ`;
        adminMessage = `❌ ชำระเงินล้มเหลว\n\nออเดอร์: #${order._id.toString().slice(-6)}\nลูกค้า: ${order.customerName}\nยอด: ฿${order.totalAmount.toLocaleString()}`;
        break;
      case 'verified':
        message = `ขอบคุณครับ/ค่ะ! ออเดอร์ #${order._id.toString().slice(-6)} ยืนยันการโอนเงินเรียบร้อยแล้ว จะดำเนินการจัดส่งเร็วที่สุด`;
        adminMessage = `✅ ยืนยันการโอนเงิน\n\nออเดอร์: #${order._id.toString().slice(-6)}\nลูกค้า: ${order.customerName}\nยอด: ฿${order.totalAmount.toLocaleString()}`;
        break;
      default:
        message = `อัพเดทสถานะออเดอร์ #${order._id.toString().slice(-6)}: ${newStatus}`;
        adminMessage = `📝 อัพเดทสถานะ\n\nออเดอร์: #${order._id.toString().slice(-6)}\nลูกค้า: ${order.customerName}\nสถานะ: ${newStatus}`;
        break;
    }

    // ส่ง SMS แจ้งเตือนลูกค้า
    if (message) {
      await sendSMS(order.customerPhone, message);
    }

    // ส่งแจ้งเตือนไปยังกลุ่ม LINE (ถ้ามีการตั้งค่า)
    try {
      const lineGroupId = process.env.LINE_GROUP_ID;
      if (lineGroupId && adminMessage) {
        await sendLineTextToGroup(lineGroupId, adminMessage);
      }
    } catch (lineError) {
      console.error('Error sending LINE notification:', lineError);
    }

    await createPaymentNotification({
      orderId: order._id.toString(),
      type: 'status_change'
    });

    if (newStatus === 'failed') {
      await createPaymentFollowUpActivity(order, {
        subject: `ติดตามการชำระเงินล้มเหลว #${order._id.toString().slice(-6)}`,
        notes: `สถานะการชำระเงินของลูกค้า ${order.customerName} ถูกทำเครื่องหมายเป็นล้มเหลว กรุณาติดต่อลูกค้าเพื่อดำเนินการ`,
        scheduledAt: new Date()
      });
    }

    return { success: true, message: 'ส่งการแจ้งเตือนการเปลี่ยนแปลงสถานะเรียบร้อยแล้ว' };
  } catch (error) {
    console.error('Error sending payment status change notification:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' };
  }
}

/**
 * ส่งการแจ้งเตือนขออัพโหลดสลิปการโอนเงิน
 * @param orderId ID ของออเดอร์
 * @returns ผลการดำเนินการ
 */
export async function sendSlipVerificationRequest(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'ไม่พบออเดอร์' };
    }

    if (order.paymentMethod !== 'transfer') {
      return { success: false, message: 'ออเดอร์นี้ไม่ใช่การชำระเงินแบบโอนเงิน' };
    }

    if (order.slipVerification?.verified) {
      return { success: false, message: 'ยืนยันสลิปเรียบร้อยแล้ว' };
    }

    // ส่ง SMS แจ้งเตือนลูกค้า
    const message = `กรุณาอัพโหลดสลิปการโอนเงินสำหรับออเดอร์ #${order._id.toString().slice(-6)} ยอด ฿${order.totalAmount.toLocaleString()} เพื่อดำเนินการจัดส่งสินค้า ขอบคุณครับ/ค่ะ`;
    await sendSMS(order.customerPhone, message);

    // ส่งแจ้งเตือนไปยังกลุ่ม LINE (ถ้ามีการตั้งค่า)
    try {
      const lineGroupId = process.env.LINE_GROUP_ID;
      if (lineGroupId) {
        const adminMessage = `📸 รอการยืนยันสลิป\n\nออเดอร์: #${order._id.toString().slice(-6)}\nลูกค้า: ${order.customerName}\nเบอร์โทร: ${order.customerPhone}\nยอด: ฿${order.totalAmount.toLocaleString()}\nสถานะ: รออัพโหลดสลิป`;
        await sendLineTextToGroup(lineGroupId, adminMessage);
      }
    } catch (lineError) {
      console.error('Error sending LINE notification:', lineError);
    }

    // อัพเดทสถานะการต้องการยืนยันการชำระเงิน
    await Order.findByIdAndUpdate(orderId, { paymentConfirmationRequired: true });

    await createPaymentNotification({
      orderId: order._id.toString(),
      type: 'slip_request'
    });

    return { success: true, message: 'ส่งการแจ้งเตือนขออัพโหลดสลิปเรียบร้อยแล้ว' };
  } catch (error) {
    console.error('Error sending slip verification request:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' };
  }
}

/**
 * ตรวจสอบและส่งการแจ้งเตือน COD ที่ค้างชำระอัตโนมัติ
 * ควรถูกเรียกโดย cron job ทุกวัน
 * @returns ผลการดำเนินการ
 */
export async function checkAndSendCODReminders(): Promise<{ success: boolean; message: string; processed: number }> {
  try {
    await connectDB();
    
    // ค้นหาออเดอร์ COD ที่ส่งสินค้าแล้ว 3 วัน แต่ยังไม่ได้ชำระเงิน
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const orders = await Order.find({
      paymentMethod: 'cod',
      status: 'delivered',
      codPaymentStatus: { $ne: 'collected' },
      codReminderSent: false,
      updatedAt: { $lte: threeDaysAgo }
    });

    let processedCount = 0;
    
    for (const order of orders) {
      try {
        await sendCODPaymentReminder(order._id.toString());
        processedCount++;
      } catch (error) {
        console.error(`Error sending COD reminder for order ${order._id}:`, error);
      }
    }

    return {
      success: true,
      message: `ตรวจสอบและส่งการแจ้งเตือน COD เรียบร้อยแล้ว`,
      processed: processedCount
    };
  } catch (error) {
    console.error('Error checking COD reminders:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบการแจ้งเตือน COD', processed: 0 };
  }
}

/**
 * ตรวจสอบและส่งการแจ้งเตือนเครดิตครบกำหนดอัตโนมัติ
 * ควรถูกเรียกโดย cron job ทุกวัน
 * @returns ผลการดำเนินการ
 */
export async function checkAndSendCreditDueNotifications(): Promise<{ success: boolean; message: string; processed: number }> {
  try {
    await connectDB();
    
    // ค้นหาออเดอร์เครดิตที่ใกล้ครบกำหนด (3 วันข้างหน้า)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const orders = await Order.find({
      paymentMethod: 'credit',
      creditPaymentDueDate: { $lte: threeDaysFromNow },
      creditReminderSent: false
    });

    let processedCount = 0;
    
    for (const order of orders) {
      try {
        await sendCreditPaymentDueNotification(order._id.toString());
        processedCount++;
      } catch (error) {
        console.error(`Error sending credit due notification for order ${order._id}:`, error);
      }
    }

    return {
      success: true,
      message: `ตรวจสอบและส่งการแจ้งเตือนเครดิตครบกำหนดเรียบร้อยแล้ว`,
      processed: processedCount
    };
  } catch (error) {
    console.error('Error checking credit due notifications:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบการแจ้งเตือนเครดิต', processed: 0 };
  }
}
