# WinRich Dynamic Service

ระบบจัดการใบเสนอราคา และบริหารธุรกิจแบบครบวงจร

## 🚀 ฟีเจอร์หลัก

### Phase 1: Billing & Quotation
- ระบบจัดการลูกค้า (Customer CRUD)
- ระบบใบเสนอราคา (Quotation System)
- การสร้าง PDF และส่งอีเมล

### Phase 2: LINE Bot Integration
- เชื่อมต่อ LINE Official Bot
- ระบบตอบสนองอัตโนมัติ
- ส่งใบเสนอราคาผ่าน LINE

### Phase 3: Warehouse API Sync
- ซิงค์ข้อมูลสต็อกแบบ Real-time
- เชื่อมต่อกับ WMS ภายนอก
- การติดตามสถานะออเดอร์

### Phase 4: Sales Order + RBAC
- ระบบใบสั่งขาย
- ระบบสิทธิ์ 3 ระดับ
- การจัดการบทบาท

### Phase 5: KPI Dashboard
- Dashboard สำหรับผู้บริหาร
- ข้อมูล KPI แบบ Real-time
- การวิเคราะห์ข้อมูล

### Phase 6: Wholesale Portal
- พอร์ทัล B2B สำหรับลูกค้าขายส่ง
- ระบบราคาชั้นบันได
- การสร้างใบเสนอราคาอัตโนมัติ

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.1, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes, Mongoose
- **Database**: MongoDB
- **Authentication**: JWT, bcryptjs
- **PDF Generation**: Puppeteer
- **Email**: Nodemailer
- **LINE Bot**: @line/bot-sdk
- **Deployment**: Railway

## 📦 การติดตั้ง

1. **Clone โปรเจ็ก:**
```bash
git clone <repository-url>
cd winrichdynamic-service
```

2. **ติดตั้ง Dependencies:**
```bash
npm install
```

3. **ตั้งค่า Environment Variables:**
```bash
cp env.example .env.local
# แก้ไข .env.local ตามค่าที่ต้องการ
```

4. **รัน Development Server:**
```bash
npm run dev
```

## 🚀 การ Deploy บน Railway

1. **สร้าง Railway Project ใหม่**
2. **เชื่อมต่อ GitHub Repository**
3. **ตั้งค่า Environment Variables**
4. **Deploy อัตโนมัติ**

## 📁 โครงสร้างโปรเจ็ก

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── layout.tsx      # Root Layout
│   └── page.tsx        # Home Page
├── components/          # React Components
├── models/             # Mongoose Models
├── lib/                # Utility Libraries
├── types/              # TypeScript Types
└── utils/              # Helper Functions
```

## 🔧 การพัฒนา

### การรันคำสั่ง:
- `npm run dev` - Development server
- `npm run build` - Build สำหรับ production
- `npm run start` - รัน production server
- `npm run lint` - ตรวจสอบ code quality

## 📝 License

ISC License
