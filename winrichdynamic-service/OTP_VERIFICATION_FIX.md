# การแก้ไขปัญหา OTP Verification ใน B2B Service

## 🐛 ปัญหาที่พบ

```
POST https://www.b2b.winrichdynamic.com/api/adminb2b/register/verify-otp 500 (Internal Server Error)
```

## 🔍 สาเหตุของปัญหา

1. **ใช้ Global Cache แทนฐานข้อมูล**: B2B Service ใช้ global cache (`global.registerOtpCache`) แทนที่จะใช้ฐานข้อมูล
2. **การจัดการ OTP ไม่ถูกต้อง**: ใช้ `result.result.ref` เป็น OTP แทนที่จะใช้ token สำหรับ verify
3. **ไม่มี OTPVerification Model**: B2B ไม่มี model สำหรับเก็บข้อมูล OTP ในฐานข้อมูล
4. **การตรวจสอบ OTP ไม่ตรงกับโปรเจ็กหลัก**: ใช้วิธีการตรวจสอบที่แตกต่างจากโปรเจ็กหลักที่ทำงานได้

## ✅ การแก้ไขที่ทำ

### 1. สร้าง OTPVerification Model

**ไฟล์:** `src/models/OTPVerification.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IOTPVerification extends Document {
  phoneNumber: string;
  token: string;      // token จาก DeeSMSx
  ref: string;        // ref จาก DeeSMSx
  requestNo: string;  // requestNo จาก DeeSMSx
  createdAt: Date;
  expiresAt: Date;
}

const OTPVerificationSchema: Schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?66\d{9}$/, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง'],
  },
  token: { type: String, required: true },
  ref: { type: String, required: true },
  requestNo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// Indexes และ TTL
OTPVerificationSchema.index({ phoneNumber: 1 });
OTPVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OTPVerification || mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema);
```

### 2. แก้ไขไฟล์ Send OTP

**ไฟล์:** `src/app/api/adminb2b/register/send-otp/route.ts`

**เปลี่ยนจาก:**
- ใช้ global cache
- เก็บข้อมูลใน memory

**เปลี่ยนเป็น:**
- ใช้ฐานข้อมูล OTPVerification
- ตรวจสอบ OTP เก่าก่อนส่งใหม่
- เก็บ token, ref, requestNo ในฐานข้อมูล

### 3. แก้ไขไฟล์ Verify OTP

**ไฟล์:** `src/app/api/adminb2b/register/verify-otp/route.ts`

**เปลี่ยนจาก:**
- ตรวจสอบ OTP จาก global cache
- ใช้ ref เป็น OTP

**เปลี่ยนเป็น:**
- ตรวจสอบ OTP จากฐานข้อมูล
- ใช้ token สำหรับ verifyOTP
- ลบ OTP record หลังจาก verify สำเร็จ

## 🔄 การทำงานใหม่

### 1. การส่ง OTP
```
1. รับคำขอส่ง OTP
2. เชื่อมต่อฐานข้อมูล
3. ตรวจสอบ OTP เก่า (ถ้ามี)
4. ส่งคำขอไปยัง DeeSMSx API
5. เก็บ token, ref, requestNo ในฐานข้อมูล
6. ส่งผลลัพธ์กลับ
```

### 2. การยืนยัน OTP
```
1. รับคำขอยืนยัน OTP
2. เชื่อมต่อฐานข้อมูล
3. ค้นหา OTP record จากเบอร์โทรศัพท์
4. ตรวจสอบว่า OTP หมดอายุหรือไม่
5. ใช้ verifyOTP(token, otp) กับ DeeSMSx
6. สร้าง admin ใหม่
7. ลบ OTP record
8. ส่งผลลัพธ์กลับ
```

## 🧪 การทดสอบ

### 1. ทดสอบการส่ง OTP
```bash
# ทดสอบส่ง OTP
curl -X POST https://www.b2b.winrichdynamic.com/api/adminb2b/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "0812345678",
    "email": "test@example.com",
    "company": "Test Company",
    "role": "admin"
  }'
```

### 2. ทดสอบการยืนยัน OTP
```bash
# ทดสอบยืนยัน OTP
curl -X POST https://www.b2b.winrichdynamic.com/api/adminb2b/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "0812345678",
    "email": "test@example.com",
    "company": "Test Company",
    "role": "admin",
    "otp": "123456"
  }'
```

## 📊 การตรวจสอบ Logs

### Logs ที่ควรเห็นเมื่อส่ง OTP สำเร็จ:
```
[B2B] กำลังบันทึกข้อมูล OTP ลงฐานข้อมูล
[B2B] บันทึกข้อมูล OTP สำเร็จ
[B2B] Registration OTP sent to 66812345678: 123456
```

### Logs ที่ควรเห็นเมื่อยืนยัน OTP สำเร็จ:
```
[B2B] New admin registered: Test User (66812345678)
```

## 🔧 การตั้งค่าใน Railway

ตรวจสอบ Environment Variables ใน Railway:

1. ไปที่ Railway Dashboard
2. เลือก B2B Service
3. ไปที่ Variables tab
4. ตรวจสอบ/เพิ่ม:
   - `MONGODB_URI`
   - `DEESMSX_API_KEY`
   - `DEESMSX_SECRET_KEY`
   - `DEESMSX_SENDER_NAME`
   - `DEESMSX_BASE_URL`

## 📝 หมายเหตุสำคัญ

1. **ฐานข้อมูล**: ใช้ MongoDB แทน global cache เพื่อความเสถียร
2. **TTL Index**: OTP จะถูกลบอัตโนมัติเมื่อหมดอายุ
3. **Token vs Ref**: ใช้ token สำหรับ verifyOTP ไม่ใช่ ref
4. **Error Handling**: มีการจัดการ error ที่ดีขึ้น

## 🚀 การ Deploy

หลังจากแก้ไขแล้ว:

1. Commit การเปลี่ยนแปลง
2. Push ไปยัง repository
3. Railway จะ deploy อัตโนมัติ
4. ตรวจสอบ logs ใน Railway เพื่อยืนยันว่าทำงานได้

## 📞 การติดต่อ

หากยังมีปัญหา กรุณาติดต่อทีมพัฒนา พร้อมส่ง:
- Error logs
- Environment variables ที่ใช้ (ไม่รวม sensitive data)
- ขั้นตอนการทดสอบที่ทำ
