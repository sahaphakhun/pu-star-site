# ระบบตรวจสอบสลิป Slip2Go - README

## ภาพรวม
ระบบตรวจสอบสลิปอัตโนมัติและแบบแมนนวลได้ถูกเพิ่มเข้ามาในหน้าแอดมิน โดยใช้ API ของ Slip2Go สำหรับตรวจสอบความถูกต้องของสลิปการโอนเงิน

## ไฟล์ที่เพิ่ม/แก้ไข

### ไฟล์ใหม่:
1. **`src/app/api/admin/slip-verification/route.ts`** - API endpoint สำหรับตรวจสอบสลิป
2. **`src/components/SlipVerificationDisplay.tsx`** - Component แสดงผลการตรวจสอบสลิป
3. **`src/components/SlipVerificationButton.tsx`** - Component ปุ่มตรวจสอบสลิป
4. **`src/components/BatchSlipVerification.tsx`** - Component ตรวจสอบสลิปแบบกลุ่ม
5. **`SLIP2GO_SETUP.md`** - คู่มือการตั้งค่า Slip2Go API

### ไฟล์ที่แก้ไข:
1. **`src/models/Order.ts`** - เพิ่ม field `slipVerification`
2. **`src/app/(shop)/admin/orders/page.tsx`** - เพิ่ม UI สำหรับตรวจสอบสลิป
3. **`src/app/api/orders/route.ts`** - เพิ่มการตรวจสอบสลิปอัตโนมัติ

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

## การตั้งค่า

### Environment Variables
```env
SLIP2GO_API_SECRET=your_slip2go_api_secret_here
# optional override (default: https://connect.slip2go.com/api)
SLIP2GO_BASE_URL=https://connect.slip2go.com/api
```

### ขั้นตอนการตั้งค่า:
1. ไปที่ [Slip2Go](https://slip2go.com)
2. สมัครบัญชีและขอ API Secret (API Connect)
3. ใส่ API Secret ในไฟล์ `.env.local` ตัวแปร `SLIP2GO_API_SECRET`

## โครงสร้างข้อมูล

### SlipVerification Interface
```typescript
interface ISlipVerification {
  verified: boolean;
  verifiedAt: Date;
  verificationType: 'manual' | 'automatic' | 'batch';
  verifiedBy: string;
  slip2GoData?: {
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
  confidence: number;
}
```

## API Endpoints

### 1. ตรวจสอบสลิปเดี่ยว
- **POST** `/api/admin/slip-verification`
- **Body**: `{ orderId: string, slipUrl: string, verificationType?: string }`

### 2. ตรวจสอบสลิปหลายรายการ
- **PUT** `/api/admin/slip-verification`
- **Body**: `{ orderIds: string[] }`

### 3. สร้างออเดอร์พร้อมตรวจสอบสลิป
- **POST** `/api/orders`
- **Body**: `{ ..., paymentMethod: 'transfer', slipUrl: string }`

## การใช้งาน Slip2Go API

### Request Format:
```typescript
// ใช้ multipart/form-data สำหรับส่งรูปภาพ
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

## การใช้งานในหน้าแอดมิน

### 1. ปุ่มตรวจสอบสลิป
- แสดงในคอลัมน์ "จัดการ" สำหรับออเดอร์ที่มีการโอนเงิน
- คลิกเพื่อตรวจสอบสลิปใหม่

### 2. การตรวจสอบแบบกลุ่ม
- ปุ่ม "ตรวจสอบสลิปแบบกลุ่ม" ที่ด้านบนของหน้า
- แสดงจำนวนออเดอร์ที่ต้องตรวจสอบ
- แสดงความคืบหน้าในการตรวจสอบ

### 3. แสดงผลการตรวจสอบ
- ในโมดัลรายละเอียดออเดอร์
- แสดงรูปสลิปและผลการตรวจสอบ
- แสดงข้อมูลรายละเอียดจาก Slip2Go

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:
1. **API Key ไม่ถูกต้อง** - ตรวจสอบ SLIP2GO_API_KEY
2. **รูปภาพไม่สามารถดาวน์โหลดได้** - ตรวจสอบ URL ของรูปภาพ
3. **API Response Error** - ตรวจสอบ log ใน console

### การ Debug:
- เปิด Developer Tools และดู Network tab
- ตรวจสอบ log ใน server console
- ตรวจสอบ response จาก Slip2Go API

## หมายเหตุสำคัญ

- ระบบใช้ `multipart/form-data` สำหรับส่งรูปภาพไปยัง Slip2Go API
- รูปภาพจะถูกดาวน์โหลดจาก URL ที่ให้มาแล้วส่งไปยัง Slip2Go
- ผลการตรวจสอบจะถูกบันทึกในฐานข้อมูลพร้อมกับข้อมูลรายละเอียด
- ระบบรองรับการตรวจสอบสลิปหลายรายการพร้อมกัน
- การตรวจสอบอัตโนมัติจะทำงานเมื่อสร้างออเดอร์ใหม่ที่มีการโอนเงินและมีสลิป
