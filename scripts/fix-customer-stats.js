/**
 * สคริปต์แก้ไขปัญหาสถิติลูกค้าทั้งหมด
 * 
 * ปัญหาที่แก้ไข:
 * 1. ออเดอร์เก่าที่ไม่มี userId ไม่ถูกนับในสถิติ
 * 2. ออเดอร์ที่มี userId แต่ข้อมูลไม่ถูกต้อง
 * 3. สถิติใน User model ไม่ตรงกับ Order model
 * 4. การซิงค์ออเดอร์ไม่ครอบคลุม
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Order = require('../src/models/Order');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
  } catch (error) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('✅ ปิดการเชื่อมต่อฐานข้อมูล');
}

/**
 * สร้างรูปแบบเบอร์โทรที่ตรงกัน
 */
function createPhonePatterns(phoneNumber) {
  const patterns = [];
  
  if (phoneNumber.startsWith('+66')) {
    const numberWithoutPrefix = phoneNumber.substring(3);
    patterns.push(phoneNumber, `0${numberWithoutPrefix}`);
  } else if (phoneNumber.startsWith('0')) {
    const numberWithoutPrefix = phoneNumber.substring(1);
    patterns.push(phoneNumber, `+66${numberWithoutPrefix}`);
  } else if (phoneNumber.startsWith('66')) {
    const numberWithoutPrefix = phoneNumber.substring(2);
    patterns.push(`+${phoneNumber}`, `0${numberWithoutPrefix}`);
  }
  
  return patterns;
}

/**
 * คำนวณสถิติลูกค้าจากออเดอร์
 */
function calculateCustomerAnalytics(orders) {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null
    };
  }

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const averageOrderValue = totalSpent / totalOrders;
  const lastOrderDate = new Date(Math.max(...orders.map(o => new Date(o.createdAt))));

  return {
    totalOrders,
    totalSpent,
    averageOrderValue,
    lastOrderDate
  };
}

/**
 * จำแนกประเภทลูกค้า
 */
function classifyCustomer(analytics) {
  if (analytics.totalOrders === 0) return 'new';
  if (analytics.totalOrders >= 10 || analytics.totalSpent >= 10000) return 'target';
  if (analytics.totalOrders >= 3 || analytics.totalSpent >= 3000) return 'regular';
  return 'new';
}

/**
 * ขั้นตอนที่ 1: ซิงค์ออเดอร์ทั้งหมดให้ตรงกับผู้ใช้
 */
async function syncAllOrdersToUsers() {
  console.log('\n🔄 ขั้นตอนที่ 1: ซิงค์ออเดอร์ทั้งหมดให้ตรงกับผู้ใช้');
  
  const users = await User.find({ role: 'user' }).select('_id phoneNumber').lean();
  console.log(`พบผู้ใช้ ${users.length} คน`);
  
  let totalSynced = 0;
  let totalCorrected = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      const phonePatterns = createPhonePatterns(user.phoneNumber);
      
      // ดึงออเดอร์ทั้งหมดที่มีเบอร์ตรงกัน
      const allOrders = await Order.find({
        customerPhone: { $in: phonePatterns }
      }).sort({ createdAt: 1 }).lean();

      let syncedCount = 0;
      let correctedCount = 0;

      for (const order of allOrders) {
        try {
          if (!order.userId) {
            // ออเดอร์ที่ยังไม่มี userId
            await Order.findByIdAndUpdate(order._id, {
              $set: { userId: user._id }
            });
            syncedCount++;
          } else if (order.userId.toString() !== user._id.toString()) {
            // ออเดอร์ที่มี userId แล้วแต่ไม่ตรงกับ user นี้
            const currentUser = await User.findById(order.userId).lean();
            if (!currentUser) {
              // userId ไม่มีอยู่จริง ให้ย้ายมาที่ user นี้
              await Order.findByIdAndUpdate(order._id, {
                $set: { userId: user._id }
              });
              correctedCount++;
            }
          }
        } catch (error) {
          console.error(`❌ ไม่สามารถประมวลผลออเดอร์ ${order._id}:`, error);
        }
      }

      totalSynced += syncedCount;
      totalCorrected += correctedCount;
      
      if (syncedCount > 0 || correctedCount > 0) {
        console.log(`  📱 ${user.phoneNumber}: ซิงค์ ${syncedCount}, แก้ไข ${correctedCount} ออเดอร์`);
      }
      
    } catch (error) {
      console.error(`❌ ไม่สามารถซิงค์ออเดอร์สำหรับผู้ใช้ ${user._id}:`, error);
      errorCount++;
    }
  }

  console.log(`✅ ซิงค์ออเดอร์เสร็จสิ้น: ซิงค์ ${totalSynced}, แก้ไข ${totalCorrected}, ผิดพลาด ${errorCount}`);
  return { totalSynced, totalCorrected, errorCount };
}

/**
 * ขั้นตอนที่ 2: อัปเดตสถิติลูกค้าทั้งหมดจากออเดอร์จริง
 */
