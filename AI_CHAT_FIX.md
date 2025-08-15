# การแก้ไขปัญหาการส่งข้อความซ้ำของระบบ AI

## ปัญหาที่พบ
ระบบ AI ตอบแชทลูกค้าเกิน 1 ครั้งต่อการรับข้อความจากผู้ใช้เพียง 1 ครั้ง

## สาเหตุของปัญหา
1. **การตรวจสอบ Echo Event ไม่ครบถ้วน** - ไม่ได้ตรวจสอบ echo event ทุกประเภท
2. **การส่งข้อความซ้ำในส่วนท้ายของไฟล์** - มีการส่งข้อความแนะนำหลังจากที่ AI ได้ตอบไปแล้ว
3. **การประมวลผล event ซ้ำ** - ไม่มีการติดตามว่าได้ประมวลผล event นั้นแล้วหรือไม่

## การแก้ไขที่ทำ

### 1. ปรับปรุงการตรวจสอบ Echo Event
```typescript
// ข้าม event ที่เป็น echo (บอทส่งเอง) หรือ delivery/read
if (event.message && (
  (event as any).message.is_echo || 
  (event as any).message.app_id ||
  (event as any).message.metadata?.is_echo ||
  (event as any).message.metadata?.app_id
)) {
  console.log('[Flow] skip echo event');
  return;
}
```

### 2. เพิ่มการติดตามการตอบกลับ
```typescript
export async function handleEvent(event: MessagingEvent) {
  const psid = event.sender.id;
  
  // เพิ่มตัวแปรเพื่อติดตามว่าได้ส่งข้อความตอบกลับแล้วหรือไม่
  let hasResponded = false;
  
  // ... existing code ...
}
```

### 3. ตั้งค่า hasResponded เมื่อส่งข้อความ
```typescript
// ในทุกส่วนที่ส่งข้อความ AI
if (hasCutOrImageCommands(answer)) {
  await sendSmartMessage(psid, answer, true);
} else {
  await callSendAPI(psid, {
    text: answer,
    quick_replies: [...]
  });
}
hasResponded = true;
return;
```

### 4. ตรวจสอบ hasResponded ก่อนประมวลผลเพิ่มเติม
```typescript
// ตรวจสอบว่าได้ส่งข้อความตอบกลับแล้วหรือไม่
if (hasResponded) {
  console.log('[Flow] Already responded to this message, skipping further processing');
  return;
}
```

### 5. ลบการส่งข้อความซ้ำในส่วนท้าย
```typescript
// ลบส่วนนี้ออกเพราะจะทำให้ส่งข้อความซ้ำหลังจากที่ AI ได้ตอบไปแล้ว
// if (currentAiEnabled && event.message && event.message.text) {
//   await callSendAPI(psid, {
//     text: 'กรุณาพิมพ์คำถามหรือความต้องการของคุณได้เลยค่ะ',
//     quick_replies: [...]
//   });
//   return;
// }
```

## ผลลัพธ์ที่คาดหวัง
- ระบบ AI จะตอบแชทลูกค้าเพียง 1 ครั้งต่อการรับข้อความจากผู้ใช้ 1 ครั้ง
- ยกเว้นกรณีที่มี `[cut]` ที่จะแบ่งข้อความเป็นหลายส่วนตามที่ออกแบบไว้
- ลดการส่งข้อความซ้ำและข้อความที่ไม่จำเป็น

## การทดสอบ
1. ส่งข้อความธรรมดาให้ AI - ควรได้รับคำตอบ 1 ครั้ง
2. ส่งข้อความที่มี `[cut]` - ควรได้รับคำตอบหลายส่วนตามที่แบ่งไว้
3. ส่งข้อความซ้ำ - ควรไม่ได้รับคำตอบซ้ำ
4. ตรวจสอบ log เพื่อดูว่า echo event ถูกข้ามหรือไม่

## ไฟล์ที่แก้ไข
- `src/bot/flows/entry.ts` - ไฟล์หลักสำหรับการจัดการ event
- `src/utils/messenger-utils.ts` - ปรับปรุงการจัดการ [cut]
