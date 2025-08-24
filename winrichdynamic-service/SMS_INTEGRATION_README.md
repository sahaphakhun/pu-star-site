# การเชื่อมต่อ SMS Service (DeeSMSx) ใน B2B Service

## 📱 ภาพรวม

ระบบ B2B service ได้เชื่อมต่อกับ **DeeSMSx SMS service** เพื่อส่ง OTP สำหรับการยืนยันตัวตนผ่านเบอร์โทรศัพท์

## 🔧 การติดตั้ง

### 1. Environment Variables

เพิ่ม environment variables ต่อไปนี้ในไฟล์ `.env`:

```env
# SMS Configuration (DeeSMSx)
DEESMSX_API_KEY=your_deesmsx_api_key_here
DEESMSX_SECRET_KEY=your_deesmsx_secret_key_here
DEESMSX_SENDER_NAME=deeSMS.OTP
```

### 2. รับ API Keys จาก DeeSMSx

1. สมัครบัญชีที่ [DeeSMSx](https://deesmsx.com)
2. รับ API Key และ Secret Key
3. ตั้งค่า Sender Name ที่ได้รับอนุมัติ

## 🚀 การใช้งาน

### การส่ง OTP

```typescript
import { requestOTP } from '@/utils/deesmsx';

// ส่ง OTP ไปยังเบอร์โทรศัพท์
const result = await requestOTP('0812345678');
console.log('OTP Token:', result.result.token);
console.log('OTP Ref:', result.result.ref);
```

### การยืนยัน OTP

```typescript
import { verifyOTP } from '@/utils/deesmsx';

// ยืนยัน OTP
const result = await verifyOTP(token, '123456');
```

### การส่ง SMS ทั่วไป

```typescript
import { sendSMS } from '@/utils/deesmsx';

// ส่ง SMS ข้อความทั่วไป
const result = await sendSMS('0812345678', 'ข้อความที่ต้องการส่ง');
```

## 📁 โครงสร้างไฟล์

```
winrichdynamic-service/
├── src/
│   ├── config/
│   │   └── deesmsx.ts          # Configuration สำหรับ DeeSMSx
│   ├── utils/
│   │   └── deesmsx.ts          # Utility functions สำหรับ SMS
│   └── app/
│       └── api/
│           └── auth/
│               ├── send-otp/    # API ส่ง OTP
│               └── verify-otp/  # API ยืนยัน OTP
```

## 🔒 ความปลอดภัย

- OTP หมดอายุใน 5 นาที
- จำกัดการลอง OTP ไม่เกิน 3 ครั้ง
- ใช้ JWT token สำหรับ authentication
- ตรวจสอบ API response จาก DeeSMSx

## 📊 การทำงานของระบบ

### 1. ขอ OTP
```
User → B2B Service → DeeSMSx API → SMS to User
```

### 2. ยืนยัน OTP
```
User → B2B Service → DeeSMSx API → Verify OTP → JWT Token
```

### 3. ใช้งานระบบ
```
User → B2B Service (with JWT) → Protected APIs
```

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **API Key ไม่ถูกต้อง**
   ```
   Error: DeeSMSx API Error: Invalid API Key
   ```
   **วิธีแก้:** ตรวจสอบ DEESMSX_API_KEY และ DEESMSX_SECRET_KEY

2. **Sender Name ไม่ได้รับอนุมัติ**
   ```
   Error: DeeSMSx API Error: Sender not approved
   ```
   **วิธีแก้:** ติดต่อ DeeSMSx เพื่ออนุมัติ Sender Name

3. **เครดิตหมด**
   ```
   Error: DeeSMSx API Error: Insufficient credit
   ```
   **วิธีแก้:** เติมเครดิตในบัญชี DeeSMSx

4. **เบอร์โทรศัพท์ไม่ถูกต้อง**
   ```
   Error: Invalid phone number format
   ```
   **วิธีแก้:** ตรวจสอบรูปแบบเบอร์โทรศัพท์ (08xxxxxxxx)

## 📞 การติดต่อ

- **DeeSMSx Support:** support@deesmsx.com
- **B2B Service Team:** [ติดต่อทีมพัฒนา]

## 📝 หมายเหตุ

- ระบบนี้ใช้ DeeSMSx service เหมือนกับโปรเจ็กหลัก
- OTP จะถูกส่งผ่าน SMS จริง ไม่ใช่ mock
- ใน production ควรใช้ Redis หรือ database แทน memory cache
- ระบบรองรับภาษาไทยและอังกฤษ

---

## 🔄 การอัปเดต

### เวอร์ชัน 1.0.0
- ✅ เชื่อมต่อกับ DeeSMSx API
- ✅ ส่ง OTP ผ่าน SMS
- ✅ ยืนยัน OTP ผ่าน API
- ✅ ระบบ authentication ด้วย JWT
- ✅ การจัดการ cache และ expiration
