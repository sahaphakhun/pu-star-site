# 🖼️ ระบบอัพโหลดภาพสำหรับ [SEND_IMAGE:...]

## 📋 **ภาพรวมระบบ**

ระบบอัพโหลดภาพที่สร้างขึ้นเพื่อให้แอดมินสามารถอัพโหลดและจัดการภาพสำหรับใช้กับฟังก์ชัน `[SEND_IMAGE:...]` ในระบบ Messenger Bot

**✨ ฟีเจอร์ใหม่: อนุญาตให้ Facebook Bot เข้าถึงภาพได้โดยตรงผ่านโดเมนของเราเอง**

## 🏗️ **โครงสร้างระบบ**

### 1. **หน้าแอดมิน** (`/admin/images`)
- หน้าแสดงรายการภาพทั้งหมด
- ระบบอัพโหลดภาพแบบ Drag & Drop
- การค้นหาและกรองตามหมวดหมู่
- การคัดลอกลิงก์และโค้ด `[SEND_IMAGE:...]`
- **การควบคุมสถานะ Public/Private** ✨

### 2. **API Endpoints**
- `GET /api/admin/images` - ดึงรายการภาพทั้งหมด
- `POST /api/admin/images/upload` - อัพโหลดภาพ
- `DELETE /api/admin/images/[id]` - ลบภาพ
- `PATCH /api/admin/images/[id]/toggle-public` - สลับสถานะ Public/Private ✨

### 3. **ฐานข้อมูล**
- Collection: `uploaded_images`
- เก็บข้อมูล: ชื่อไฟล์, URL, ขนาด, หมวดหมู่, ผู้อัพโหลด, **สถานะ Public/Private** ✨

## 🎯 **คุณสมบัติหลัก**

### ✅ **การอัพโหลดภาพ**
- รองรับการอัพโหลดหลายไฟล์พร้อมกัน
- Drag & Drop interface
- ตรวจสอบประเภทไฟล์ (เฉพาะภาพ)
- จำกัดขนาดไฟล์ (สูงสุด 10MB)
- สร้างชื่อไฟล์แบบ UUID เพื่อความปลอดภัย

### ✅ **การจัดการภาพ**
- แสดงภาพในรูปแบบ Grid
- ค้นหาภาพตามชื่อหรือหมวดหมู่
- กรองตามหมวดหมู่ (สินค้า, รีวิว, แบนเนอร์, อื่นๆ)
- แสดงข้อมูล: ขนาดไฟล์, วันที่อัพโหลด, หมวดหมู่
- **ควบคุมสถานะ Public/Private** ✨

### ✅ **การใช้งานกับ [SEND_IMAGE:...]**
- คัดลอกลิงก์ภาพโดยตรง
- คัดลอกโค้ด `[SEND_IMAGE:URL]` พร้อมใช้งาน
- **ลิงก์ภาพใช้โดเมนของเราเอง** ✨
- **Facebook Bot สามารถเข้าถึงภาพได้โดยตรง** ✨
- รองรับนามสกุลไฟล์: JPG, PNG, GIF

### ✅ **ความปลอดภัย**
- ตรวจสอบสิทธิ์แอดมิน
- ตรวจสอบประเภทไฟล์
- จำกัดขนาดไฟล์
- สร้างชื่อไฟล์แบบสุ่ม
- **ควบคุมการเข้าถึงผ่านสถานะ Public/Private** ✨

## 📁 **ไฟล์ที่สร้าง**

### Frontend
```
src/app/(shop)/admin/images/page.tsx
```

### Backend
```
src/app/api/admin/images/route.ts
src/app/api/admin/images/upload/route.ts
src/app/api/admin/images/[id]/route.ts
src/app/api/admin/images/[id]/toggle-public/route.ts ✨
src/models/UploadedImage.ts
```

### Configuration
```
src/components/AdminSidebar.tsx (เพิ่มเมนู)
```

## 🔧 **การติดตั้งและใช้งาน**

### 1. **ติดตั้ง Dependencies**
```bash
npm install uuid
```

### 2. **สร้างโฟลเดอร์**
```bash
mkdir -p public/uploads/images
```

### 3. **ตั้งค่า Environment Variables**
```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
# หรือใช้ VERCEL_URL สำหรับ Vercel deployment
```

### 4. **การใช้งาน**
1. เข้าสู่หน้าแอดมิน `/admin/images`
2. คลิก "อัพโหลดภาพ" หรือลากไฟล์มาที่พื้นที่อัพโหลด
3. เลือกหมวดหมู่ภาพ
4. คลิก "อัพโหลด"
5. ใช้ปุ่มคัดลอกเพื่อได้ลิงก์หรือโค้ด `[SEND_IMAGE:...]`
6. **ควบคุมสถานะ Public/Private ตามต้องการ** ✨

