import { callSendAPI } from '@/utils/messenger';
import connectDB from '@/lib/mongodb';
import MessengerUser from '@/models/MessengerUser';
import Order from '@/models/Order';

/**
 * แสดงประวัติคำสั่งซื้อของผู้ใช้
 */
export async function showMyOrders(psid: string) {
  try {
    await connectDB();
    
    // ค้นหา MessengerUser จาก psid
    const messengerUser = await MessengerUser.findOne({ psid });
    
    if (!messengerUser || !messengerUser.phoneNumber) {
      return callSendAPI(psid, {
        text: 'กรุณายืนยันตัวตนก่อนเพื่อดูประวัติคำสั่งซื้อค่ะ',
        quick_replies: [
          { content_type: 'text', title: 'ยืนยันตัวตน', payload: 'START_AUTH' },
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
    }
    
    // ค้นหาคำสั่งซื้อของผู้ใช้
    const orders = await Order.find({
      $or: [
        { userId: messengerUser.userId },
        { customerPhone: messengerUser.phoneNumber },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    
    if (!orders || orders.length === 0) {
      return callSendAPI(psid, {
        text: 'ยังไม่มีประวัติคำสั่งซื้อค่ะ',
        quick_replies: [
          { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        ],
      });
    }
    
    // สร้างข้อความแสดงรายการคำสั่งซื้อ
    let message = '📋 ประวัติคำสั่งซื้อของคุณ:\n\n';
    
    orders.forEach((order: any, index: number) => {
      const orderNumber = order._id.toString().slice(-8).toUpperCase();
      const date = new Date(order.createdAt).toLocaleDateString('th-TH');
      const status = getOrderStatusText(order.status);
      const total = order.totalAmount?.toLocaleString() || '0';
      
      message += `${index + 1}. #${orderNumber}\n`;
      message += `📅 ${date}\n`;
      message += `💰 ${total} บาท\n`;
      message += `📊 ${status}\n`;
      
      if (order.trackingNumber) {
        message += `📦 พัสดุ: ${order.trackingNumber}\n`;
      }
      
      message += '\n';
    });
    
    message += 'สามารถดูรายละเอียดเพิ่มเติมได้ที่เว็บไซต์ค่ะ';
    
    // ส่งข้อความแสดงรายการ
    await callSendAPI(psid, {
      text: message,
      quick_replies: [
        { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
        { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
        { content_type: 'text', title: 'ติดต่อแอดมิน', payload: 'CONTACT_ADMIN' },
      ],
    });
    
  } catch (error) {
    console.error('[OrderHistory] เกิดข้อผิดพลาดในการดูประวัติคำสั่งซื้อ:', error);
    
    await callSendAPI(psid, {
      text: 'เกิดข้อผิดพลาดในการดูประวัติคำสั่งซื้อ กรุณาลองใหม่อีกครั้งค่ะ',
      quick_replies: [
        { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
      ],
    });
  }
}

/**
 * แปลงสถานะคำสั่งซื้อเป็นข้อความภาษาไทย
 */
function getOrderStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': '⏳ รอดำเนินการ',
    'confirmed': '✅ ยืนยันแล้ว',
    'processing': '🔄 กำลังเตรียมจัดส่ง',
    'shipped': '🚚 จัดส่งแล้ว',
    'delivered': '📦 ส่งมอบแล้ว',
    'cancelled': '❌ ยกเลิกแล้ว',
    'refunded': '💸 คืนเงินแล้ว',
  };
  
  return statusMap[status] || status;
} 