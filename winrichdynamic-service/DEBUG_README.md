# WinRich Dynamic Service - Debug Guide

## 🔧 การแก้ไขปัญหาการหมดอายุเซสชัน

### ปัญหาที่พบ
เมื่อพยายามสร้างสินค้า ระบบแสดงข้อความว่า "เซสชันหมดอายุและให้ล็อกอินใหม่" ทั้งที่พึ่งกดล็อกอินมา (ไม่ถึง 10 นาที)

### สาเหตุของปัญหา
1. **ไฟล์ `useTokenManager` หายไป** - โค้ดพยายาม import hook ที่ไม่มีอยู่
2. **การจัดการ JWT token ไม่ถูกต้อง** - ไม่มีการตรวจสอบความถูกต้องของ token
3. **Middleware ไม่ได้จัดการ token อย่างเหมาะสม** - ขาดการตรวจสอบ token expiration
4. **การตั้งค่า cookie ไม่ถูกต้อง** - token ไม่ถูกเก็บใน cookie

### การแก้ไขที่ทำ

#### 1. สร้างไฟล์ `useTokenManager` Hook
- **ไฟล์:** `src/utils/tokenManager.ts`
- **หน้าที่:** จัดการ JWT token และการตรวจสอบความถูกต้อง
- **ฟีเจอร์:**
  - ตรวจสอบ token เมื่อโหลด component
  - ตรวจสอบความถูกต้องของ token ผ่าน API
  - จัดการการออกจากระบบ
  - แสดงสถานะ authentication

#### 2. ปรับปรุง Middleware
- **ไฟล์:** `middleware.ts`
- **การปรับปรุง:**
  - เพิ่มการตรวจสอบ token expiration
  - ปรับปรุงการจัดการ API routes
  - เพิ่ม logging สำหรับ debugging
  - จัดการ error cases ได้ดีขึ้น

#### 3. สร้าง API Endpoints
- **ไฟล์:** `src/app/api/adminb2b/validate-token/route.ts`
  - ตรวจสอบความถูกต้องของ JWT token
  - ตรวจสอบ token expiration
  - ส่งคืนข้อมูล admin

- **ไฟล์:** `src/app/api/auth/send-otp/route.ts`
  - ส่ง OTP ผ่าน DeeSMSx
  - จัดการ OTP cache

- **ไฟล์:** `src/app/api/auth/verify-otp/route.ts`
  - ยืนยัน OTP และสร้าง JWT token
  - ตั้งค่า cookie สำหรับ token

- **ไฟล์:** `src/app/api/auth/logout/route.ts`
  - จัดการการออกจากระบบ
  - ลบ cookie token

#### 4. ปรับปรุงหน้า Login
- **ไฟล์:** `src/app/adminb2b/login/page.tsx`
- **การปรับปรุง:**
  - จัดการ token ได้ดีขึ้น
  - เพิ่มการรอให้ cookie ถูกตั้งค่า
  - ปรับปรุงการ redirect

#### 5. ปรับปรุงหน้า Products
- **ไฟล์:** `src/app/adminb2b/products/page.tsx`
- **การปรับปรุง:**
  - ใช้ `useTokenManager` แทนการจัดการ token แบบเดิม
  - เพิ่มการตรวจสอบ authentication
  - ปรับปรุง UI และ UX

#### 6. สร้าง Models และ Schemas
- **ไฟล์:** `src/models/Admin.ts` - Model สำหรับ admin users
- **ไฟล์:** `src/models/Role.ts` - Model สำหรับ user roles
- **ไฟล์:** `src/models/Product.ts` - Model สำหรับสินค้า
- **ไฟล์:** `src/models/Category.ts` - Model สำหรับหมวดหมู่

#### 7. สร้าง Utility Files
- **ไฟล์:** `src/utils/phoneUtils.ts` - จัดการเบอร์โทรศัพท์
- **ไฟล์:** `src/config/deesmsx.ts` - การตั้งค่า DeeSMSx API
- **ไฟล์:** `src/lib/mongodb.ts` - การเชื่อมต่อฐานข้อมูล

### วิธีการใช้งาน

#### 1. การล็อกอิน
```typescript
// ระบบจะส่ง OTP ไปยังเบอร์โทรศัพท์
// เมื่อยืนยัน OTP สำเร็จ จะได้ JWT token
// token จะถูกเก็บใน localStorage และ cookie
```

#### 2. การตรวจสอบ Token
```typescript
// ใช้ useTokenManager hook
const { getValidToken, logout, isAuthenticated } = useTokenManager();

// ตรวจสอบ token ก่อนเรียก API
const token = await getValidToken();
if (!token) {
  logout();
  return;
}
```

#### 3. การออกจากระบบ
```typescript
// เรียก logout() function
// ระบบจะลบ token และ redirect ไปหน้า login
```

### การตั้งค่า Environment Variables

```env
# JWT Secret (สำคัญมาก)
JWT_SECRET=your_super_secret_jwt_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/winrichdynamic

# DeeSMSx
DEESMSX_API_KEY=your_api_key
DEESMSX_SECRET_KEY=your_secret_key
DEESMSX_SENDER_NAME=deeSMS.OTP
```

### การทดสอบ

#### 1. ทดสอบการล็อกอิน
- เปิดหน้า `/adminb2b/login`
- กรอกเบอร์โทรศัพท์
- ตรวจสอบว่าได้รับ OTP
- ยืนยัน OTP และเข้าสู่ระบบ

#### 2. ทดสอบการสร้างสินค้า
- ไปที่หน้า `/adminb2b/products`
- คลิก "สร้างสินค้าใหม่"
- กรอกข้อมูลสินค้า
- บันทึกและตรวจสอบว่าไม่มีการหมดอายุเซสชัน

#### 3. ทดสอบการหมดอายุเซสชัน
- รอให้ token หมดอายุ (24 ชั่วโมง)
- พยายามเรียก API
- ตรวจสอบว่าถูก redirect ไปหน้า login

### การ Debug

#### 1. ตรวจสอบ Console
```typescript
// ดู log ของ token validation
console.log('[B2B] Token validation result:', token ? 'valid' : 'invalid');
```

#### 2. ตรวจสอบ Network Tab
- ดู API calls ที่ส่งไป
- ตรวจสอบ Authorization headers
- ดู response status codes

#### 3. ตรวจสอบ Application Tab
- ดู localStorage สำหรับ `b2b_auth_token`
- ดู cookies สำหรับ `b2b_token`

### หมายเหตุสำคัญ

1. **JWT Secret** ต้องตั้งค่าใน production และต้องเป็นค่าที่ปลอดภัย
2. **Token Expiration** ตั้งไว้ที่ 24 ชั่วโมง สามารถปรับได้ตามความต้องการ
3. **Cookie Settings** ใช้ `httpOnly: true` เพื่อความปลอดภัย
4. **Error Handling** เพิ่มการจัดการ error cases ต่างๆ

### การปรับปรุงในอนาคต

1. **Redis Cache** - ใช้ Redis แทน global cache สำหรับ OTP
2. **Refresh Token** - เพิ่ม refresh token mechanism
3. **Rate Limiting** - เพิ่มการจำกัดจำนวนครั้งในการเรียก API
4. **Audit Log** - เพิ่มการบันทึกการเข้าถึงระบบ
