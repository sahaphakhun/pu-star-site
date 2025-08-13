# การแก้ไขปัญหา Google API 401 Error

## ปัญหาที่เกิดขึ้น
ระบบเกิดข้อผิดพลาด `Sheets meta HTTP 401: UNAUTHENTICATED` เมื่อพยายามเข้าถึง Google Sheets API

## สาเหตุของปัญหา
1. **Service Account ไม่มีสิทธิ์เข้าถึง Google Sheets** ที่ระบุ
2. **Private Key หมดอายุหรือไม่ถูกต้อง**
3. **Google Sheets ไม่ได้แชร์ให้ Service Account**
4. **Google API Quota หมด**

## การแก้ไขที่ทำไปแล้ว

### 1. เพิ่ม Error Handling
- ใช้ `try-catch` ในทุกฟังก์ชัน Google API
- ใช้ `Promise.allSettled()` แทน `Promise.all()` เพื่อไม่ให้ระบบล่ม
- เพิ่ม logging สำหรับ debug

### 2. เพิ่ม Fallback Mode
- สร้างฟังก์ชัน `getFallbackInstructions()` สำหรับกรณี Google API ไม่พร้อมใช้งาน
- ใช้ `buildEnhancedSystemInstructions()` ที่มี fallback
- ระบบจะทำงานได้แม้ Google API มีปัญหา

### 3. ปรับปรุง Cache Management
- ใช้ข้อมูลเดิมเมื่อ Google API ไม่พร้อมใช้งาน
- เพิ่มฟังก์ชัน `checkGoogleAPIStatus()` สำหรับตรวจสอบสถานะ
- เพิ่มฟังก์ชัน `isFallbackMode()` สำหรับตรวจสอบ fallback mode

## วิธีแก้ไขปัญหา Google API

### 1. ตรวจสอบ Service Account
```bash
# ตรวจสอบว่า Service Account ยังใช้งานได้
# ไปที่ Google Cloud Console > IAM & Admin > Service Accounts
```

### 2. ตรวจสอบสิทธิ์ Google Sheets
```bash
# แชร์ Google Sheets ให้ Service Account
# ใช้ email: aitar-888@eminent-wares-446512-j8.iam.gserviceaccount.com
# ตั้งสิทธิ์เป็น "Viewer" หรือ "Editor"
```

### 3. สร้าง Private Key ใหม่
```bash
# ไปที่ Google Cloud Console > IAM & Admin > Service Accounts
# เลือก Service Account > Keys > Add Key > Create new key
# เลือก JSON format และดาวน์โหลด
# อัปเดต GOOGLE_PRIVATE_KEY ในไฟล์
```

### 4. ตรวจสอบ Google API Quota
```bash
# ไปที่ Google Cloud Console > APIs & Services > Dashboard
# ตรวจสอบ Google Sheets API และ Google Docs API
# ดูว่า quota ยังเหลือหรือไม่
```

## การทดสอบระบบ

### 1. ทดสอบ Google API Status
```typescript
import { checkGoogleAPIStatus } from '@/utils/openai-utils';

const status = await checkGoogleAPIStatus();
console.log('Google API Status:', status);
```

### 2. ทดสอบ Fallback Mode
```typescript
import { isFallbackMode } from '@/utils/openai-utils';

const isFallback = isFallbackMode();
console.log('Is Fallback Mode:', isFallback);
```

### 3. ทดสอบ AI Response
```typescript
import { getAssistantResponse } from '@/utils/openai-utils';

const response = await getAssistantResponse(
  'Basic instructions',
  [],
  'สวัสดีค่ะ'
);
console.log('AI Response:', response);
```

## ข้อควรระวัง

1. **อย่าลบ error handling** ที่เพิ่มเข้าไปใหม่
2. **ตรวจสอบ Google API Quota** เป็นประจำ
3. **Backup Private Key** ไว้เสมอ
4. **ทดสอบระบบ** หลังแก้ไขทุกครั้ง

## สถานะปัจจุบัน

✅ **Error Handling** - เพิ่มแล้ว  
✅ **Fallback Mode** - เพิ่มแล้ว  
✅ **Cache Management** - ปรับปรุงแล้ว  
✅ **Logging** - เพิ่มแล้ว  
⚠️ **Google API Access** - ต้องตรวจสอบสิทธิ์  

## ขั้นตอนต่อไป

1. ตรวจสอบสิทธิ์ Service Account ใน Google Sheets
2. สร้าง Private Key ใหม่ถ้าจำเป็น
3. ทดสอบระบบหลังแก้ไข
4. Monitor error logs เพื่อดูว่าปัญหาหายไปหรือไม่
