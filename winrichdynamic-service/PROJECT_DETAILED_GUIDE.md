# WinRich Dynamic Service — Project Deep Dive (Detailed)

เอกสารนี้สรุปการตรวจสอบโครงสร้างและการทำงานของระบบจากโค้ดและเอกสารภายใน repo เพื่อให้ทีมเข้าใจภาพรวมเชิงเทคนิคและการใช้งานจริงได้รวดเร็ว

## ภาพรวมระบบ
- โปรเจ็กคือ B2B subdomain service ที่รวม CRM/Sales, Quotation/Sales Order, Shop/Orders/Payments, Notifications และ WMS ไว้ใน service เดียว
- Frontend และ Backend อยู่ใน Next.js App Router เดียวกัน โดย API ใช้ Route Handlers ใน `src/app/api`
- ฐานข้อมูลหลักเป็น MongoDB ผ่าน Mongoose และมี Zod ใช้ตรวจสอบข้อมูลบางส่วนก่อนบันทึก
- ระบบทำงานและ deploy บน Railway ด้วย Dockerfile และ health check ที่ `/api/ping`

## เทคโนโลยีหลัก
- Next.js App Router + React 19 (ทั้งหน้าเว็บและ API อยู่ใน repo เดียว)
- Mongoose สำหรับ MongoDB และ Zod สำหรับ validation
- Tailwind CSS + Radix UI primitives สำหรับ UI
- Puppeteer สำหรับสร้าง PDF (ใบเสนอราคา/ใบสั่งขาย)
- DeeSMSx สำหรับ OTP/SMS และ LINE Bot SDK สำหรับการแจ้งเตือน/เว็บฮุค
- Recharts สำหรับกราฟในแดชบอร์ด และ Vitest สำหรับทดสอบ

## โครงสร้างโฟลเดอร์
```
winrichdynamic-service/
├── src/
│   ├── app/                 # Next.js App Router pages + API routes
│   ├── components/          # UI/ฟอร์ม/เลย์เอาต์ที่ใช้ซ้ำ
│   ├── features/jubili/     # หน้าและ hook จากชุดฟีเจอร์ jubili
│   ├── models/              # Mongoose models
│   ├── schemas/             # Zod schemas
│   ├── utils/               # helper ต่างๆ (PDF, pricing, token, number)
│   ├── services/            # ธุรกิจที่เป็นงานประสาน (quotation/sales order)
│   ├── scripts/             # migration/maintenance scripts
│   └── data/                # ข้อมูลจังหวัด/อำเภอ และไฟล์แปลง Excel
├── public/                  # static assets + fonts สำหรับ PDF
├── test/                    # Vitest tests
└── README.md                # คู่มือพื้นฐาน
```

## เส้นทางหน้า UI ที่สำคัญ
### Public / Customer
- `/` หน้า landing
- `/shop` เลือกสินค้า สร้างคำสั่งซื้อออนไลน์
- `/my-orders` ค้นหาออเดอร์ตามเบอร์โทร
- `/login` OTP login สำหรับผู้ใช้ทั่วไป
- `/login/customer` OTP login สำหรับลูกค้า (ใช้ customerCode + phone)
- `/test-payment` หน้าทดสอบ flow การชำระเงิน

### Admin B2B
- `/adminb2b/login` และ `/adminb2b/register` สำหรับ OTP login/register
- `/adminb2b/dashboard` แผงบริหาร (KPI/กราฟ)
- `/adminb2b/leads` จัดการ Leads + import
- `/adminb2b/customers` จัดการลูกค้า
- `/adminb2b/deals` และ `/adminb2b/opportunities` จัดการดีล/โอกาส
- `/adminb2b/quotations` จัดการใบเสนอราคา
- `/adminb2b/sales-orders` และ `/adminb2b/orders` จัดการใบสั่งขาย/ออเดอร์
- `/adminb2b/projects` โครงการ
- `/adminb2b/tasks` กิจกรรมติดตาม
- `/adminb2b/approvals` คำขออนุมัติ
- `/adminb2b/forecast` คาดการณ์ยอดขาย
- `/adminb2b/reports` รายงาน
- `/adminb2b/products` และ `/adminb2b/categories` สินค้า/หมวดหมู่
- `/adminb2b/admins` และ `/adminb2b/permissions` จัดการแอดมิน/สิทธิ์
- `/adminb2b/settings` ตั้งค่าระบบ
- `/adminb2b/profile` โปรไฟล์แอดมิน (มี route แล้ว)

