# ระบบ [cut] และ [SEND_IMAGE:...] สำหรับ Facebook Messenger Bot

## 📋 ภาพรวม

ระบบนี้ช่วยให้ Facebook Messenger Bot สามารถส่งข้อความที่มีรูปภาพและวิดีโอได้อย่างเป็นระบบ โดยใช้คำสั่งพิเศษในข้อความ

## 🚀 คุณสมบัติหลัก

### 1. ระบบ [cut]
- แบ่งข้อความเป็นส่วนๆ เพื่อส่งทีละส่วน
- จำกัดจำนวนส่วนไม่เกิน 10 ส่วน
- รอระหว่างการส่งแต่ละส่วนเพื่อความเสถียร

### 2. ระบบ [SEND_IMAGE:...]
- ส่งรูปภาพจาก URL ที่ระบุ
- รองรับหลายรูปภาพในข้อความเดียว
- ส่งรูปภาพก่อนข้อความเสมอ

### 3. ระบบ [SEND_VIDEO:...]
- ส่งวิดีโอจาก URL ที่ระบุ
- รองรับหลายวิดีโอในข้อความเดียว
- ส่งวิดีโอก่อนข้อความเสมอ

## 📝 รูปแบบการใช้งาน

### ข้อความธรรมดา
```
สวัสดีค่ะ ยินดีให้บริการค่ะ
```

### ข้อความที่มี [cut]
```
สวัสดีค่ะ

[cut]
นี่คือส่วนที่ 1

[cut]
นี่คือส่วนที่ 2

ขอบคุณค่ะ
```

### ข้อความที่มีรูปภาพ
```
สวัสดีค่ะ

นี่คือสินค้าของเรา:

[SEND_IMAGE:https://i.imgur.com/product1.jpg]
สินค้าชิ้นที่ 1

[SEND_IMAGE:https://i.imgur.com/product2.jpg]
สินค้าชิ้นที่ 2
```

### ข้อความผสม
```
สวัสดีค่ะ

[cut]
[SEND_IMAGE:https://i.imgur.com/welcome.jpg]
ข้อความต้อนรับ

[cut]
นี่คือส่วนข้อความธรรมดา

[cut]
[SEND_IMAGE:https://i.imgur.com/product.jpg]
[SEND_VIDEO:https://i.imgur.com/demo.mp4]
สินค้าพร้อมรูปภาพและวิดีโอ
```

## 🔧 การติดตั้ง

### 1. Import ฟังก์ชันที่จำเป็น
```typescript
import { 
  sendSmartMessage, 
  hasCutOrImageCommands,
  parseCutSegments,
  countMediaInText 
} from '@/utils/messenger-utils';
```

### 2. ใช้ฟังก์ชันหลัก
```typescript
// ส่งข้อความแบบ smart (เลือกวิธีที่เหมาะสม)
await sendSmartMessage(recipientId, aiResponse);

// ตรวจสอบว่าต้องใช้ระบบ [cut] หรือไม่
if (hasCutOrImageCommands(answer)) {
  await sendSmartMessage(psid, answer);
  // ส่ง quick replies แยก
  await callSendAPI(psid, {
    text: '',
    quick_replies: [...]
  });
} else {
  // ข้อความธรรมดา
  await callSendAPI(psid, {
    text: answer,
    quick_replies: [...]
  });
}
```

## 📊 ฟังก์ชันที่ใช้ได้

### sendSmartMessage(recipientId, response)
- ฟังก์ชันหลักสำหรับส่งข้อความ
- ตรวจสอบอัตโนมัติว่าต้องใช้ระบบ [cut] หรือไม่
- เลือกวิธีส่งที่เหมาะสม

### hasCutOrImageCommands(text)
- ตรวจสอบว่าข้อความมีคำสั่ง [cut], [SEND_IMAGE:...] หรือ [SEND_VIDEO:...] หรือไม่
- คืนค่า `true` หรือ `false`

### countMediaInText(text)
- นับจำนวนรูปภาพและวิดีโอในข้อความ
- คืนค่า `{ images: number, videos: number }`

### parseCutSegments(text)
- แยกข้อความเป็นส่วนๆ ตาม [cut]
- คืนค่า `{ segments: string[], totalImages: number, totalVideos: number }`

