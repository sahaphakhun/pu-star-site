// =============================
// Test file สำหรับทดสอบการกรองแท็ก THAI_REPLY
// =============================

import { filterThaiReplyContent } from './openai-utils';

// ตัวอย่างข้อความที่มีแท็ก THAI_REPLY
const testCases = [
  {
    name: 'ข้อความที่มีแท็ก THAI_REPLY ปกติ',
    input: 'นี่คือข้อความทดสอบ <THAI_REPLY>สวัสดีค่ะ ยินดีให้บริการค่ะ</THAI_REPLY> และนี่คือข้อความเพิ่มเติม',
    expected: 'สวัสดีค่ะ ยินดีให้บริการค่ะ'
  },
  {
    name: 'ข้อความที่มีแท็ก THAI_REPLY และ [SEND_IMAGE:...]',
    input: '<THAI_REPLY>นี่คือรูปภาพสินค้า [SEND_IMAGE:https://example.com/image.jpg] และข้อความเพิ่มเติม</THAI_REPLY>',
    expected: 'นี่คือรูปภาพสินค้า [SEND_IMAGE:https://example.com/image.jpg] และข้อความเพิ่มเติม'
  },
  {
    name: 'ข้อความที่มีแท็ก THAI_REPLY และ [cut]',
    input: '<THAI_REPLY>ส่วนแรก [cut] ส่วนที่สอง [cut] ส่วนที่สาม</THAI_REPLY>',
    expected: 'ส่วนแรก [cut] ส่วนที่สอง [cut] ส่วนที่สาม'
  },
  {
    name: 'ข้อความที่ไม่มีแท็ก THAI_REPLY',
    input: 'นี่คือข้อความธรรมดาที่ไม่มีแท็กใดๆ',
    expected: 'นี่คือข้อความธรรมดาที่ไม่มีแท็กใดๆ'
  },
  {
    name: 'คำสั่ง /tag (ควรแสดงข้อความทั้งหมด)',
    input: '<THAI_REPLY>สวัสดีค่ะ</THAI_REPLY> และนี่คือข้อความเพิ่มเติม',
    expected: '<THAI_REPLY>สวัสดีค่ะ</THAI_REPLY> และนี่คือข้อความเพิ่มเติม',
    isTagCommand: true
  },
  {
    name: 'ข้อความที่มีแท็ก THAI_REPLY หลายแท็ก (ควรใช้แท็กแรก)',
    input: '<THAI_REPLY>แท็กแรก</THAI_REPLY> <THAI_REPLY>แท็กที่สอง</THAI_REPLY>',
    expected: 'แท็กแรก'
  }
];

// ฟังก์ชันทดสอบ
function runTests() {
  console.log('🧪 เริ่มทดสอบการกรองแท็ก THAI_REPLY...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`📝 ทดสอบ: ${testCase.name}`);
    console.log(`   Input: ${testCase.input}`);
    
    const result = filterThaiReplyContent(testCase.input, testCase.isTagCommand || false);
    console.log(`   Result: ${result}`);
    console.log(`   Expected: ${testCase.expected}`);
    
    const isPassed = result === testCase.expected;
    if (isPassed) {
      console.log('   ✅ ผ่าน');
      passedTests++;
    } else {
      console.log('   ❌ ไม่ผ่าน');
    }
    console.log('');
  }
  
  console.log(`📊 ผลการทดสอบ: ${passedTests}/${totalTests} ผ่าน`);
  
  if (passedTests === totalTests) {
    console.log('🎉 การทดสอบทั้งหมดผ่าน!');
  } else {
    console.log('⚠️  มีการทดสอบที่ไม่ผ่าน กรุณาตรวจสอบ');
  }
}

// รันการทดสอบถ้าเรียกไฟล์นี้โดยตรง
if (require.main === module) {
  runTests();
}

export { runTests, testCases };