### WMS (Warehouse)
- `/wms` ภาพรวมคลัง
- `/wms/inventory` สินค้าคงคลัง
- `/wms/inbound` รับเข้า (PO/ASN)
- `/wms/outbound` ส่งออก/หยิบสินค้า
- `/wms/reports` รายงานคลัง

## ภาพรวม API ตามโดเมนงาน
### Auth / Session
- `/api/adminb2b/login/send-otp`, `/api/adminb2b/login/verify-otp` สำหรับ Admin OTP login
- `/api/adminb2b/register/*` สำหรับ OTP register
- `/api/adminb2b/validate-token`, `/api/adminb2b/profile`, `/api/adminb2b/logout`
- `/api/auth/send-otp`, `/api/auth/verify-otp` สำหรับผู้ใช้ทั่วไป
- `/api/auth/customer/send-otp`, `/api/auth/customer/verify-otp` สำหรับลูกค้า

### CRM / Sales Core
- `/api/customers`, `/api/customers/[id]`, `/api/customers/next-code`, `/api/customers/check-tax-id`
- `/api/leads`, `/api/leads/[id]/convert`, `/api/import/leads`
- `/api/deals`, `/api/deals/[id]` และตัวกรองใน `src/app/api/deals/filter.ts`
- `/api/pipeline-stages`, `/api/pipeline-stages/[id]`
- `/api/projects`, `/api/projects/[id]`
- `/api/activities`, `/api/activities/[id]`
- `/api/notes`, `/api/notes/[id]`

### Catalog / Products
- `/api/products`, `/api/products/[id]`, `/api/products/search`
- `/api/categories`, `/api/categories/[id]`

### Quotation / Sales Order / Documents
- `/api/quotations`, `/api/quotations/[id]`, `/api/quotations/[id]/status`
- `/api/quotations/[id]/pdf` และ `/api/quotations/[id]/send`
- `/api/quotations/[id]/convert-to-sales-order`, `/api/quotations/auto-generate`
- `/api/orders`, `/api/orders/[id]`, `/api/orders/[id]/pdf`
- `/api/orders/[id]/upload-packing-proof`, `/api/orders/[id]/tax-invoice`, `/api/orders/[id]/claim`

### Orders / Payments / Notifications
- `/api/orders/my-orders` ค้นหาออเดอร์ตามเบอร์โทร
- `/api/payments/notifications` ส่งแจ้งเตือน (รองรับเรียกแบบ cron)
- `/api/notifications` สำหรับ in-app notifications
- `/api/notification/sms`, `/api/notification/dual` ส่ง SMS แบบ template

### Reports / Analytics
- `/api/dashboard`, `/api/forecast`
- `/api/reports/*` เช่น sales-summary, performance, product-sales, activity-report, export.csv

### WMS / Warehouse
- `/api/wms/stats`, `/api/wms/products`, `/api/wms/inbound`, `/api/wms/outbound`

### Settings
- `/api/settings`, `/api/settings/logo`, `/api/settings/site`
- `/api/adminb2b/settings`

### Misc
- `/api/ping` health check
- `/api/line/webhook` LINE Bot webhook สำหรับคำสั่งกลุ่ม

## โมเดลข้อมูลหลัก (MongoDB)
- Identity/Auth: `Admin`, `Role`, `User`, `OTPVerification`
- CRM/Sales: `Customer`, `Lead`, `Deal`, `PipelineStage`, `Project`, `Activity`, `Note`, `AssignmentState`
- Commerce/Docs: `Product`, `Category`, `Quotation`, `Order`, `Approval`, `Settings`, `SiteSetting`
- Pricing/Policy: `PriceBook`, `DiscountPolicy`
- Notifications: `Notification`
- WMS: `PurchaseOrder`, `ASN`
- Integrations: `LineGroupLink`

