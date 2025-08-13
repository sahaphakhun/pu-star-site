// =============================
// ตัวอย่างการใช้งานระบบ [cut] และ [SEND_IMAGE:...]
// =============================

import { sendSmartMessage, parseCutSegments, countMediaInText } from './messenger-utils';

/**
 * ตัวอย่างการใช้งานระบบ [cut] และ [SEND_IMAGE:...]
 */

// ตัวอย่างข้อความที่มี [cut] และ [SEND_IMAGE:...]
const exampleMessage = `
สวัสดีค่ะ ยินดีให้บริการค่ะ

นี่คือตัวอย่างสินค้าของเรา:

[cut]
[SEND_IMAGE:https://i.imgur.com/example1.jpg]
สินค้าชิ้นที่ 1 - ราคา 100 บาท
[cut]
[SEND_IMAGE:https://i.imgur.com/example2.jpg]
สินค้าชิ้นที่ 2 - ราคา 200 บาท
[cut]
[SEND_IMAGE:https://i.imgur.com/example3.jpg]
สินค้าชิ้นที่ 3 - ราคา 300 บาท

หากสนใจสินค้าใด กรุณาแจ้งได้เลยค่ะ
`;

/**
 * ตัวอย่างการใช้งานฟังก์ชันต่างๆ
 */
export async function demonstrateUsage(recipientId: string) {
  console.log("=== ตัวอย่างการใช้งานระบบ [cut] และ [SEND_IMAGE:...] ===");
  
  // 1. ตรวจสอบว่าข้อความมีคำสั่งหรือไม่
  const hasCommands = countMediaInText(exampleMessage);
  console.log("จำนวนรูปภาพและวิดีโอ:", hasCommands);
  
  // 2. แยกข้อความเป็นส่วนๆ
  const parsed = parseCutSegments(exampleMessage);
  console.log("จำนวนส่วน:", parsed.segments.length);
  console.log("จำนวนรูปภาพทั้งหมด:", parsed.totalImages);
  console.log("จำนวนวิดีโอทั้งหมด:", parsed.totalVideos);
  
  // 3. ส่งข้อความแบบ smart (เลือกวิธีที่เหมาะสม)
  console.log("กำลังส่งข้อความ...");
  await sendSmartMessage(recipientId, exampleMessage);
  console.log("ส่งข้อความเสร็จสิ้น");
}

/**
 * ตัวอย่างข้อความที่มีเฉพาะ [cut] (ไม่มีรูปภาพ)
 */
export const textOnlyExample = `
สวัสดีค่ะ

[cut]
นี่คือส่วนที่ 1 ของข้อความ

[cut]
นี่คือส่วนที่ 2 ของข้อความ

[cut]
นี่คือส่วนที่ 3 ของข้อความ

ขอบคุณค่ะ
`;

/**
 * ตัวอย่างข้อความที่มีเฉพาะรูปภาพ (ไม่มี [cut])
 */
export const imageOnlyExample = `
สวัสดีค่ะ

นี่คือรูปภาพสินค้าของเรา:

[SEND_IMAGE:https://i.imgur.com/product1.jpg]
สินค้าชิ้นที่ 1

[SEND_IMAGE:https://i.imgur.com/product2.jpg]
สินค้าชิ้นที่ 2

ขอบคุณค่ะ
`;

/**
 * ตัวอย่างข้อความผสม
 */
export const mixedExample = `
สวัสดีค่ะ ยินดีให้บริการค่ะ

[cut]
[SEND_IMAGE:https://i.imgur.com/welcome.jpg]
ข้อความต้อนรับ

[cut]
นี่คือส่วนข้อความธรรมดา

[cut]
[SEND_IMAGE:https://i.imgur.com/product.jpg]
[SEND_VIDEO:https://i.imgur.com/demo.mp4]
สินค้าพร้อมรูปภาพและวิดีโอ

[cut]
ขอบคุณที่ใช้บริการค่ะ
`;

/**
 * ทดสอบการแยกส่วนข้อความ
 */
export function testParsing() {
  console.log("=== ทดสอบการแยกส่วนข้อความ ===");
  
  const examples = [
    { name: "ข้อความธรรมดา", text: "สวัสดีค่ะ" },
    { name: "มี [cut]", text: "ส่วนที่ 1 [cut] ส่วนที่ 2" },
    { name: "มีรูปภาพ", text: "ข้อความ [SEND_IMAGE:https://example.jpg] ต่อ" },
    { name: "มีวิดีโอ", text: "ข้อความ [SEND_VIDEO:https://example.mp4] ต่อ" },
    { name: "ผสมกัน", text: "ส่วนที่ 1 [cut] [SEND_IMAGE:https://img1.jpg] ส่วนที่ 2 [cut] [SEND_VIDEO:https://vid1.mp4] ส่วนที่ 3" }
  ];
  
  examples.forEach(example => {
    console.log(`\n--- ${example.name} ---`);
    console.log("ข้อความ:", example.text);
    
    const parsed = parseCutSegments(example.text);
    console.log("จำนวนส่วน:", parsed.segments.length);
    console.log("จำนวนรูปภาพ:", parsed.totalImages);
    console.log("จำนวนวิดีโอ:", parsed.totalVideos);
    
    parsed.segments.forEach((segment, index) => {
      console.log(`  ส่วน ${index + 1}: ${segment.substring(0, 50)}...`);
    });
  });
}

/**
 * ตัวอย่างการใช้งานในระบบจริง
 */
export async function realWorldExample(recipientId: string) {
  // ข้อความจาก AI ที่มี [cut] และ [SEND_IMAGE:...]
  const aiResponse = `
ขอบคุณค่ะ คุณลูกค้าสนใจซิลิโคนไร้กรด ขออนุญาตส่งรายละเอียดและรูปภาพสินค้าให้นะคะ

[cut]
[SEND_IMAGE:https://i.imgur.com/FbGALWP.jpeg]
- ขนาด 300ml. แบบหลอด  
- ซิลิโคนแท้ 100 เปอร์เซ็นต์ มีความแน่นของเนื้อซิลิโคน ยืดหยุ่นสูง และทนสภาพอากาศได้ดี

[cut]
- สีที่มี : สีขาว, สีดำ, สีเทาอ่อน, สีเทา7022, สีเทากาแฟ066, สีเทาแอชแทคเกรย์, สีใส, สีแบมบู, สีเมเปิ้ล, สีแชมเปญโกลว์, สีสักทอง, สีวอลนัท, สีดำด้าน

คุณลูกค้าต้องการสอบถามสีไหนเพิ่มเติม หรือสนใจรายละเอียดเพิ่มเติมแจ้งได้เลยค่ะ
`;

  console.log("=== ตัวอย่างการใช้งานจริง ===");
  console.log("ข้อความจาก AI:", aiResponse.substring(0, 100) + "...");
  
  // ใช้ระบบ smart message
  await sendSmartMessage(recipientId, aiResponse);
  
  console.log("ส่งข้อความเสร็จสิ้น");
}
