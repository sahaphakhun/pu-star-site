# WinRich Site - ระบบจัดการธุรกิจหลัก

## ⚠️ สิ่งสำคัญที่ต้องทราบ

**โปรเจ็กนี้เป็นโปรเจ็กหลัก (Main Site) ที่รันบน Railway**
- **ห้ามแก้ไข** โฟลเดอร์ `winrichdynamic-service/` จากที่นี่
- โฟลเดอร์ `winrichdynamic-service/` เป็น subdomain B2B ที่แยก service ต่างหาก
- การแก้ไขใดๆ ใน `winrichdynamic-service/` ต้องทำในโปรเจ็กนั้นโดยตรง

## 📋 รายละเอียดโปรเจ็ก

**ชื่อโปรเจ็ก:** winrich-site  
**เวอร์ชัน:** 0.1.0  
**ประเภท:** Next.js Application  
**Deployment:** Railway  

## 🚀 การติดตั้งและรัน

### Prerequisites
- Node.js >= 18
- npm หรือ yarn

### การติดตั้ง
```bash
# Clone โปรเจ็ก
git clone <repository-url>
cd winrich-site

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
winrich-site/
├── src/                    # Source code หลัก
├── public/                 # Static files
├── scripts/               # Utility scripts
├── winrichdynamic-service/ # ⚠️ SUBDOMAIN B2B (ห้ามแก้ไขจากที่นี่)
├── package.json
├── next.config.js
├── railway.json           # Railway configuration
└── README.md
```

## 🔧 Scripts ที่มี

- `npm run dev` - รันใน development mode
- `npm run build` - Build โปรเจ็ก
- `npm run start` - รันใน production mode
- `npm run lint` - ตรวจสอบ code quality
- `npm run migrate:units` - Migrate products add units
- `npm run check:orders` - ตรวจสอบสถานะ orders
- `npm run seed:categories` - เพิ่มข้อมูล categories
- `npm run analyze` - วิเคราะห์ bundle size
- `npm run performance:check` - ตรวจสอบ performance

## 🌐 Railway Deployment

### Environment Variables
ตรวจสอบไฟล์ `env.example` สำหรับ environment variables ที่จำเป็น

### Health Check
- **Path:** `/api/ping`
- **Timeout:** 100ms

### Port Configuration
- ใช้ `$PORT` environment variable จาก Railway

## 📦 Dependencies หลัก

### Production Dependencies
- **Next.js 15.3.1** - React framework
- **React 19.0.0** - UI library
- **Mongoose 8.13.2** - MongoDB ODM
- **NextAuth 4.24.11** - Authentication
- **Framer Motion 12.14.0** - Animations
- **Tailwind CSS 4** - Styling
- **Zod 3.23.8** - Schema validation

### Development Dependencies
- **TypeScript 5** - Type checking
- **ESLint 9** - Code linting
- **PostCSS 8.4.49** - CSS processing

## 🔒 Security

- ใช้ NextAuth สำหรับ authentication
- JWT tokens สำหรับ session management
- Environment variables สำหรับ sensitive data
- Input validation ด้วย Zod

## 📊 Performance

- Bundle analysis ด้วย `npm run analyze`
- Performance monitoring
- Code splitting อัตโนมัติ
- Image optimization

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Port conflicts**
   ```bash
   # ตรวจสอบ port ที่ใช้งาน
   lsof -i :3000
   ```

2. **MongoDB connection issues**
   - ตรวจสอบ MONGODB_URI ใน .env
   - ตรวจสอบ network connectivity

3. **Build errors**
   ```bash
   # Clear cache และ rebuild
   rm -rf .next
   npm run build
   ```

## 📞 การติดต่อ

สำหรับปัญหาหรือคำถามเกี่ยวกับโปรเจ็กนี้ กรุณาติดต่อทีมพัฒนา

---

## ⚠️ หมายเหตุสำคัญ

**ห้ามแก้ไขไฟล์ใดๆ ในโฟลเดอร์ `winrichdynamic-service/` จากโปรเจ็กนี้**
- โฟลเดอร์นี้เป็น subdomain B2B ที่แยก service ต่างหาก
- การแก้ไขต้องทำในโปรเจ็ก `winrichdynamic-service` โดยตรง
- เพื่อป้องกันปัญหาการ deploy และการทำงานของระบบ