async function updateAllCustomerStatsFromOrders() {
  console.log('\n📊 ขั้นตอนที่ 2: อัปเดตสถิติลูกค้าทั้งหมดจากออเดอร์จริง');
  
  const users = await User.find({ role: 'user' }).select('_id phoneNumber').lean();
  console.log(`พบผู้ใช้ ${users.length} คน`);
  
  let updatedCount = 0;
  let errorCount = 0;
  let totalOrdersFound = 0;

  for (const user of users) {
    try {
      const phonePatterns = createPhonePatterns(user.phoneNumber);
      
      // ดึงออเดอร์ทั้งหมดที่มีเบอร์ตรงกัน
      const allOrders = await Order.find({
        customerPhone: { $in: phonePatterns }
      }).sort({ createdAt: 1 }).lean();

      if (allOrders.length > 0) {
        // คำนวณสถิติจากออเดอร์ทั้งหมด
        const analytics = calculateCustomerAnalytics(allOrders);
        const customerType = classifyCustomer(analytics);

        // อัปเดตข้อมูลลูกค้า
        await User.findByIdAndUpdate(user._id, {
          $set: {
            customerType,
            totalOrders: analytics.totalOrders,
            totalSpent: analytics.totalSpent,
            averageOrderValue: analytics.averageOrderValue,
            lastOrderDate: analytics.lastOrderDate,
          }
        });

        totalOrdersFound += allOrders.length;
        updatedCount++;
        
        console.log(`  📱 ${user.phoneNumber}: ${analytics.totalOrders} ออเดอร์, ฿${analytics.totalSpent}, ${customerType}`);
      } else {
        // หากไม่มีออเดอร์ ให้รีเซ็ตสถิติ
        await User.findByIdAndUpdate(user._id, {
          $set: {
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
            customerType: 'new'
          }
        });
        updatedCount++;
        console.log(`  📱 ${user.phoneNumber}: ไม่มีออเดอร์ (รีเซ็ตสถิติ)`);
      }
      
    } catch (error) {
      console.error(`❌ ไม่สามารถอัปเดตสถิติสำหรับผู้ใช้ ${user._id}:`, error);
      errorCount++;
    }
  }

  console.log(`✅ อัปเดตสถิติเสร็จสิ้น: อัปเดต ${updatedCount}, ผิดพลาด ${errorCount}, พบออเดอร์ ${totalOrdersFound} รายการ`);
  return { updatedCount, errorCount, totalOrdersFound };
}

/**
 * ขั้นตอนที่ 3: ตรวจสอบความถูกต้องของข้อมูล
 */
async function verifyDataIntegrity() {
  console.log('\n🔍 ขั้นตอนที่ 3: ตรวจสอบความถูกต้องของข้อมูล');
  
  const users = await User.find({ role: 'user' }).select('_id phoneNumber totalOrders totalSpent customerType').lean();
  let issuesFound = 0;
  let totalOrdersInDB = 0;

  for (const user of users) {
    try {
      const phonePatterns = createPhonePatterns(user.phoneNumber);
      
      // นับออเดอร์จริงในฐานข้อมูล
      const actualOrders = await Order.find({
        customerPhone: { $in: phonePatterns }
      }).lean();

      const actualOrderCount = actualOrders.length;
      const actualTotalSpent = actualOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      totalOrdersInDB += actualOrderCount;

      // ตรวจสอบความไม่ตรงกัน
      if (user.totalOrders !== actualOrderCount) {
        console.log(`  ⚠️  ${user.phoneNumber}: จำนวนออเดอร์ไม่ตรงกัน (User: ${user.totalOrders}, Order: ${actualOrderCount})`);
        issuesFound++;
      }

      if (Math.abs(user.totalSpent - actualTotalSpent) > 0.01) {
        console.log(`  ⚠️  ${user.phoneNumber}: ยอดรวมไม่ตรงกัน (User: ฿${user.totalSpent}, Order: ฿${actualTotalSpent})`);
        issuesFound++;
      }

    } catch (error) {
      console.error(`❌ ไม่สามารถตรวจสอบข้อมูลสำหรับผู้ใช้ ${user._id}:`, error);
    }
  }

  console.log(`✅ ตรวจสอบเสร็จสิ้น: พบปัญหา ${issuesFound} รายการ, ออเดอร์ทั้งหมดในระบบ ${totalOrdersInDB} รายการ`);
  return { issuesFound, totalOrdersInDB };
}

/**
 * ขั้นตอนที่ 4: ค้นหาออเดอร์ที่ไม่มีผู้ใช้และสร้างผู้ใช้ใหม่
 */