## Flow การทำงานที่สำคัญ
1. Admin OTP Login
   - `/adminb2b/login` → `POST /api/adminb2b/login/send-otp` → `POST /api/adminb2b/login/verify-otp`
   - ได้ JWT แล้ว set cookie `b2b_token` และเก็บ token ใน `localStorage` ผ่าน `src/utils/tokenManager.ts`
2. Customer OTP Login
   - `/login/customer` → `POST /api/auth/customer/send-otp` → `POST /api/auth/customer/verify-otp`
   - ใช้ `customerCode` + `authorizedPhones` ใน `Customer` เพื่อ whitelist
3. Shop Order → Auto Quotation
   - `/shop` โหลดสินค้า/หมวดหมู่จาก `/api/products` และ `/api/categories`
   - สร้างออเดอร์ผ่าน `POST /api/orders` (online)
   - backend เรียก `src/services/quotationGenerator.ts` เพื่อสร้างใบเสนอราคาอัตโนมัติ
4. Payment Flow
   - COD: ตั้งค่า `codPaymentStatus` และส่ง reminder ผ่าน `/api/payments/notifications`
   - Transfer: ส่งแจ้งเตือนให้อัปโหลดสลิปและตรวจสอบการโอน
   - Credit: ตั้ง `creditPaymentDueDate` และส่งแจ้งเตือนก่อนครบกำหนด
5. Quotation Workflow
   - สถานะหลัก: draft → sent → accepted/rejected/expired
   - สร้าง PDF ผ่าน `/api/quotations/[id]/pdf` ด้วย Puppeteer
   - Convert เป็น Sales Order ผ่าน `/api/quotations/[id]/convert-to-sales-order`
6. Sales Order & Order Management
   - Sales order ใช้ `Order` model ด้วย `orderType = sales_order`
   - PDF สำหรับใบสั่งขายผ่าน `/api/orders/[id]/pdf`
7. Approval & Pricing Guardrails
   - `src/utils/pricing.ts` ตรวจ PriceBook + DiscountPolicy + Settings
   - หากเกินเงื่อนไขจะตั้ง `approvalStatus = pending` และสร้าง `Approval`
8. LINE Group Quotation (Webhook)
   - ผูกกลุ่มด้วยข้อความ `ลูกค้า#CODE`
   - สร้างใบเสนอราคาจากข้อความ `QT <subject>` + รายการสินค้า `#SKU qty`
   - ระบบตอบกลับด้วยลิงก์ PDF

## ระบบที่เกี่ยวข้องกับ LINE Bot
### จุดรับเข้า (Inbound)
- Endpoint: `POST /api/line/webhook` ใน `src/app/api/line/webhook/route.ts`
- ตรวจลายเซ็นด้วย `LINE_CHANNEL_SECRET` (ใช้ `x-line-signature`)
- รับเฉพาะข้อความแบบ text และเฉพาะ source type = `group`
- คำสั่งที่รองรับ
  - `สวัสดี` ตอบกลับข้อความทักทาย
  - `ลูกค้า#CODE` ผูก `groupId` กับ `Customer` แล้วบันทึกใน `LineGroupLink`
  - `QT <subject>` + บรรทัดสินค้า `#SKU qty` เพื่อสร้างใบเสนอราคาอัตโนมัติ
- การสร้างใบเสนอราคาใน webhook
  - ค้นสินค้าโดย `Product.sku` แบบไม่สนตัวพิมพ์เล็ก/ใหญ่
  - กำหนด VAT 7% และ valid 7 วันโดยค่าเริ่มต้น
  - ตอบกลับลิงก์ดาวน์โหลด PDF จาก `/api/quotations/[id]/pdf`
  - ใช้ `NEXT_PUBLIC_APP_URL` เป็น base URL หากไม่ตั้งจะ fallback เป็น origin ของ request