### sendBatchMessage(recipientId, segments)
- ส่งข้อความแบบ batch (หลายส่วนพร้อมกัน)
- เหมาะสำหรับข้อความที่ต้องการความเร็ว

## ⚙️ การตั้งค่า

### Timeout และ Delay
```typescript
// รอระหว่างการส่งรูปภาพ
await new Promise(resolve => setTimeout(resolve, 500));

// รอระหว่างการส่งข้อความ
await new Promise(resolve => setTimeout(resolve, 300));

// รอระหว่างส่วนต่างๆ
await new Promise(resolve => setTimeout(resolve, 1000));
```

### จำกัดจำนวนส่วน
```typescript
// จำกัดจำนวนส่วนไม่เกิน 10 ส่วน
if (segments.length > 10) {
  segments = segments.slice(0, 10);
}
```

## 🔍 การ Debug

### Log ที่แสดง
```
[DEBUG] sendTextMessageWithCutAndImages => raw response: ...
[DEBUG] Processing 3 segments
[DEBUG] Processing segment 1/3: ...
[DEBUG] Segment 1: 2 images, 0 videos, text length: 45
[DEBUG] Sending image: https://i.imgur.com/example1.jpg
[DEBUG] Image sent successfully
[DEBUG] Sending text part: สวัสดีค่ะ...
[DEBUG] Text message sent successfully
[DEBUG] Waiting between segments...
[DEBUG] Completed sending all 3 segments
```

### ตรวจสอบข้อความ
```typescript
// ทดสอบการแยกส่วน
const parsed = parseCutSegments(aiResponse);
console.log("จำนวนส่วน:", parsed.segments.length);
console.log("จำนวนรูปภาพ:", parsed.totalImages);
console.log("จำนวนวิดีโอ:", parsed.totalVideos);

// ทดสอบการนับ media
const mediaCount = countMediaInText(aiResponse);
console.log("จำนวนรูปภาพ:", mediaCount.images);
console.log("จำนวนวิดีโอ:", mediaCount.videos);
```

## 🚨 ข้อควรระวัง

### 1. URL ที่ถูกต้อง
- ต้องเป็น URL ที่ถูกต้องและเข้าถึงได้
- รองรับ HTTP และ HTTPS
- ควรเป็นรูปภาพหรือวิดีโอที่ Facebook รองรับ

### 2. ขนาดไฟล์
- รูปภาพ: ขนาดแนะนำไม่เกิน 10MB
- วิดีโอ: ขนาดแนะนำไม่เกิน 100MB
- ระยะเวลาวิดีโอ: ไม่เกิน 10 นาที

### 3. Rate Limiting
- Facebook มีข้อจำกัดการส่งข้อความ
- ระบบรอระหว่างการส่งเพื่อหลีกเลี่ยง rate limiting
- ควรจำกัดจำนวนรูปภาพและวิดีโอในข้อความเดียว

## 📈 ประสิทธิภาพ

### การส่งแบบ Sequential
- ส่งทีละส่วนตามลำดับ
- รอระหว่างการส่งเพื่อความเสถียร
- เหมาะสำหรับข้อความที่มีรูปภาพจำนวนมาก

### การส่งแบบ Batch
- ส่งหลายส่วนพร้อมกัน
- เร็วกว่าแต่เสี่ยงต่อ rate limiting
- เหมาะสำหรับข้อความสั้นๆ

## 🔄 การอัปเดต

### เวอร์ชันปัจจุบัน
- รองรับ [cut], [SEND_IMAGE:...], [SEND_VIDEO:...]
- ระบบ smart message ที่เลือกวิธีส่งที่เหมาะสม
- การจัดการ error และ retry

### แผนการพัฒนาต่อ
- รองรับไฟล์แนบประเภทอื่น (เอกสาร, เสียง)
- ระบบ cache รูปภาพและวิดีโอ
- การจัดการ URL ที่หมดอายุ

## 📞 การสนับสนุน

หากมีปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา

---

**หมายเหตุ**: ระบบนี้ถูกออกแบบมาเพื่อทำงานร่วมกับ Facebook Messenger Bot และต้องการ Facebook Page Access Token ที่ถูกต้อง