async function findOrphanedOrdersAndCreateUsers() {
  console.log('\n🔍 ขั้นตอนที่ 4: ค้นหาออเดอร์ที่ไม่มีผู้ใช้และสร้างผู้ใช้ใหม่');
  
  // ดึงออเดอร์ทั้งหมดที่ไม่มี userId
  const orphanedOrders = await Order.find({
    userId: { $exists: false }
  }).sort({ createdAt: 1 }).lean();

  console.log(`พบออเดอร์ที่ไม่มี userId: ${orphanedOrders.length} รายการ`);

  if (orphanedOrders.length === 0) {
    console.log('✅ ไม่พบออเดอร์ที่ไม่มีผู้ใช้');
    return { createdUsers: 0, syncedOrders: 0, skippedOrders: 0 };
  }

  let createdUsers = 0;
  let syncedOrders = 0;
  let skippedOrders = 0;
  const processedPhones = new Set();

  for (const order of orphanedOrders) {
    try {
      const customerPhone = order.customerPhone;
      
      // ข้ามหากเบอร์โทรซ้ำหรือไม่มีเบอร์โทร
      if (!customerPhone || processedPhones.has(customerPhone)) {
        skippedOrders++;
        continue;
      }

      // ตรวจสอบว่ามีผู้ใช้ที่มีเบอร์โทรนี้อยู่แล้วหรือไม่
      const existingUser = await User.findOne({
        phoneNumber: customerPhone
      }).lean();

      if (existingUser) {
        // มีผู้ใช้อยู่แล้ว ให้ซิงค์ออเดอร์
        await Order.findByIdAndUpdate(order._id, {
          $set: { userId: existingUser._id }
        });
        syncedOrders++;
        console.log(`📱 ซิงค์ออเดอร์ ${order._id} ให้ผู้ใช้ ${existingUser.phoneNumber}`);
      } else {
        // สร้างผู้ใช้ใหม่
        const newUser = new User({
          name: order.customerName || 'ลูกค้า',
          phoneNumber: customerPhone,
          email: order.customerEmail || '',
          role: 'user',
          customerType: 'new',
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null,
          createdAt: order.createdAt,
          updatedAt: new Date()
        });

        const savedUser = await newUser.save();
        
        // อัปเดตออเดอร์ให้มี userId
        await Order.findByIdAndUpdate(order._id, {
          $set: { userId: savedUser._id }
        });

        createdUsers++;
        syncedOrders++;
        processedPhones.add(customerPhone);
        
        console.log(`👤 สร้างผู้ใช้ใหม่: ${savedUser.phoneNumber} (${savedUser.name})`);
      }

    } catch (error) {
      console.error(`❌ ไม่สามารถประมวลผลออเดอร์ ${order._id}:`, error);
      skippedOrders++;
    }
  }

  console.log(`✅ สร้างผู้ใช้ ${createdUsers} คน, ซิงค์ออเดอร์ ${syncedOrders} รายการ, ข้าม ${skippedOrders} รายการ`);
  return { createdUsers, syncedOrders, skippedOrders };
}

/**
 * ฟังก์ชันหลัก
 */
async function main() {
  console.log('🚀 เริ่มต้นแก้ไขปัญหาสถิติลูกค้า');
  console.log('=' .repeat(50));
  
  try {
    await connectDB();

    // ขั้นตอนที่ 1: ซิงค์ออเดอร์
    const syncResult = await syncAllOrdersToUsers();
    
    // ขั้นตอนที่ 2: อัปเดตสถิติ
    const updateResult = await updateAllCustomerStatsFromOrders();
    
    // ขั้นตอนที่ 3: ตรวจสอบความถูกต้อง
    const verifyResult = await verifyDataIntegrity();

    // ขั้นตอนที่ 4: ค้นหาออเดอร์ที่ไม่มีผู้ใช้และสร้างผู้ใช้ใหม่
    const orphanedResult = await findOrphanedOrdersAndCreateUsers();

    // ขั้นตอนที่ 5: อัปเดตสถิติอีกครั้งหลังสร้างผู้ใช้ใหม่
    if (orphanedResult.createdUsers > 0 || orphanedResult.syncedOrders > 0) {
      console.log('\n📊 อัปเดตสถิติอีกครั้งหลังสร้างผู้ใช้ใหม่...');
      await updateAllCustomerStatsFromOrders();
    }

    console.log('\n🎉 สรุปผลการแก้ไขปัญหา');
    console.log('=' .repeat(50));
    console.log(`📱 ซิงค์ออเดอร์: ${syncResult.totalSynced} รายการ`);
    console.log(`🔧 แก้ไขออเดอร์: ${syncResult.totalCorrected} รายการ`);
    console.log(`📊 อัปเดตสถิติ: ${updateResult.updatedCount} คน`);
    console.log(`👤 สร้างผู้ใช้ใหม่: ${orphanedResult.createdUsers} คน`);
    console.log(`📱 ซิงค์ออเดอร์เพิ่มเติม: ${orphanedResult.syncedOrders} รายการ`);
    console.log(`🔍 พบปัญหา: ${verifyResult.issuesFound} รายการ`);
    console.log(`📦 ออเดอร์ทั้งหมด: ${verifyResult.totalOrdersInDB} รายการ`);
    
    if (verifyResult.issuesFound === 0) {
      console.log('\n✅ ไม่พบปัญหาอีกต่อไป! ข้อมูลทั้งหมดถูกต้องแล้ว');
    } else {
      console.log('\n⚠️  ยังพบปัญหาบางอย่าง กรุณาตรวจสอบและแก้ไขเพิ่มเติม');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await disconnectDB();
  }
}

// รันสคริปต์
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncAllOrdersToUsers,
  updateAllCustomerStatsFromOrders,
  verifyDataIntegrity
};