## 📊 **โครงสร้างฐานข้อมูล**

### Collection: `uploaded_images`
```javascript
{
  _id: ObjectId,
  filename: String,        // ชื่อไฟล์ในระบบ (UUID)
  originalName: String,    // ชื่อไฟล์เดิม
  url: String,            // URL สำหรับเข้าถึงภาพ
  size: Number,           // ขนาดไฟล์ (bytes)
  mimetype: String,       // ประเภทไฟล์ (image/jpeg, etc.)
  uploadedBy: String,     // ผู้อัพโหลด
  uploadedAt: Date,       // วันที่อัพโหลด
  category: String,       // หมวดหมู่ (products, reviews, banners, others)
  tags: [String],         // แท็ก (สำหรับอนาคต)
  isPublic: Boolean       // สถานะ Public/Private ✨
}
```

## 🎨 **UI/UX Features**

### **หน้าแสดงภาพ**
- Grid layout responsive
- Hover effects บนภาพ
- ปุ่มคัดลอกลิงก์และโค้ด
- ปุ่มลบภาพ
- **ปุ่มสลับสถานะ Public/Private** ✨
- แสดงข้อมูลภาพครบถ้วน
- **แสดงสถานะ Public/Private** ✨

### **Modal อัพโหลด**
- Drag & Drop interface
- แสดงไฟล์ที่เลือก
- Progress indicator
- Error handling
- การเลือกหมวดหมู่

### **การค้นหาและกรอง**
- Search box สำหรับค้นหาชื่อภาพ
- Dropdown สำหรับกรองหมวดหมู่
- Real-time filtering

## 🔗 **การใช้งานกับ [SEND_IMAGE:...]**

### **ตัวอย่างการใช้งาน**
1. อัพโหลดภาพรีวิวสินค้า
2. ตรวจสอบว่าสถานะเป็น **Public** ✨
3. คัดลอกโค้ด `[SEND_IMAGE:https://yourdomain.com/uploads/images/abc123.jpg]`
4. ใช้ในข้อความ AI: `ดูรีวิวจากลูกค้า [SEND_IMAGE:https://yourdomain.com/uploads/images/abc123.jpg]`
5. **Facebook Bot จะสามารถเข้าถึงภาพได้โดยตรง** ✨

### **ข้อดีของการใช้โดเมนตัวเอง**
- ไม่มีปัญหา URL หมดอายุ
- ควบคุมการเข้าถึงได้
- ไม่ขึ้นกับการเปลี่ยนแปลงของบริการภายนอก
- ความเร็วในการโหลดภาพ
- **Facebook Bot สามารถเข้าถึงภาพได้โดยตรง** ✨

### **การควบคุมการเข้าถึง**
- **Public**: Facebook Bot สามารถเข้าถึงภาพได้
- **Private**: Facebook Bot ไม่สามารถเข้าถึงภาพได้ (สำหรับภาพภายใน)
- สามารถสลับสถานะได้ตลอดเวลา

## 🚀 **การพัฒนาต่อ**

### **ฟีเจอร์ที่อาจเพิ่มในอนาคต**
- การปรับขนาดภาพอัตโนมัติ
- การบีบอัดภาพ
- การจัดการแท็ก
- การแชร์ภาพระหว่างแอดมิน
- การสำรองข้อมูลภาพ
- การวิเคราะห์การใช้งานภาพ
- **การตั้งค่าการเข้าถึงแบบละเอียด** ✨

### **การปรับปรุงประสิทธิภาพ**
- Image optimization
- CDN integration
- Caching strategies
- Batch operations

## 📝 **หมายเหตุ**

- ระบบนี้ทำงานร่วมกับระบบ `[SEND_IMAGE:...]` ที่แก้ไขแล้ว
- ภาพจะถูกเก็บใน `public/uploads/images/` และสามารถเข้าถึงได้ผ่าน URL
- **ภาพที่มีสถานะ Public จะสามารถเข้าถึงได้จาก Facebook Bot** ✨
- ควรตั้งค่า backup สำหรับโฟลเดอร์ `uploads` เป็นประจำ
- ระบบรองรับการขยายในอนาคตสำหรับการจัดการไฟล์ประเภทอื่น
- **URL ของภาพจะใช้โดเมนของเราเอง ทำให้ Facebook Bot เข้าถึงได้โดยตรง** ✨
