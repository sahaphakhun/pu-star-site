# WinRich Dynamic Service

ระบบจัดการใบเสนอราคา และบริหารธุรกิจ

## 🚀 การ Deploy บน Railway

### ขั้นตอนการ Deploy:

1. **ตั้งค่า Environment Variables บน Railway:**
   - ไปที่ Railway Dashboard
   - เลือก service `winrichdynamic-service`
   - ไปที่ Variables tab
   - ตั้งค่าตัวแปรพื้นฐาน:
     ```
     NODE_ENV=production
     NEXT_TELEMETRY_DISABLED=1
     PORT=8080
     ```

2. **Deploy:**
   ```bash
   cd winrichdynamic-service
   railway up
   ```

### การตั้งค่าเพิ่มเติม (เมื่อต้องการใช้งานจริง):

เมื่อต้องการเพิ่มฟีเจอร์ที่ใช้ external services ให้ตั้งค่า environment variables เพิ่มเติม:

```
# Database (เมื่อต้องการใช้ MongoDB)
MONGODB_URI=your-mongodb-connection-string

# LINE Bot (เมื่อต้องการใช้ LINE Bot)
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token

# WMS API (เมื่อต้องการเชื่อมต่อ WMS)
WMS_API_URL=your-wms-api-url
WMS_API_KEY=your-wms-api-key

# JWT (เมื่อต้องการใช้ authentication)
JWT_SECRET=your-jwt-secret-here

# Email (เมื่อต้องการส่ง email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
```

## 🔧 การพัฒนา

### การรันในโหมด Development:

```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด development
npm run dev

# Build สำหรับ production
npm run build

# รันในโหมด production
npm start
```

### การตั้งค่า Environment Variables ในการพัฒนา:

สร้างไฟล์ `.env.local` ในโฟลเดอร์ `winrichdynamic-service`:

```env
NEXT_TELEMETRY_DISABLED=1
```

**หมายเหตุ:** `NODE_ENV` จะถูกตั้งค่าโดยอัตโนมัติโดย Next.js (development ในโหมด dev, production ในโหมด build)

## 📁 โครงสร้างโปรเจ็กต์

```
winrichdynamic-service/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin routes
│   │   ├── wholesale/         # Wholesale routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React Components
│   ├── models/                # MongoDB Models (เมื่อต้องการ)
│   ├── services/              # Business Logic
│   ├── schemas/               # Validation Schemas
│   ├── types/                 # TypeScript Types
│   ├── utils/                 # Utility Functions
│   └── lib/                   # Library Configurations
├── public/                    # Static Files
├── next.config.js             # Next.js Configuration
├── package.json               # Dependencies
└── railway.json               # Railway Configuration
```

## 🚨 ข้อควรระวัง

1. **Environment Variables:** ตั้งค่าเฉพาะที่จำเป็นสำหรับการทำงาน
2. **Dependencies:** ติดตั้งเฉพาะ packages ที่ใช้จริง
3. **Build Process:** ตรวจสอบ build logs หากมีปัญหา
4. **Healthcheck:** endpoint `/api/ping` ต้องทำงานได้ปกติ

## 📞 การติดต่อ

หากมีปัญหาหรือคำถามเกี่ยวกับการพัฒนาโปรเจ็กต์นี้ กรุณาติดต่อทีมพัฒนา
