#!/usr/bin/env node

/**
 * สคริปต์ทดสอบระบบแจ้งเตือน LINE
 * ใช้สำหรับทดสอบการส่งแจ้งเตือนไปยังกลุ่มไลน์
 */

require('dotenv').config();
const { notifyAllLineGroups } = require('../src/utils/line');

async function testLineNotification() {
  console.log('🚀 เริ่มทดสอบระบบแจ้งเตือน LINE...\n');
  
  try {
    // ทดสอบส่งข้อความแจ้งเตือน
    const testMessage = `🧪 ทดสอบระบบ: การส่งแจ้งเตือน LINE\n\nเวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n\nนี่คือข้อความทดสอบเพื่อตรวจสอบว่าระบบทำงานปกติ`;
    
    console.log('📝 ข้อความทดสอบ:');
    console.log(testMessage);
    console.log('\n📤 กำลังส่งข้อความ...');
    
    const result = await notifyAllLineGroups(testMessage);
    
    if (result) {
      console.log('\n✅ ผลการทดสอบ:');
      console.log(`- จำนวนกลุ่มทั้งหมด: ${result.total}`);
      console.log(`- ส่งสำเร็จ: ${result.successful}`);
      console.log(`- ส่งไม่สำเร็จ: ${result.failed}`);
      
      if (result.successful > 0) {
        console.log('\n🎉 การทดสอบสำเร็จ! ระบบแจ้งเตือน LINE ทำงานปกติ');
      } else {
        console.log('\n⚠️  ไม่มีกลุ่มไลน์ที่ส่งสำเร็จ กรุณาตรวจสอบการตั้งค่า');
      }
    } else {
      console.log('\n❌ ไม่สามารถส่งแจ้งเตือนได้');
    }
    
  } catch (error) {
    console.error('\n💥 เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    
    if (error.message.includes('LINE_CHANNEL_ACCESS_TOKEN')) {
      console.log('\n💡 แก้ไขปัญหา:');
      console.log('1. ตรวจสอบว่า LINE_CHANNEL_ACCESS_TOKEN ถูกตั้งค่าใน .env');
      console.log('2. ตรวจสอบว่า Token ถูกต้องและยังไม่หมดอายุ');
    }
    
    if (error.message.includes('MongoDB')) {
      console.log('\n💡 แก้ไขปัญหา:');
      console.log('1. ตรวจสอบการเชื่อมต่อ MongoDB');
      console.log('2. ตรวจสอบว่า MONGODB_URI ถูกต้อง');
    }
  }
}

// ตรวจสอบตัวแปรสภาพแวดล้อมที่จำเป็น
function checkEnvironmentVariables() {
  const required = [
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_CHANNEL_SECRET',
    'MONGODB_URI'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ ตัวแปรสภาพแวดล้อมที่จำเป็นหายไป:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\n💡 กรุณาตั้งค่าในไฟล์ .env ตาม env.example');
    process.exit(1);
  }
  
  console.log('✅ ตัวแปรสภาพแวดล้อมครบถ้วน\n');
}

// ฟังก์ชันหลัก
async function main() {
  console.log('🔧 ระบบทดสอบแจ้งเตือน LINE สำหรับแชทเฟซบุ๊ค\n');
  
  // ตรวจสอบตัวแปรสภาพแวดล้อม
  checkEnvironmentVariables();
  
  // เริ่มทดสอบ
  await testLineNotification();
  
  console.log('\n🏁 เสร็จสิ้นการทดสอบ');
}

// เรียกใช้ฟังก์ชันหลัก
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testLineNotification };
