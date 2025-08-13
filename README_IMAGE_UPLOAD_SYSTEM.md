# ระบบอัปโหลดภาพสำหรับ Facebook Messenger

## ภาพรวม

ระบบนี้แก้ไขปัญหาการส่งรูปภาพใน Facebook Messenger โดยการโหลดภาพจาก URL ภายนอกมาไว้บนเซิร์ฟเวอร์ก่อน แล้วส่งให้ Facebook ผ่าน URL ของเซิร์ฟเวอร์เอง

## ปัญหาที่แก้ไข

1. **Timeout Error**: ไม่ต้องรอการตรวจสอบ URL จากภายนอก
2. **Accessibility Issues**: แก้ปัญหาการเข้าถึง URL จาก Facebook
3. **Robots.txt Issues**: หลีกเลี่ยงปัญหาการเข้าถึง robots.txt ของเว็บไซต์อื่น
4. **Reliability**: เพิ่มความน่าเชื่อถือในการส่งรูปภาพ

## โครงสร้างไฟล์

```
src/
├── app/api/messenger/
│   ├── upload-image/route.ts      # API สำหรับอัปโหลดภาพ
│   └── cleanup-images/route.ts    # API สำหรับลบไฟล์เก่า
├── utils/
│   └── messenger-utils.ts         # ปรับปรุงฟังก์ชันส่งภาพ
public/
└── images/
    └── ai-uploads/                # โฟลเดอร์เก็บภาพที่อัปโหลด
```

## การทำงาน

### 1. เมื่อพบ [SEND_IMAGE:url]

```typescript
// 1. เรียกใช้ uploadImageToServer()
const uploadedUrl = await uploadImageToServer(imageUrl);

// 2. ถ้าอัปโหลดสำเร็จ ใช้ URL ใหม่
if (uploadedUrl) {
  finalImageUrl = uploadedUrl;
}

// 3. ส่งภาพให้ Facebook
await callSendAPI(recipientId, {
  attachment: {
    type: 'image',
    payload: { url: finalImageUrl, is_reusable: true }
  }
});
```

### 2. กระบวนการอัปโหลด

1. **โหลดภาพ**: ดึงภาพจาก URL ภายนอก
2. **สร้างชื่อไฟล์**: สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
3. **บันทึกไฟล์**: บันทึกลงใน `public/images/ai-uploads/`
4. **สร้าง URL**: สร้าง URL ใหม่ที่ชี้ไปยังไฟล์บนเซิร์ฟเวอร์
5. **ส่งภาพ**: ส่งภาพให้ Facebook ผ่าน URL ใหม่

### 3. การทำความสะอาด

- ลบไฟล์ที่เก่ากว่า 24 ชั่วโมง
- เรียกใช้ผ่าน API `/api/messenger/cleanup-images`
- สามารถตั้งค่า cron job ให้ทำงานอัตโนมัติ

## การตั้งค่า

### 1. Environment Variables

เพิ่มในไฟล์ `.env.local`:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 2. สร้างโฟลเดอร์

```bash
mkdir -p public/images/ai-uploads
```

### 3. ตั้งค่า Cron Job (Optional)

```bash
# ทุกวันเวลา 02:00 น.
0 2 * * * curl -X POST https://your-domain.com/api/messenger/cleanup-images
```

## API Endpoints

### POST /api/messenger/upload-image

**Request:**
```json
{
  "imageUrl": "https://i.ibb.co/QjNcSBdT/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "localUrl": "https://your-domain.com/images/ai-uploads/ai-image-1234567890-abc123.jpg",
  "originalUrl": "https://i.ibb.co/QjNcSBdT/image.jpg",
  "filename": "ai-image-1234567890-abc123.jpg"
}
```

### POST /api/messenger/cleanup-images

**Response:**
```json
{
  "success": true,
  "deletedCount": 5,
  "remainingFiles": 10
}
```

## ข้อดี

1. **ความเร็ว**: ภาพอยู่บนเซิร์ฟเวอร์เดียวกันกับ Facebook
2. **ความน่าเชื่อถือ**: ไม่ขึ้นกับการเข้าถึง URL ภายนอก
3. **การควบคุม**: สามารถจัดการไฟล์และลบไฟล์เก่าได้
4. **Fallback**: ถ้าอัปโหลดไม่สำเร็จ จะใช้ URL เดิม
5. **ความปลอดภัย**: ตรวจสอบและทำความสะอาดไฟล์อัตโนมัติ

## การแก้ไขปัญหา

### ถ้าอัปโหลดไม่สำเร็จ

1. ตรวจสอบ `NEXT_PUBLIC_BASE_URL` ว่าถูกต้อง
2. ตรวจสอบสิทธิ์การเขียนไฟล์ใน `public/images/ai-uploads/`
3. ตรวจสอบ log ใน console

### ถ้า Facebook ยังไม่สามารถเข้าถึงได้

1. ตรวจสอบ robots.txt ของเซิร์ฟเวอร์
2. ตรวจสอบ CORS settings
3. ตรวจสอบ SSL certificate

## การทดสอบ

```bash
# ทดสอบอัปโหลดภาพ
curl -X POST https://your-domain.com/api/messenger/upload-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://i.ibb.co/QjNcSBdT/image.jpg"}'

# ทดสอบทำความสะอาด
curl -X POST https://your-domain.com/api/messenger/cleanup-images
```

## หมายเหตุ

- ระบบจะทำงานอัตโนมัติเมื่อพบ `[SEND_IMAGE:url]`
- ไฟล์จะถูกลบอัตโนมัติหลังจาก 24 ชั่วโมง
- ถ้าอัปโหลดไม่สำเร็จ จะใช้ URL เดิมเป็น fallback
- ระบบรองรับการอัปโหลดภาพหลายรูปแบบ (jpg, png, gif, webp)
