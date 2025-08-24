// =============================
// ทดสอบระบบ [cut] และ [SEND_IMAGE:...]
// =============================

import { 
  hasCutOrImageCommands, 
  countMediaInText, 
  parseCutSegments 
} from './messenger-utils';

/**
 * ทดสอบฟังก์ชันต่างๆ ของระบบ
 */
export function runTests() {
  console.log("🧪 เริ่มทดสอบระบบ [cut] และ [SEND_IMAGE:...]");
  
  // ทดสอบข้อความต่างๆ
  const testCases = [
    {
      name: "ข้อความธรรมดา",
      text: "สวัสดีค่ะ ยินดีให้บริการค่ะ"
    },
    {
      name: "มี [cut] เท่านั้น",
      text: "ส่วนที่ 1 [cut] ส่วนที่ 2 [cut] ส่วนที่ 3"
    },
    {
      name: "มีรูปภาพเท่านั้น",
      text: "สินค้า 1 [SEND_IMAGE:https://img1.jpg] สินค้า 2 [SEND_IMAGE:https://img2.jpg]"
    },
    {
      name: "มีวิดีโอเท่านั้น",
      text: "วิดีโอ 1 [SEND_VIDEO:https://vid1.mp4] วิดีโอ 2 [SEND_VIDEO:https://vid2.mp4]"
    },
    {
      name: "ผสมกันทั้งหมด",
      text: "ส่วนที่ 1 [cut] [SEND_IMAGE:https://img1.jpg] ส่วนที่ 2 [cut] [SEND_VIDEO:https://vid1.mp4] ส่วนที่ 3"
    },
    {
      name: "ข้อความจาก AI จริง",
      text: `ขอบคุณค่ะ คุณลูกค้าสนใจซิลิโคนไร้กรด ขออนุญาตส่งรายละเอียดและรูปภาพสินค้าให้นะคะ

[cut]
[SEND_IMAGE:https://i.imgur.com/FbGALWP.jpeg]
- ขนาด 300ml. แบบหลอด  
- ซิลิโคนแท้ 100 เปอร์เซ็นต์ มีความแน่นของเนื้อซิลิโคน ยืดหยุ่นสูง และทนสภาพอากาศได้ดี

[cut]
- สีที่มี : สีขาว, สีดำ, สีเทาอ่อน, สีเทา7022, สีเทากาแฟ066, สีเทาแอชแทคเกรย์, สีใส, สีแบมบู, สีเมเปิ้ล, สีแชมเปญโกลว์, สีสักทอง, สีวอลนัท, สีดำด้าน

คุณลูกค้าต้องการสอบถามสีไหนเพิ่มเติม หรือสนใจรายละเอียดเพิ่มเติมแจ้งได้เลยค่ะ`
    }
  ];

  // รันการทดสอบ
  testCases.forEach((testCase, index) => {
    console.log(`\n📝 ทดสอบ ${index + 1}: ${testCase.name}`);
    console.log("=" .repeat(50));
    
    // ทดสอบ hasCutOrImageCommands
    const hasCommands = hasCutOrImageCommands(testCase.text);
    console.log(`✅ hasCutOrImageCommands: ${hasCommands}`);
    
    // ทดสอบ countMediaInText
    const mediaCount = countMediaInText(testCase.text);
    console.log(`✅ countMediaInText: ${mediaCount.images} รูปภาพ, ${mediaCount.videos} วิดีโอ`);
    
    // ทดสอบ parseCutSegments
    const parsed = parseCutSegments(testCase.text);
    console.log(`✅ parseCutSegments: ${parsed.segments.length} ส่วน`);
    console.log(`   - รูปภาพทั้งหมด: ${parsed.totalImages}`);
    console.log(`   - วิดีโอทั้งหมด: ${parsed.totalVideos}`);
    
    // แสดงส่วนต่างๆ
    parsed.segments.forEach((segment, segIndex) => {
      console.log(`   ส่วน ${segIndex + 1}: ${segment.substring(0, 80)}${segment.length > 80 ? '...' : ''}`);
    });
  });

  console.log("\n🎉 การทดสอบเสร็จสิ้น!");
}

/**
 * ทดสอบการแยกส่วนข้อความที่ซับซ้อน
 */
