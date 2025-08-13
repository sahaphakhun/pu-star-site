# คู่มือการตั้งค่า Slip2Go API สำหรับระบบตรวจสอบสลิป

## ภาพรวม
ระบบตรวจสอบสลิปอัตโนมัติและแบบแมนนวลได้ถูกเพิ่มเข้ามาในหน้าแอดมิน โดยใช้ API ของ Slip2Go สำหรับตรวจสอบความถูกต้องของสลิปการโอนเงิน

## การตั้งค่า Environment Variables

### Slip2Go API Configuration
```env
SLIP2GO_API_SECRET=your_slip2go_api_secret_here
# optional override (default: https://connect.slip2go.com/api)
SLIP2GO_BASE_URL=https://connect.slip2go.com/api
```

## การขอ API Key จาก Slip2Go

### ขั้นตอนการสมัคร:
1. ไปที่เว็บไซต์ [Slip2Go](https://slip2go.com)
2. สมัครบัญชีใหม่หรือเข้าสู่ระบบ
3. ไปที่หน้า API หรือ Developer Settings
4. สร้าง API Secret ในเมนู API Connect
5. คัดลอก API Secret และใส่ในไฟล์ `.env.local` เป็น `SLIP2GO_API_SECRET`

## ฟีเจอร์ที่เพิ่มเข้ามา

### 1. การตรวจสอบสลิปอัตโนมัติ
- เมื่อลูกค้าอัปโหลดสลิปการโอนเงิน ระบบจะตรวจสอบอัตโนมัติด้วย Slip2Go API
- ผลการตรวจสอบจะถูกบันทึกในฐานข้อมูลพร้อมกับข้อมูลรายละเอียด

### 2. การตรวจสอบสลิปแบบแมนนวล
- แอดมินสามารถตรวจสอบสลิปใหม่ได้ผ่านปุ่มในหน้าแอดมิน
- รองรับการตรวจสอบสลิปหลายรายการพร้อมกัน (Batch Verification)

### 3. การแสดงผลการตรวจสอบ
- แสดงสถานะการตรวจสอบ (ผ่าน/ไม่ผ่าน)
- แสดงข้อมูลรายละเอียดจากสลิป (ธนาคาร, จำนวนเงิน, วันที่, เวลา, ฯลฯ)
- แสดงระดับความเชื่อมั่น (Confidence Score)

## การใช้งาน API

### Endpoint ที่ใช้:
- **POST** `/api/admin/slip-verification` - ตรวจสอบสลิปเดี่ยว
- **PUT** `/api/admin/slip-verification` - ตรวจสอบสลิปหลายรายการ
- **POST** `/api/orders` - สร้างออเดอร์พร้อมตรวจสอบสลิปอัตโนมัติ

### Request Format:
```typescript
// สำหรับ Slip2Go API (qr-image)
const formData = new FormData();
formData.append('file', imageBlob, 'slip.jpg');
formData.append('payload', JSON.stringify({}));

const response = await fetch(`${process.env.SLIP2GO_BASE_URL || 'https://connect.slip2go.com/api'}/verify-slip/qr-image/info`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.SLIP2GO_API_SECRET}`
  },
  body: formData
});
```

### Response Format:
```typescript
{
  success: boolean;
  data?: {
    bank: string;
    amount: number;
    date: string;
    time: string;
    transaction_id: string;
    sender_name: string;
    sender_account: string;
    receiver_name: string;
    receiver_account: string;
    slip_type: string;
    confidence: number;
  };
  error?: string;
}
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:
1. **API Key ไม่ถูกต้อง**
   - ตรวจสอบว่า API Key ถูกต้องและยังไม่หมดอายุ
   - ตรวจสอบสิทธิ์การใช้งาน API

2. **รูปภาพไม่สามารถดาวน์โหลดได้**
   - ตรวจสอบว่า URL ของรูปภาพสามารถเข้าถึงได้
   - ตรวจสอบรูปแบบไฟล์ (รองรับ JPEG, PNG)

3. **API Response Error**
   - ตรวจสอบ log ใน console เพื่อดูข้อผิดพลาด
   - ตรวจสอบว่า Slip2Go API ทำงานปกติ

### การ Debug:
- เปิด Developer Tools และดู Network tab
- ตรวจสอบ log ใน server console
- ตรวจสอบ response จาก Slip2Go API

## หมายเหตุสำคัญ

- ระบบใช้ `multipart/form-data` สำหรับส่งรูปภาพไปยัง Slip2Go API
- รูปภาพจะถูกดาวน์โหลดจาก URL ที่ให้มาแล้วส่งไปยัง Slip2Go
- ผลการตรวจสอบจะถูกบันทึกในฐานข้อมูลพร้อมกับข้อมูลรายละเอียด
- ระบบรองรับการตรวจสอบสลิปหลายรายการพร้อมกัน