### จุดส่งออก (Outbound)
- `src/app/notification/line.ts` ใช้ LINE SDK ส่งข้อความแบบ push ไปที่ group
- `src/app/notification/group.ts` ใช้ `LineGroupLink` เพื่อส่งข้อความไปยังกลุ่มที่ผูกกับลูกค้า
- `src/app/notification/paymentNotifications.ts` ส่งแจ้งเตือนสถานะการชำระเงินไปยังกลุ่ม admin ผ่าน `LINE_GROUP_ID`
- `src/app/notification/quotationNotifications.ts` ส่งแจ้งเตือนเกี่ยวกับใบเสนอราคาไปยังกลุ่ม admin ผ่าน `LINE_ADMIN_GROUP_ID`

### Model ที่เกี่ยวข้อง
- `src/models/LineGroupLink.ts` เก็บการผูก `groupId` ↔ `customerId`

### Environment Variables ที่ใช้กับ LINE
- `LINE_CHANNEL_SECRET` สำหรับตรวจ signature ของ webhook
- `LINE_CHANNEL_ACCESS_TOKEN` สำหรับส่ง/ตอบข้อความ
- `LINE_GROUP_ID` สำหรับแจ้งเตือนกลุ่ม admin ใน payment flow
- `LINE_ADMIN_GROUP_ID` สำหรับแจ้งเตือนกลุ่ม admin ใน quotation flow
- `NEXT_PUBLIC_APP_URL` สำหรับประกอบลิงก์ดาวน์โหลด PDF

### ข้อสังเกตเชิงพฤติกรรม
- Webhook รับเฉพาะข้อความจาก “กลุ่ม” ไม่ตอบแชทส่วนตัว
- ข้อความรายการสินค้าใน webhook ต้องอยู่รูปแบบ `#SKU qty` เท่านั้น
- `sendDualNotification` (SMS + Messenger) ยังไม่ส่งเข้า LINE group โดยตรง (ถูก skip)

### Workflow (แบบอ่านง่าย)
Inbound (รับจาก LINE → ตอบกลับ)
```
[ข้อความจาก LINE กลุ่ม]
        |
        v
[เรียก /api/line/webhook]
        |
        v
[ตรวจลายเซ็น]
   |-- ไม่ผ่าน --> [401 ลายเซ็นไม่ถูกต้อง]
   |
   |-- ผ่าน --> [ตรวจว่าเป็นข้อความ + มาจากกลุ่ม]
                     |-- ไม่ใช่ --> [ละเว้น]
                     |
                     |-- ใช่ --> [แยกคำสั่ง]
                                 |-- ทักทาย --> [ตอบกลับคำทักทาย]
                                 |-- ลูกค้า#CODE --> [ค้นหาลูกค้าตามรหัส] -> [บันทึก LineGroupLink] -> [ตอบกลับผูกสำเร็จ]
                                 |-- QT <subject> + #SKU qty --> [ค้นหาการผูกกลุ่ม]
                                                          -> [แยกรายการ + ค้นสินค้าโดย SKU]
                                                          -> [สร้างใบเสนอราคา + ลิงก์ PDF]
                                                          -> [ตอบกลับลิงก์ PDF]
```

Outbound (แจ้งเตือนจากระบบ → LINE)
```
[เหตุการณ์การชำระเงิน/ใบเสนอราคา]
        |
        v
[เรียกส่งข้อความผ่าน sendLineTextToGroup]
   |-- กลุ่มแอดมิน --> [LINE_GROUP_ID / LINE_ADMIN_GROUP_ID]
   |
   |-- กลุ่มลูกค้า --> [LineGroupLink -> groupId]
```

คำสั่งหลักที่รองรับใน Inbound
- ทักทาย: ตอบกลับข้อความสวัสดี
- ผูกกลุ่ม: `ลูกค้า#CODE` → บันทึก `LineGroupLink`
- สร้างใบเสนอราคา: `QT <subject>` + `#SKU qty` → สร้าง quotation และส่งลิงก์ PDF