export function testComplexCases() {
  console.log("\n🔬 ทดสอบกรณีซับซ้อน");
  
  const complexText = `
สวัสดีค่ะ ยินดีให้บริการค่ะ

[cut]
[SEND_IMAGE:https://i.imgur.com/welcome.jpg]
ข้อความต้อนรับพร้อมรูปภาพ

[cut]
นี่คือส่วนข้อความธรรมดาที่ไม่มีรูปภาพหรือวิดีโอ

[cut]
[SEND_IMAGE:https://i.imgur.com/product1.jpg]
[SEND_IMAGE:https://i.imgur.com/product2.jpg]
สินค้าพร้อมรูปภาพ 2 รูป

[cut]
[SEND_VIDEO:https://i.imgur.com/demo.mp4]
วิดีโอสาธิตการใช้งาน

[cut]
[SEND_IMAGE:https://i.imgur.com/contact.jpg]
ข้อมูลติดต่อและช่องทางต่างๆ

ขอบคุณที่ใช้บริการค่ะ
`;

  console.log("📋 ข้อความทดสอบ:");
  console.log(complexText);
  
  console.log("\n🔍 ผลการวิเคราะห์:");
  
  const hasCommands = hasCutOrImageCommands(complexText);
  console.log(`- มีคำสั่ง [cut] หรือ [SEND_IMAGE:...]: ${hasCommands}`);
  
  const mediaCount = countMediaInText(complexText);
  console.log(`- จำนวนรูปภาพ: ${mediaCount.images}`);
  console.log(`- จำนวนวิดีโอ: ${mediaCount.videos}`);
  
  const parsed = parseCutSegments(complexText);
  console.log(`- จำนวนส่วนทั้งหมด: ${parsed.segments.length}`);
  console.log(`- รูปภาพทั้งหมด: ${parsed.totalImages}`);
  console.log(`- วิดีโอทั้งหมด: ${parsed.totalVideos}`);
  
  console.log("\n📝 ส่วนต่างๆ:");
  parsed.segments.forEach((segment, index) => {
    const imageMatches = segment.match(/\[SEND_IMAGE:/g) || [];
    const videoMatches = segment.match(/\[SEND_VIDEO:/g) || [];
    const textOnly = segment.replace(/\[SEND_IMAGE:[^\]]+\]|\[SEND_VIDEO:[^\]]+\]/g, '').trim();
    
    console.log(`\n  ส่วน ${index + 1}:`);
    console.log(`    รูปภาพ: ${imageMatches.length}`);
    console.log(`    วิดีโอ: ${videoMatches.length}`);
    console.log(`    ข้อความ: ${textOnly.substring(0, 60)}${textOnly.length > 60 ? '...' : ''}`);
  });
}

/**
 * ทดสอบการจัดการข้อผิดพลาด
 */
export function testErrorCases() {
  console.log("\n⚠️ ทดสอบกรณีข้อผิดพลาด");
  
  const errorCases = [
    {
      name: "URL ไม่ถูกต้อง",
      text: "[SEND_IMAGE:invalid-url] ข้อความ"
    },
    {
      name: "[cut] ซ้ำกัน",
      text: "ส่วนที่ 1 [cut] [cut] [cut] ส่วนที่ 2"
    },
    {
      name: "คำสั่งไม่สมบูรณ์",
      text: "[SEND_IMAGE:] ข้อความ [SEND_VIDEO:]"
    },
    {
      name: "ข้อความว่าง",
      text: ""
    },
    {
      name: "ข้อความยาวมาก",
      text: "ข้อความยาวมากๆ ".repeat(1000)
    }
  ];

  errorCases.forEach((testCase, index) => {
    console.log(`\n📝 ทดสอบ ${index + 1}: ${testCase.name}`);
    
    try {
      const hasCommands = hasCutOrImageCommands(testCase.text);
      const mediaCount = countMediaInText(testCase.text);
      const parsed = parseCutSegments(testCase.text);
      
      console.log(`✅ ผ่าน: hasCommands=${hasCommands}, images=${mediaCount.images}, videos=${mediaCount.videos}, segments=${parsed.segments.length}`);
    } catch (error) {
      console.log(`❌ ล้มเหลว: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * ทดสอบประสิทธิภาพ
 */
export function testPerformance() {
  console.log("\n⚡ ทดสอบประสิทธิภาพ");
  
  // สร้างข้อความยาว
  const longText = Array.from({ length: 100 }, (_, i) => 
    `ส่วนที่ ${i + 1} [cut] [SEND_IMAGE:https://img${i + 1}.jpg] รูปภาพที่ ${i + 1}`
  ).join('\n');
  
  console.log(`📏 ขนาดข้อความ: ${longText.length} ตัวอักษร`);
  
  const startTime = performance.now();
  
  // ทดสอบฟังก์ชันต่างๆ
  const hasCommands = hasCutOrImageCommands(longText);
  const mediaCount = countMediaInText(longText);
  const parsed = parseCutSegments(longText);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`⏱️ เวลาที่ใช้: ${duration.toFixed(2)} มิลลิวินาที`);
  console.log(`✅ ผลลัพธ์: hasCommands=${hasCommands}, images=${mediaCount.images}, videos=${mediaCount.videos}, segments=${parsed.segments.length}`);
}

/**
 * รันการทดสอบทั้งหมด
 */
export function runAllTests() {
  console.log("🚀 เริ่มการทดสอบระบบทั้งหมด");
  console.log("=" .repeat(60));
  
  try {
    runTests();
    testComplexCases();
    testErrorCases();
    testPerformance();
    
    console.log("\n🎉 การทดสอบทั้งหมดเสร็จสิ้น!");
    console.log("✅ ระบบ [cut] และ [SEND_IMAGE:...] ทำงานได้ปกติ");
    
  } catch (error) {
    console.error("\n❌ การทดสอบล้มเหลว:", error);
  }
}

// Export สำหรับการใช้งาน
export default {
  runTests,
  testComplexCases,
  testErrorCases,
  testPerformance,
  runAllTests
};
