# คู่มือการแก้ไขปัญหา (Troubleshooting Guide)

## ปัญหาที่พบ: API Error 500

### สาเหตุ
ระบบเชื่อมโยงออเดอร์และผู้ใช้เกิด error 500 เนื่องจาก:
1. ฟังก์ชัน `connectToDatabase` ไม่ได้ถูก export จาก `mongodb.ts`
2. การจัดการ error ไม่ครอบคลุม
3. ขาด logging สำหรับการ debug

### การแก้ไขที่ทำไปแล้ว

#### 1. แก้ไข `src/lib/mongodb.ts`
```typescript
// เพิ่มฟังก์ชัน connectToDatabase สำหรับใช้ใน API routes
export async function connectToDatabase() {
  try {
    const connection = await connectDB();
    return connection;
  } catch (error) {
    console.error('[DB] Failed to connect to database:', error);
    throw error;
  }
}
```

#### 2. ปรับปรุง API Endpoints
- เพิ่ม logging ที่ครอบคลุม
- เพิ่ม error handling ที่ดีขึ้น
- ส่ง error response ที่มีรายละเอียดมากขึ้น

#### 3. สร้าง API ทดสอบการเชื่อมต่อ
- `/api/test-db` สำหรับทดสอบการเชื่อมต่อฐานข้อมูล
- แสดงสถานะการเข้าถึง models
- แสดงจำนวนข้อมูลในฐานข้อมูล

#### 4. สร้างคอมโพเนนต์ DatabaseStatus
- แสดงสถานะการเชื่อมต่อฐานข้อมูลแบบ real-time
- ปุ่มทดสอบการเชื่อมต่อใหม่
- แสดงรายละเอียดข้อผิดพลาด

## การทดสอบระบบ

### 1. ทดสอบการเชื่อมต่อฐานข้อมูล
```bash
# เข้าไปที่หน้า /admin/orders/mapping
# ดูคอมโพเนนต์ DatabaseStatus
# คลิกปุ่ม "ทดสอบใหม่" หากมีปัญหา
```

### 2. ทดสอบ API Endpoints
```bash
# ทดสอบการเชื่อมต่อฐานข้อมูล
GET /api/test-db

# ทดสอบ order mapping stats
GET /api/orders/mapping?action=stats

# ทดสอบการค้นหาผู้ใช้
GET /api/users/search?q=test

# ทดสอบการดึงออเดอร์ของผู้ใช้
GET /api/users/[userId]/orders
```

### 3. ตรวจสอบ Logs
ดู console logs ใน browser และ server logs เพื่อหาสาเหตุของปัญหา

## การแก้ไขปัญหาที่อาจเกิดขึ้น

### 1. ปัญหาการเชื่อมต่อฐานข้อมูล
```typescript
// ตรวจสอบ environment variables
MONGODB_URI
MONGO_URL
DATABASE_URL
MONGODB_URL
```

### 2. ปัญหาการเข้าถึง Models
```typescript
// ตรวจสอบว่า models ถูก import ถูกต้อง
import Order from '@/models/Order';
import User from '@/models/User';
```

### 3. ปัญหา CORS หรือ Network
```typescript
// ตรวจสอบการตั้งค่า CORS ใน next.config.js
// ตรวจสอบ network requests ใน browser dev tools
```

## การ Debug

### 1. เปิด Developer Tools
- ดู Console สำหรับ error messages
- ดู Network tab สำหรับ API requests
- ดู Application tab สำหรับ environment variables

### 2. ตรวจสอบ Server Logs
```bash
# ดู logs ใน production environment
# ตรวจสอบ error messages และ stack traces
```

### 3. ใช้ API Testing Tools
- Postman
- Insomnia
- Browser Dev Tools

## การป้องกันปัญหาในอนาคต

### 1. เพิ่ม Error Boundaries
```typescript
// สร้าง error boundaries สำหรับ React components
// จัดการ errors ที่เกิดขึ้นใน UI
```

### 2. เพิ่ม Monitoring
```typescript
// ใช้ monitoring tools เช่น Sentry
// ติดตาม performance และ errors
```

### 3. เพิ่ม Unit Tests
```typescript
// ทดสอบ API endpoints
// ทดสอบ database connections
// ทดสอบ error handling
```

## สถานะปัจจุบัน

✅ **แก้ไขแล้ว:**
- ฟังก์ชัน `connectToDatabase` ใน `mongodb.ts`
- Error handling ใน API endpoints
- Logging และ debugging
- API ทดสอบการเชื่อมต่อฐานข้อมูล
- คอมโพเนนต์แสดงสถานะฐานข้อมูล

🔄 **กำลังดำเนินการ:**
- การทดสอบระบบหลังการแก้ไข
- การตรวจสอบ performance
- การปรับปรุง UI/UX

📋 **แผนการต่อไป:**
- เพิ่ม error boundaries
- เพิ่ม monitoring
- เพิ่ม unit tests
- การปรับปรุง performance

## การติดต่อเพื่อขอความช่วยเหลือ

หากยังพบปัญหาหลังจากทำตามคู่มือนี้:

1. **ตรวจสอบ Logs** - ดู console และ server logs
2. **ทดสอบ API** - ใช้ `/api/test-db` เพื่อตรวจสอบฐานข้อมูล
3. **ตรวจสอบ Environment** - ดู environment variables
4. **รายงานปัญหา** - ส่งรายงานพร้อม error messages และ logs
