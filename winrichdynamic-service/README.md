# WinRich Dynamic Service - ระบบจัดการ B2B

## ⚠️ สิ่งสำคัญที่ต้องทราบ

**กฏการแก้ไข**
- หากต้องการแก้ไขหรือตรวจสอบไฟล์ใด ๆ ให้ดูเฉพาะใน /winrichdynamic-service เท่านั้น ห้ามแก้ไขไฟล์นอกโฟลเดอร์

**โปรเจ็กนี้เป็น B2B Subdomain Service ที่รันบน Railway แยกจากโปรเจ็กหลัก**
- **ห้ามแก้ไข** โปรเจ็กหลัก (parent directory) จากที่นี่
- สามารถตรวจสอบไฟล์หรือโครงสร้างต่าง ๆ ของโปรเจ็กได้หากจำเป็น แต่ไม่สามารถแก้ไขได้
- โปรเจ็กนี้เป็น subdomain B2B ที่แยก service ต่างหาก
- การแก้ไขใดๆ ในโปรเจ็กหลักต้องทำในโปรเจ็กนั้นโดยตรง
- โปรเจ็กนี้ถูกใช้งานบน Railway

## 📋 รายละเอียดโปรเจ็ก

**ชื่อโปรเจ็ก:** winrichdynamic-service  
**เวอร์ชัน:** 1.0.0  
**ประเภท:** Next.js B2B Service  
**Deployment:** Railway (Subdomain)  
**Description:** WinRich Dynamic Service - Billing, Quotation, and Business Management System

## 🚀 การติดตั้งและรัน

### Prerequisites
- Node.js >= 18
- npm หรือ yarn
- MongoDB database

### การติดตั้ง
```bash
# เข้าไปในโฟลเดอร์โปรเจ็ก
cd winrichdynamic-service

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env จาก env.example
cp env.example .env

# แก้ไขค่าใน .env ให้ตรงกับ environment ของคุณ
```

### การรันใน Development
```bash
npm run dev
```

### การ Build และ Deploy
```bash
# Build โปรเจ็ก
npm run build

# รันใน production
npm start
```

## 📁 โครงสร้างโปรเจ็ก

```
winrichdynamic-service/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── adminb2b/       # B2B Admin Panel
│   │   │   ├── customers/  # จัดการลูกค้า
│   │   │   ├── quotations/ # จัดการใบเสนอราคา
│   │   │   └── layout.tsx  # B2B Layout
│   │   ├── api/            # API Routes
│   │   │   ├── customers/  # Customer API
│   │   │   ├── quotations/ # Quotation API
│   │   │   └── ping/       # Health Check
│   │   └── globals.css     # Global Styles
│   ├── components/         # React Components
│   │   ├── CustomerForm.tsx
│   │   ├── CustomerList.tsx
│   │   ├── QuotationForm.tsx
│   │   └── ui/            # UI Components
│   ├── lib/               # Utilities
│   │   └── mongodb.ts     # Database connection
│   ├── models/            # MongoDB Models
│   │   ├── Customer.ts
│   │   └── Quotation.ts
│   └── schemas/           # Zod Schemas
│       ├── customer.ts
│       └── quotation.ts
├── package.json
├── next.config.js
├── railway.json          # Railway configuration
├── tailwind.config.js
└── README.md
```

## 🔧 Scripts ที่มี

- `npm run dev` - รันใน development mode
- `npm run build` - Build โปรเจ็ก
- `npm run start` - รันใน production mode
- `npm run lint` - ตรวจสอบ code quality

## 🌐 Railway Deployment

### Environment Variables
ตรวจสอบไฟล์ `env.example` สำหรับ environment variables ที่จำเป็น:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/winrichdynamic

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001

# API Configuration
API_BASE_URL=http://localhost:3001/api

# LINE Bot Configuration
LINE_CHANNEL_SECRET=your_line_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# SMS Configuration (DeeSMSx)
DEESMSX_API_KEY=your_deesmsx_api_key_here
DEESMSX_SECRET_KEY=your_deesmsx_secret_key_here
DEESMSX_SENDER_NAME=deeSMS.OTP

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# App Configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### Health Check
- **Path:** `/api/ping`
- **Timeout:** 100ms

### Port Configuration
- ใช้ `$PORT` environment variable จาก Railway

## 📦 Dependencies หลัก

### Production Dependencies
- **Next.js 15.3.1** - React framework
- **React 19.1.1** - UI library
- **Mongoose 8.17.1** - MongoDB ODM
- **@line/bot-sdk 10.1.1** - LINE Bot integration
- **Framer Motion 12.23.12** - Animations
- **Tailwind CSS 4.1.11** - Styling
- **Zod 4.0.17** - Schema validation
- **Axios 1.11.0** - HTTP client
- **Nodemailer 7.0.5** - Email sending
- **Puppeteer 24.16.0** - PDF generation

### Development Dependencies
- **TypeScript** - Type checking
- **ESLint 9.33.0** - Code linting
- **PostCSS 8.4.49** - CSS processing

## 🔒 Security

- JWT tokens สำหรับ authentication
- Environment variables สำหรับ sensitive data
- Input validation ด้วย Zod
- MongoDB connection security

## 📊 Features

### B2B Admin Panel
- **Customer Management** - จัดการข้อมูลลูกค้า
- **Quotation Management** - สร้างและจัดการใบเสนอราคา
- **Business Analytics** - วิเคราะห์ข้อมูลธุรกิจ

### API Endpoints
- **Customer API** - CRUD operations สำหรับลูกค้า
- **Quotation API** - จัดการใบเสนอราคา
- **Health Check** - ตรวจสอบสถานะระบบ

### Integration
- **LINE Bot** - การแจ้งเตือนและตอบกลับลูกค้า
- **Email Service** - ส่งใบเสนอราคาทางอีเมล
- **SMS Service (DeeSMSx)** - ส่ง OTP และข้อความ SMS

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **MongoDB connection issues**
   ```bash
   # ตรวจสอบ MONGODB_URI ใน .env
   # ตรวจสอบ network connectivity
   ```

2. **Port conflicts**
   ```bash
   # ตรวจสอบ port ที่ใช้งาน
   lsof -i :3001
   ```

3. **Build errors**
   ```bash
   # Clear cache และ rebuild
   rm -rf .next
   npm run build
   ```

4. **Environment variables**
   - ตรวจสอบ Railway environment variables
   - ตรวจสอบไฟล์ .env ใน development

## 📞 การติดต่อ

สำหรับปัญหาหรือคำถามเกี่ยวกับโปรเจ็กนี้ กรุณาติดต่อทีมพัฒนา

---

## ⚠️ หมายเหตุสำคัญ

**โปรเจ็กนี้เป็น B2B Subdomain Service ที่แยกจากโปรเจ็กหลัก**
- **ห้ามแก้ไข** โปรเจ็กหลัก (parent directory) จากที่นี่
- การแก้ไขต้องทำในโปรเจ็กที่เกี่ยวข้องโดยตรง
- เพื่อป้องกันปัญหาการ deploy และการทำงานของระบบ
- โปรเจ็กนี้รันบน Railway เป็น subdomain แยกต่างหาก
