# การแก้ไขแท็ก ORDER_JSON และ THAI_REPLY

## ปัญหาที่แก้ไข
เดิมเมื่อเอไอตอบกลับ จะแสดงแท็ก `<ORDER_JSON>` และ `<THAI_REPLY>` ให้ผู้ใช้เห็น ทำให้ข้อความดูไม่เป็นธรรมชาติ

## การแก้ไข
แก้ไขฟังก์ชัน `getAssistantResponse` ในไฟล์ `src/utils/openai-utils.ts` เพื่อให้ประมวลผลแท็กเหล่านี้และแสดงเฉพาะเนื้อหาภายใน `<THAI_REPLY>` เท่านั้น

### รายละเอียดการแก้ไข
เพิ่มโค้ดในฟังก์ชัน `getAssistantResponse` หลังจากที่ได้ response จาก OpenAI API:

```typescript
// ตรวจสอบคำสั่ง /tag - ถ้าผู้ใช้พิมพ์ /tag ให้แสดงแท็กเหมือนเดิม
const lastUserMessage = messages[messages.length - 1]?.content;
const isTagCommand = typeof lastUserMessage === 'string' && lastUserMessage.trim() === '/tag';

// ประมวลผลแท็ก ORDER_JSON และ THAI_REPLY
// ถ้ามีแท็ก THAI_REPLY และไม่ใช่คำสั่ง /tag ให้แสดงเฉพาะเนื้อหาภายในแท็กนั้น
if (!isTagCommand) {
  const thaiReplyMatch = assistantReply.match(/<THAI_REPLY>([\s\S]*?)<\/THAI_REPLY>/);
  if (thaiReplyMatch && thaiReplyMatch[1]) {
    assistantReply = thaiReplyMatch[1].trim();
  }
}
```

## ฟีเจอร์พิเศษ: คำสั่ง /tag
- **ปกติ**: เอไอจะแสดงเฉพาะข้อความตอบจากแท็ก `<THAI_REPLY>` โดยไม่แสดงแท็ก
- **เมื่อพิมพ์ `/tag`**: เอไอจะแสดงแท็ก `<ORDER_JSON>` และ `<THAI_REPLY>` เหมือนเดิม
- **ประโยชน์**: แอดมินหรือนักพัฒนาสามารถใช้คำสั่งนี้เพื่อดูข้อมูล JSON และ debug ได้

## ผลลัพธ์
- ผู้ใช้จะเห็นเฉพาะข้อความตอบจากเอไอที่อยู่ในแท็ก `<THAI_REPLY>`
- แท็ก `<ORDER_JSON>` จะไม่ถูกแสดงให้ผู้ใช้เห็น
- ข้อความตอบจะดูเป็นธรรมชาติมากขึ้น
- สามารถใช้คำสั่ง `/tag` เพื่อดูแท็กทั้งหมดได้เมื่อต้องการ

## ไฟล์ที่แก้ไข
- `src/utils/openai-utils.ts` (บรรทัด 387-395)

## การทดสอบ
- โปรเจค build สำเร็จแล้ว
- ไม่มี syntax error
- การแก้ไขครอบคลุมทุกที่ที่เรียกใช้ฟังก์ชัน `getAssistantResponse`

## หมายเหตุ
- การแก้ไขนี้ไม่กระทบต่อการทำงานของระบบ
- เอไอยังคงสร้าง JSON และข้อความตอบตาม system instructions เดิม
- เพียงแต่ไม่แสดงแท็กให้ผู้ใช้เห็นเท่านั้น
- คำสั่ง `/tag` เป็นฟีเจอร์พิเศษสำหรับการ debug และดูข้อมูล JSON
