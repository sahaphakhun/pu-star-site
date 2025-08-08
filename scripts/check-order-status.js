// Script: check-order-status.js
// เช็คออเดอร์ที่ยังไม่ถูกอัปเดตสถานะภายใน 16:00 ของวันที่สั่งซื้อ แล้วส่ง SMS แจ้งเตือนแอดมิน

require('dotenv').config();
const connectDB = require('../src/lib/mongodb').default || require('../src/lib/mongodb');
const Order = require('../src/models/Order').default || require('../src/models/Order');
const AdminPhone = require('../src/models/AdminPhone').default || require('../src/models/AdminPhone');
const { sendSMS } = require('../src/app/notification');

(async () => {
  await connectDB();

  const now = new Date();
  const today16 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0, 0);
  // ดึงออเดอร์ของวันนี้ที่ยัง pending/confirmed และเลยเวลา 16:00
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const orders = await Order.find({
    status: { $in: ['pending', 'confirmed'] },
    orderDate: { $gte: startOfDay, $lte: today16 }
  }).lean();

  if (!orders.length) {
    console.log('No orders to notify');
    process.exit(0);
  }

  const idsTxt = orders.map(o => o._id.toString().slice(-8).toUpperCase()).join(',');
  const smsText = `⚠️ ออเดอร์ยังไม่อัปเดตสถานะจนถึง 16:00: ${idsTxt}`;

  const admins = await AdminPhone.find({}, 'phoneNumber').lean();
  await Promise.allSettled(admins.map(a => sendSMS(a.phoneNumber, smsText)));

  console.log('Admin notified');
  process.exit(0);
})(); 