## Services/Utilities ที่ควรรู้
- `src/services/quotationGenerator.ts` สร้างใบเสนอราคาจากออเดอร์และกำหนดเงื่อนไขแปลงเป็น SO
- `src/services/salesOrderGenerator.ts` แปลงใบเสนอราคาเป็น Sales Order พร้อมประวัติการแปลง
- `src/utils/pdfUtils.ts`, `src/utils/quotationPdf.ts`, `src/utils/salesOrderPdf.ts` ใช้สร้าง HTML และแปลงเป็น PDF
- `src/utils/pricing.ts` rule engine ตรวจส่วนลด (PriceBook/DiscountPolicy/Settings)
- `src/utils/deesmsx.ts` ส่ง SMS/OTP พร้อม retry + timeout
- `src/lib/mongodb.ts` connection pooling และ reconnect
- `src/lib/auth.ts` ตรวจ token (ใช้ decodeJwt ไม่ verify signature)

## การเชื่อมต่อระบบภายนอก
- DeeSMSx สำหรับ OTP/SMS (`DEESMSX_API_KEY`, `DEESMSX_SECRET_KEY`)
- LINE Bot สำหรับ webhook และส่งข้อความกลุ่ม (`LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`)
- Cloudinary สำหรับอัปโหลดโลโก้และรูป (เช่น `/api/settings/logo`)
- SMTP สำหรับอีเมล (มี env config)
- Puppeteer + Chromium สำหรับสร้าง PDF

## Environment Variables สำคัญ
- `MONGODB_URI`, `B2B_DB_NAME`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`, `API_BASE_URL`
- `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`
- `DEESMSX_API_KEY`, `DEESMSX_SECRET_KEY`, `DEESMSX_SENDER_NAME`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `CLOUDINARY_*`
- `PORT`, `NODE_ENV`, `NEXT_TELEMETRY_DISABLED`

## สคริปต์และคำสั่งหลัก
- `npm run dev` เริ่ม dev server
- `npm run build` build production
- `npm run start` start production พร้อม `prestart` ที่รัน migration
- `npm run lint` ตรวจ lint (note: build ตั้ง ignore)
- `npm run test` และ `npm run test:watch` สำหรับ Vitest
- `npm run migrate` รวม migration ของ SKU และ adminId

## Deployment และ Runtime
- ใช้ Dockerfile และ `output: 'standalone'` ใน `next.config.js`
- Railway health check ที่ `/api/ping` และ port ใช้ `PORT`
- Docker image ติดตั้ง Chromium สำหรับ Puppeteer และตั้ง `PUPPETEER_EXECUTABLE_PATH`

## การทดสอบ
- ใช้ Vitest (`test/deals.filter.test.ts` ทดสอบตัวกรองดีล)
- หากเพิ่ม logic ธุรกิจใหม่ควรเพิ่ม test ใน `test/`

## ข้อควรระวัง/หนี้เทคนิคที่พบ
- `middleware.ts` ปิด auth ด้วย `TEMP_DISABLE_AUTH = true`
- บางจุดใช้ `decodeJwt` โดยไม่ verify signature ใน `src/lib/auth.ts`
- role naming หลายชุด (admin/manager/staff vs อื่นๆ) อาจทำให้ RBAC ไม่สอดคล้อง
- `next.config.js` ตั้ง `eslint.ignoreDuringBuilds` และ `typescript.ignoreBuildErrors` ทำให้ build ผ่านแม้มีปัญหา
- มีลิงก์ที่ UI อ้างถึงแต่ยังไม่มีหน้า เช่น `/contact`, `/wms/movements`
- ฟีเจอร์ PriceBook/DiscountPolicy มี logic แล้ว แต่ยังไม่มี UI สำหรับบริหารเต็มรูปแบบ

## เอกสารอ้างอิงภายใน repo
- `README.md` ภาพรวมและวิธีรัน
- `PROJECT_SYSTEMS_AUDIT.md` inventory ระบบ + gap analysis
- `PAYMENT_SYSTEM_README.md` รายละเอียดการชำระเงิน
- `PDF_README.md` การสร้าง PDF ใบเสนอราคา
- `BACKEND_INTEGRATION_SPECIFICATION.md` สเปคการเชื่อม mock → backend
- `MIGRATION_PLAN.md` และ `MIGRATION_REPORT.md` แผน/รายงาน migration
