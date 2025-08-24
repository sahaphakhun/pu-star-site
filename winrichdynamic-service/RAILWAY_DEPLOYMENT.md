# Railway Deployment Guide - WinRich Dynamic Service

## 🚀 การ Deploy บน Railway

### 1. การเตรียมโปรเจ็ก

#### ตรวจสอบไฟล์ที่จำเป็น:
- ✅ `railway.json` - Railway configuration
- ✅ `package.json` - Dependencies และ scripts
- ✅ `next.config.js` - Next.js configuration
- ✅ `src/lib/mongodb.ts` - Database connection
- ✅ Environment variables

#### ตรวจสอบ Scripts ใน package.json:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p $PORT",
    "lint": "next lint"
  }
}
```

### 2. การตั้งค่า Railway

#### ขั้นตอนที่ 1: สร้างโปรเจ็กใหม่
1. ไปที่ [Railway Dashboard](https://railway.app/dashboard)
2. คลิก "New Project"
3. เลือก "Deploy from GitHub repo"
4. เลือก repository ที่มีโปรเจ็ก B2B Service

#### ขั้นตอนที่ 2: เพิ่ม MongoDB Service
1. ในโปรเจ็ก คลิก "New Service"
2. เลือก "Database" > "MongoDB"
3. Railway จะสร้าง MongoDB instance ให้
4. ไปที่แท็บ "Variables" ของ MongoDB service
5. คัดลอก `MONGODB_URI` ที่ได้

#### ขั้นตอนที่ 3: ตั้งค่า Environment Variables
ในโปรเจ็กหลัก ไปที่แท็บ "Variables" และเพิ่ม:

```env
# MongoDB Connection (คัดลอกจาก MongoDB service)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/winrichdynamic_b2b?retryWrites=true&w=majority

# JWT Secret (สำคัญมาก - ต้องเปลี่ยนใน production)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# App Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Port (Railway จะตั้งให้อัตโนมัติ)
PORT=8080

# Optional: SMS Configuration
DEESMSX_API_KEY=your_deesmsx_api_key_here
DEESMSX_SECRET_KEY=your_deesmsx_secret_key_here
DEESMSX_SENDER_NAME=deeSMS.OTP

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
```

### 3. การ Deploy

#### อัตโนมัติ (แนะนำ):
1. Railway จะ deploy อัตโนมัติเมื่อ push code ไป GitHub
2. ตรวจสอบ logs ในแท็บ "Deployments"

#### แบบ Manual:
1. คลิก "Deploy" ใน Railway Dashboard
2. รอให้ build เสร็จ
3. ตรวจสอบ logs

### 4. การตรวจสอบการ Deploy

#### ตรวจสอบ Logs:
```bash
# ดู logs ใน Railway Dashboard
# หรือใช้ Railway CLI
railway logs
```

#### ตรวจสอบ Health Check:
```bash
curl https://your-app.railway.app/api/ping
```

**ควรได้ผลลัพธ์:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "winrichdynamic-b2b"
}
```

### 5. การแก้ไขปัญหา

#### ปัญหา: MongoDB Connection Error
```
MongooseServerSelectionError: getaddrinfo ENOTFOUND mongodb-s3ss.railway.internal
```

**วิธีแก้ไข:**
1. ตรวจสอบ `MONGODB_URI` ใน environment variables
2. ตรวจสอบว่า MongoDB service ถูกเชื่อมต่อกับโปรเจ็ก
3. Restart service

#### ปัญหา: Build Error
```
Error: Cannot find module 'xxx'
```

**วิธีแก้ไข:**
1. ตรวจสอบ `package.json` dependencies
2. ตรวจสอบ `node_modules` ถูก install หรือไม่
3. ลบ `.next` folder และ build ใหม่

#### ปัญหา: Port Error
```
Error: listen EADDRINUSE :::8080
```

**วิธีแก้ไข:**
1. ตรวจสอบ `PORT` environment variable
2. Railway จะตั้ง `$PORT` ให้อัตโนมัติ
3. ตรวจสอบ `railway.json` configuration

### 6. การตั้งค่า Custom Domain

#### ขั้นตอนที่ 1: เพิ่ม Custom Domain
1. ไปที่แท็บ "Settings" ของโปรเจ็ก
2. คลิก "Domains"
3. เพิ่ม custom domain (เช่น `b2b.winrichdynamic.com`)

#### ขั้นตอนที่ 2: ตั้งค่า DNS
1. ไปที่ DNS provider ของคุณ
2. เพิ่ม CNAME record:
   ```
   b2b.winrichdynamic.com CNAME your-app.railway.app
   ```

#### ขั้นตอนที่ 3: อัปเดต Environment Variables
```env
NEXT_PUBLIC_APP_URL=https://b2b.winrichdynamic.com
API_BASE_URL=https://b2b.winrichdynamic.com/api
```

### 7. การ Monitor และ Maintenance

#### ตรวจสอบ Performance:
1. ไปที่แท็บ "Metrics" ใน Railway
2. ตรวจสอบ CPU, Memory, Network usage
3. ตั้งค่า alerts หากจำเป็น

#### การ Backup:
1. MongoDB service มีการ backup อัตโนมัติ
2. ตรวจสอบ backup schedule ใน MongoDB service settings

#### การ Update:
1. Push code ใหม่ไป GitHub
2. Railway จะ deploy อัตโนมัติ
3. ตรวจสอบ logs หลัง deploy

### 8. Security Best Practices

#### Environment Variables:
- ✅ ใช้ `JWT_SECRET` ที่ปลอดภัย
- ✅ ไม่ commit sensitive data ไป GitHub
- ✅ ใช้ Railway secrets สำหรับ sensitive data

#### Database Security:
- ✅ ใช้ MongoDB Atlas หรือ Railway MongoDB
- ✅ ตั้งค่า network access rules
- ✅ ใช้ strong passwords

#### Application Security:
- ✅ ใช้ HTTPS (Railway จัดให้อัตโนมัติ)
- ✅ ตั้งค่า CORS headers
- ✅ ใช้ input validation

### 9. การ Troubleshoot

#### ตรวจสอบ Logs:
```bash
# ดู logs ล่าสุด
railway logs

# ดู logs แบบ real-time
railway logs --follow

# ดู logs ของ service เฉพาะ
railway logs --service your-service-name
```

#### ตรวจสอบ Environment Variables:
```bash
# ดู environment variables
railway variables

# ดู environment variables ของ service เฉพาะ
railway variables --service your-service-name
```

#### Restart Service:
```bash
# Restart service
railway service restart

# หรือใช้ Railway Dashboard
# ไปที่ service > Settings > Restart
```

### 10. การ Rollback

#### Rollback ไปเวอร์ชันก่อนหน้า:
1. ไปที่แท็บ "Deployments"
2. เลือก deployment ที่ต้องการ rollback
3. คลิก "Rollback"

#### หรือใช้ Railway CLI:
```bash
# ดู deployment history
railway deployments

# rollback ไป deployment ก่อนหน้า
railway rollback
```

---

## 📞 การติดต่อ

หากมีปัญหาหรือคำถามเกี่ยวกับการ deploy กรุณาติดต่อทีมพัฒนา

**หมายเหตุ:** โปรเจ็กนี้เป็น B2B Subdomain Service ที่แยกจากโปรเจ็กหลัก ห้ามแก้ไขไฟล์นอกโฟลเดอร์ `winrichdynamic-service`
