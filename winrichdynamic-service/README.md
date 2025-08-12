# WinRich Dynamic Service

ระบบจัดการธุรกิจที่พัฒนาด้วย Next.js, MongoDB, และ React

## สิ่งที่ได้พัฒนาแล้ว

### 1. ระบบจัดการลูกค้า (Customer Management)
- **Model**: `src/models/Customer.ts` - ข้อมูลลูกค้าพร้อม validation
- **Schema**: `src/schemas/customer.ts` - Zod validation schemas
- **API Routes**: 
  - `GET /api/customers` - ดึงรายการลูกค้าทั้งหมด (พร้อม search, filter, pagination)
  - `POST /api/customers` - สร้างลูกค้าใหม่
  - `GET /api/customers/[id]` - ดึงข้อมูลลูกค้าตาม ID
  - `PUT /api/customers/[id]` - อัพเดทข้อมูลลูกค้า
  - `DELETE /api/customers/[id]` - ลบลูกค้า (Soft Delete)
- **UI Components**: 
  - `CustomerForm.tsx` - ฟอร์มเพิ่ม/แก้ไขลูกค้า
  - `CustomerList.tsx` - ตารางแสดงรายการลูกค้า
- **Admin Page**: `/admin/customers` - หน้าจัดการลูกค้า

### 2. ระบบจัดการใบเสนอราคา (Quotation Management)
- **Model**: `src/models/Quotation.ts` - ข้อมูลใบเสนอราคาพร้อมรายการสินค้า
- **Schema**: `src/schemas/quotation.ts` - Zod validation schemas
- **API Routes**:
  - `GET /api/quotations` - ดึงรายการใบเสนอราคาทั้งหมด
  - `POST /api/quotations` - สร้างใบเสนอราคาใหม่
  - `GET /api/quotations/[id]` - ดึงข้อมูลใบเสนอราคาตาม ID
  - `PUT /api/quotations/[id]` - อัพเดทข้อมูลใบเสนอราคา
  - `DELETE /api/quotations/[id]` - ลบใบเสนอราคา
  - `PUT /api/quotations/[id]/status` - เปลี่ยนสถานะใบเสนอราคา
  - `POST /api/quotations/[id]/send` - ส่งใบเสนอราคา
  - `POST /api/quotations/[id]/convert` - แปลงเป็น Sales Order
- **UI Components**: 
  - `QuotationForm.tsx` - ฟอร์มสร้าง/แก้ไขใบเสนอราคา
- **Admin Page**: `/admin/quotations` - หน้าจัดการใบเสนอราคา

### 3. ระบบฐานข้อมูล
- **Connection**: `src/lib/mongodb.ts` - MongoDB connection utility
- **Models**: Mongoose models สำหรับ Customer และ Quotation

### 4. Admin Dashboard
- **Main Page**: `/admin` - หน้าหลัก admin พร้อม navigation
- **Navigation**: ลิงก์ไปยังหน้าจัดการลูกค้าและใบเสนอราคา

## การติดตั้งและรัน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` จาก `env.example`:
```bash
cp env.example .env.local
```

แก้ไขค่าใน `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/winrichdynamic
NEXT_PUBLIC_APP_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001/api
```

### 3. รัน Development Server
```bash
npm run dev
```

แอปจะรันที่ `http://localhost:3001`

## โครงสร้างโปรเจค

```
src/
├── app/
│   ├── admin/           # Admin pages
│   │   ├── customers/   # Customer management
│   │   ├── quotations/  # Quotation management
│   │   └── page.tsx     # Admin dashboard
│   └── api/             # API routes
│       ├── customers/   # Customer API endpoints
│       └── quotations/  # Quotation API endpoints
├── components/           # React components
│   ├── CustomerForm.tsx
│   ├── CustomerList.tsx
│   └── QuotationForm.tsx
├── lib/                  # Utilities
│   └── mongodb.ts       # Database connection
├── models/               # Mongoose models
│   ├── Customer.ts
│   └── Quotation.ts
└── schemas/              # Zod validation schemas
    ├── customer.ts
    └── quotation.ts
```

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Validation**: Zod
- **UI Components**: Custom components with Tailwind CSS
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

## สถานะปัจจุบัน

✅ **เสร็จแล้ว**:
- ระบบจัดการลูกค้า (CRUD)
- ระบบจัดการใบเสนอราคา (CRUD + Status Management)
- Admin Dashboard
- Database models และ schemas
- API endpoints ทั้งหมด
- UI components พร้อม validation

🔄 **กำลังพัฒนา**:
- PDF generation สำหรับใบเสนอราคา
- LINE Bot integration
- WMS integration

📋 **แผนการพัฒนาต่อ**:
- ระบบ Billing
- ระบบ Sales Orders
- ระบบ Inventory Management
- ระบบ Reporting และ Analytics

## การใช้งาน

### 1. เข้าสู่ Admin Dashboard
ไปที่ `http://localhost:3001/admin`

### 2. จัดการลูกค้า
- ไปที่ `/admin/customers`
- กดปุ่ม "สร้างลูกค้าใหม่" เพื่อเพิ่มลูกค้า
- แก้ไขหรือลบข้อมูลลูกค้าได้

### 3. จัดการใบเสนอราคา
- ไปที่ `/admin/quotations`
- กดปุ่ม "สร้างใบเสนอราคาใหม่" เพื่อสร้างใบเสนอราคา
- เลือกลูกค้าและกรอกข้อมูลสินค้า
- ระบบจะคำนวณราคาอัตโนมัติ
- ส่งใบเสนอราคาได้เมื่อเสร็จแล้ว

## การแก้ไขปัญหา

### TypeScript Errors
หากเจอ error เกี่ยวกับ `NextRequest` type ให้เปลี่ยนเป็น `Request` ใน API routes

### MongoDB Connection
ตรวจสอบว่า MongoDB กำลังรันและ URI ใน `.env.local` ถูกต้อง

### Port Conflicts
หาก port 3001 ถูกใช้งาน ให้เปลี่ยนใน `package.json` scripts
