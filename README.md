# PU Star Site - Multi-Service Architecture

โปรเจ็กต์นี้ประกอบด้วยสองเซอร์วิสที่แยกกันแต่ทำงานร่วมกัน โดยใช้ฐานข้อมูล MongoDB ร่วมกัน

## 🏗️ โครงสร้างโปรเจ็กต์

```
pu-star-site-1/
├── src/                          # Main Service (Next.js E-commerce)
│   ├── app/                      # Next.js App Router
│   ├── components/               # React Components
│   ├── models/                   # MongoDB Models
│   ├── lib/                      # Utilities & Configurations
│   └── ...
├── winrichdynamic-service/       # Secondary Service (Admin Dashboard)
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   ├── components/           # React Components
│   │   ├── models/               # MongoDB Models
│   │   └── ...
│   └── ...
└── shared/                       # Shared Resources (ถ้ามี)
```

## 🚀 เซอร์วิสที่ 1: Main E-commerce Service

**Path:** `src/` (Root level)

### คุณสมบัติ:
- 🛒 E-commerce Platform
- 👥 Customer Management
- 📦 Product Catalog
- 🛍️ Shopping Cart
- 💳 Order Management
- 📱 Customer-facing UI

### การรัน:
```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด development
npm run dev

# Build สำหรับ production
npm run build
```

### Environment Variables:
```env
MONGODB_URI=mongodb://...
NEXTAUTH_SECRET=...
# อื่นๆ ตามที่จำเป็น
```

---

## 🎛️ เซอร์วิสที่ 2: Admin Dashboard Service

**Path:** `winrichdynamic-service/`

### คุณสมบัติ:
- 👨‍💼 Admin Dashboard
- 📊 Analytics & Reports
- 🏪 Store Management
- 👥 User Management
- 📈 KPI Tracking
- 🔧 System Configuration

### การรัน:
```bash
# เข้าไปในโฟลเดอร์
cd winrichdynamic-service

# ติดตั้ง dependencies
npm install

# รันในโหมด development
npm run dev

# Build สำหรับ production
npm run build
```

### Environment Variables:
```env
MONGODB_URI=mongodb://...  # ใช้ฐานข้อมูลเดียวกัน
NEXTAUTH_SECRET=...
# อื่นๆ ตามที่จำเป็น
```

---

## 🗄️ ฐานข้อมูลร่วมกัน

### ⚠️ ข้อควรระวังสำคัญ:

1. **Collection Names:** ต้องไม่ซ้ำกันระหว่างสองเซอร์วิส
   ```javascript
   // Main Service
   const Product = mongoose.model('Product', productSchema);
   
   // Admin Service
   const AdminProduct = mongoose.model('AdminProduct', adminProductSchema);
   ```

2. **Indexes:** ตรวจสอบว่าไม่มีการสร้าง index ที่ขัดแย้งกัน
   ```javascript
   // ใช้ prefix หรือ suffix เพื่อแยกแยะ
   productSchema.index({ 'main_service_field': 1 });
   adminProductSchema.index({ 'admin_service_field': 1 });
   ```

3. **Schema Changes:** เมื่อแก้ไข schema ต้องตรวจสอบทั้งสองเซอร์วิส

### แนวทางการตั้งชื่อ:
```javascript
// Main Service Collections
- products
- customers
- orders
- categories

// Admin Service Collections
- admin_products
- admin_users
- admin_reports
- admin_settings
```

---

## 🚂 การ Deploy บน Railway

### เซอร์วิสที่ 1 (Main):
```bash
# Railway จะ detect Next.js project ใน root
railway up
```

### เซอร์วิสที่ 2 (Admin):
```bash
# ต้องระบุ working directory
railway up --cwd winrichdynamic-service
```

### Environment Variables บน Railway:
- ตั้งค่า `MONGODB_URI` เดียวกันสำหรับทั้งสองเซอร์วิส
- ตั้งค่า `NEXTAUTH_SECRET` เดียวกัน (ถ้าใช้ authentication ร่วมกัน)
- ตั้งค่า service-specific variables แยกกัน

---

## 🔧 การพัฒนา

### การรันทั้งสองเซอร์วิสพร้อมกัน:

**Terminal 1:**
```bash
npm run dev
# รันที่ http://localhost:3000
```

**Terminal 2:**
```bash
cd winrichdynamic-service
npm run dev
# รันที่ http://localhost:3001
```

### การจัดการ Dependencies:
```bash
# Main Service
npm install package-name

# Admin Service
cd winrichdynamic-service
npm install package-name
```

---

## 📁 โครงสร้างไฟล์ที่สำคัญ

### Main Service (`src/`):
```
src/
├── app/                    # Next.js App Router
│   ├── (shop)/            # E-commerce routes
│   ├── api/               # API routes
│   └── ...
├── models/                # MongoDB Models
├── components/            # React Components
├── lib/                   # Utilities
└── ...
```

### Admin Service (`winrichdynamic-service/src/`):
```
winrichdynamic-service/src/
├── app/                   # Next.js App Router
│   ├── admin/             # Admin routes
│   ├── api/               # API routes
│   └── ...
├── models/                # MongoDB Models
├── components/            # React Components
├── lib/                   # Utilities
└── ...
```

---

## 🚨 ข้อควรระวัง

1. **Database Conflicts:** ตรวจสอบ collection names และ indexes
2. **Environment Variables:** ใช้ MongoDB URI เดียวกัน
3. **Port Conflicts:** ตรวจสอบ ports เมื่อรันในโหมด development
4. **Shared Resources:** ระวังการแก้ไขไฟล์ที่ใช้ร่วมกัน
5. **Deployment:** ตรวจสอบ working directory สำหรับ Railway

---

## 📞 การติดต่อ

หากมีปัญหาหรือคำถามเกี่ยวกับการพัฒนาโปรเจ็กต์นี้ กรุณาติดต่อทีมพัฒนา

---

## 📝 License

[ระบุ license ที่เหมาะสม]
