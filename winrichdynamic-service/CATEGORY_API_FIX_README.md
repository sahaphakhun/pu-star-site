# การแก้ไขปัญหาการสร้างหมวดหมู่ (Category API)

## 🐛 ปัญหาที่พบ
- POST https://www.b2b.winrichdynamic.com/api/categories 500 (Internal Server Error)
- ไม่สามารถสร้างหมวดหมู่ใหม่ได้

## 🔧 การแก้ไขที่ทำ

### 1. สร้าง Schema Validation
**ไฟล์:** `src/schemas/category.ts`
- เพิ่ม Zod schema สำหรับ validation ข้อมูล
- ตรวจสอบความยาวของชื่อและคำอธิบาย
- แยก schema สำหรับการสร้างและอัปเดต

### 2. ปรับปรุง API Route หลัก
**ไฟล์:** `src/app/api/categories/route.ts`
- เพิ่ม schema validation ด้วย Zod
- ปรับปรุง error handling
- เพิ่มการจัดการ MongoDB errors เฉพาะ
- เพิ่ม logging ที่ดีขึ้น

### 3. ปรับปรุงโมเดล Category
**ไฟล์:** `src/models/Category.ts`
- เพิ่ม validation rules ใน schema
- ปรับปรุง slug generation
- เพิ่มการจัดการ duplicate slug
- เพิ่ม error messages ที่ชัดเจน

### 4. สร้าง API Endpoint สำหรับ CRUD
**ไฟล์:** `src/app/api/categories/[id]/route.ts`
- GET: ดึงข้อมูลหมวดหมู่เฉพาะ
- PUT: อัปเดตหมวดหมู่
- DELETE: ลบหมวดหมู่ (soft delete)

## 📋 Features ที่เพิ่ม

### Validation Rules
- ชื่อหมวดหมู่: 1-100 ตัวอักษร
- คำอธิบาย: สูงสุด 500 ตัวอักษร
- ตรวจสอบชื่อซ้ำ (case-insensitive)

### Error Handling
- MongoDB duplicate key errors (11000)
- Validation errors
- Not found errors
- Generic server errors

### Security
- Input sanitization
- SQL injection prevention
- XSS protection

## 🚀 การใช้งาน

### สร้างหมวดหมู่ใหม่
```bash
POST /api/categories
Content-Type: application/json

{
  "name": "ชื่อหมวดหมู่",
  "description": "คำอธิบายหมวดหมู่"
}
```

### อัปเดตหมวดหมู่
```bash
PUT /api/categories/[id]
Content-Type: application/json

{
  "name": "ชื่อใหม่",
  "description": "คำอธิบายใหม่",
  "isActive": true
}
```

### ลบหมวดหมู่
```bash
DELETE /api/categories/[id]
```

## 🔍 การตรวจสอบ

### 1. ตรวจสอบ Environment Variables
```bash
# ตรวจสอบ MONGODB_URI ใน Railway
MONGODB_URI=mongodb://...
```

### 2. ตรวจสอบ Database Connection
```bash
# ตรวจสอบ logs ใน Railway
[B2B] MongoDB connected successfully
```

### 3. ทดสอบ API
```bash
# ทดสอบ health check
GET /api/ping

# ทดสอบดึงรายการหมวดหมู่
GET /api/categories
```

## 📝 Logs ที่ควรเห็น

### เมื่อสร้างหมวดหมู่สำเร็จ
```
[B2B] Category created: ชื่อหมวดหมู่ (ID: 507f1f77bcf86cd799439011)
```

### เมื่อเกิด Error
```
[B2B] Error creating category: [error details]
```

## ⚠️ หมายเหตุสำคัญ

1. **Database Connection**: ตรวจสอบ MONGODB_URI ใน Railway environment
2. **Schema Validation**: ข้อมูลจะถูก validate ก่อนบันทึก
3. **Soft Delete**: การลบจะตั้งค่า isActive เป็น false แทนการลบจริง
4. **Slug Generation**: จะสร้าง slug อัตโนมัติจากชื่อหมวดหมู่

## 🔄 การ Deploy

1. Commit การเปลี่ยนแปลง
2. Push ไปยัง Railway
3. ตรวจสอบ logs ใน Railway dashboard
4. ทดสอบ API endpoints

## 📞 การติดต่อ

หากยังมีปัญหาอยู่ กรุณาตรวจสอบ:
1. Railway logs
2. MongoDB connection
3. Environment variables
4. Network connectivity
