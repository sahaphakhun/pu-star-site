# Winrichdynamic Service — System Inventory & Admin Gap Analysis

Generated: 2026-01-08

เอกสารนี้สรุป “ระบบทั้งหมดที่มีอยู่ในโปรเจ็ก” (หน้าเว็บ, API, โมเดล, integrations) และวิเคราะห์ “สิ่งที่หน้าแอดมินยังขาด” พร้อมข้อเสนอแนะเชิงโครงสร้าง/ความปลอดภัย

---

## 1) TL;DR

- โปรเจ็กเป็น Next.js (App Router) + MongoDB (Mongoose) ที่รวม **CRM/Sales**, **Quotation/Sales Order**, **Shop/Orders/Payments**, **Notifications (LINE/SMS)** และ **WMS แบบ read-heavy** ไว้ใน service เดียว
- ฝั่งแอดมินมีหน้าใช้งานจำนวนมาก (`/adminb2b/*`) และมี “ระบบ Admin/Role/Permission” แล้ว (`/adminb2b/admins`, `/adminb2b/permissions`, `/api/adminb2b/*`)
- “ลายเซ็น” มีทั้ง field ใน `Admin` และมี API (`/api/users/signature`) + ถูกดึงไปใช้ในการสร้าง PDF แต่ **ยังไม่มีหน้า UI สำหรับตั้งค่าลายเซ็น/ตำแหน่งแบบเป็นระบบ**
- จุดเสี่ยงหลัก: **middleware auth ถูกปิดอยู่** (`middleware.ts` ตั้ง `TEMP_DISABLE_AUTH = true`) และหลาย API route ใช้ `decodeJwt` เพื่อ RBAC โดย **ไม่ verify signature**

---

## 2) Technology & Architecture Snapshot

- **Frontend**: Next.js App Router (`src/app`), React 19, TailwindCSS, Radix UI primitives
- **Backend**: Next.js Route Handlers (`src/app/api/**/route.ts`)
- **DB**: MongoDB via Mongoose (`src/lib/mongodb.ts`, `src/models/*`)
- **Validation**: Zod schemas (`src/schemas/*`)
- **PDF**: Puppeteer + HTML templates (`src/utils/pdfUtils.ts`, `src/utils/quotationPdf.ts`, `src/utils/salesOrderPdf.ts`)
- **Uploads**: Cloudinary (`src/lib/cloudinary.ts`, `/api/settings/logo`)
- **Notifications**:
  - SMS/OTP ผ่าน DeeSMSx (`src/utils/deesmsx.ts`)
  - LINE Bot/Webhook (`/api/line/webhook`) และการส่งข้อความไป LINE group ที่ผูกกับลูกค้า (`src/app/notification/group.ts`)
- **Deployment target**: Railway (อ้างอิงจาก `railway.json`, `README.md`)

---

## 3) UI Routes (Pages) — สิ่งที่ผู้ใช้เห็น

### Public / Customer-facing

- `/` หน้า landing (มีลิงก์ไป `/shop`, `/adminb2b`, `/contact` แต่ **ยังไม่พบหน้า `/contact` ใน repo**)
- `/shop` ร้านค้า B2B แบบเลือกสินค้าใส่ตะกร้าและสร้าง order
- `/my-orders` ค้นหาคำสั่งซื้อด้วยเบอร์โทร (ยังเป็นรูปแบบ query param)
- `/login` OTP login (User model) — ดูเพิ่มเติมในหัวข้อ Auth
- `/login/customer` ลูกค้า login ด้วย `customerCode + phone + OTP` (จำกัดเบอร์ตาม whitelist ใน Customer)
- `/test-payment` หน้า test ระบบชำระเงิน

### Admin B2B

ฐานทางคือ `/adminb2b` แล้ว redirect ไป `/adminb2b/dashboard`

- `/adminb2b/dashboard` แผงบริหาร (KPI + charts)
- `/adminb2b/leads` จัดการ Leads + import CSV (ผ่าน `/api/import/leads`)
- `/adminb2b/customers` จัดการลูกค้า
- `/adminb2b/deals` จัดการดีล (kanban/list) + saved filters + quick note
- `/adminb2b/opportunities` UI “โอกาส” (ใช้ Deal เป็นฐานข้อมูล)
- `/adminb2b/quotations` จัดการใบเสนอราคา + ส่ง/เปลี่ยนสถานะ/สร้าง PDF/ออกเลข SO
- `/adminb2b/sales-orders` จัดการใบสั่งขาย (Sales Order = Order แบบ `orderType=sales_order`)
- `/adminb2b/orders` จัดการคำสั่งซื้อ (online + sales_order)
- `/adminb2b/projects` จัดการโครงการ
- `/adminb2b/tasks` งานติดตาม (อิง Activity)
- `/adminb2b/forecast` คาดการณ์ยอดขาย
- `/adminb2b/reports` รายงาน (เรียก `/api/reports/*`)
- `/adminb2b/settings` ตั้งค่าระบบ/กิจการ (อ่าน-แก้ Settings)
- `/adminb2b/categories` จัดการหมวดหมู่ (ตอนนี้มี create + list)
- `/adminb2b/approvals` คำขออนุมัติ (deal/quotation)
- `/adminb2b/admins` จัดการผู้ดูแลระบบ
- `/adminb2b/permissions` จัดการ Role/Permissions
- `/adminb2b/login`, `/adminb2b/register` เข้าสู่ระบบ/สมัครสมาชิกแอดมินแบบ OTP

### WMS (Warehouse)

- `/wms` ภาพรวมคลัง (stats จาก `/api/wms/stats`)
- `/wms/inventory` สินค้าคงคลัง (อ่านจาก `/api/wms/products`)
- `/wms/inbound` รับเข้า (PurchaseOrder/ASN)
- `/wms/outbound` ส่งออก/งานหยิบ (อ่านจาก Order)
- `/wms/reports` รายงานคลัง
- หมายเหตุ: มีลิงก์ไป `/wms/movements` ใน UI แต่ **ยังไม่พบ route page**

---

## 4) API Routes — ระบบหลังบ้านที่มีอยู่

> หมายเหตุ: บาง endpoint รองรับหลาย method (GET/POST/PUT/PATCH/DELETE) ในไฟล์เดียว

### 4.1 Auth / Session

**Admin (B2B)**

- `GET /api/adminb2b/init` ตรวจสถานะระบบ (จำนวน admin/role)
- `POST /api/adminb2b/init` seed role/admin เริ่มต้น (มี role ชุด `admin/manager/staff`)
- `POST /api/adminb2b/login/send-otp` ส่ง OTP สำหรับแอดมินที่มีอยู่ในระบบ
- `POST /api/adminb2b/login/verify-otp` verify OTP + สร้าง JWT + set cookie `b2b_token`
- `POST /api/adminb2b/validate-token` ตรวจ token (jwtVerify)
- `GET /api/adminb2b/profile` profile จาก token
- `POST /api/adminb2b/logout` clear cookie `b2b_token`
- `POST /api/adminb2b/register` สมัครสมาชิกแอดมินแบบไม่ใช้ OTP (มีอยู่ แต่ UI register ใช้ flow OTP)
- `POST /api/adminb2b/register/send-otp`, `POST /api/adminb2b/register/verify-otp` สมัครสมาชิกแอดมินแบบ OTP

**User/Customer**

- `POST /api/auth/send-otp`, `POST /api/auth/verify-otp` OTP login โดยใช้ `User` model (cookie ชื่อ `token`)
- `POST /api/auth/customer/send-otp`, `POST /api/auth/customer/verify-otp` login ลูกค้าด้วย `customerCode + whitelist phone`
- `POST /api/auth/logout` ลบ cookie `b2b_token` (ควรทบทวนความสอดคล้องกับ cookie `token`)

### 4.2 Admin Management / RBAC / Signature

- `GET/POST /api/adminb2b/admins` list/create admin
- `PATCH/DELETE /api/adminb2b/admins/[id]` update/delete admin
- `GET/POST/PUT /api/adminb2b/roles` list/create/seed base roles + base permissions
- `PATCH/DELETE /api/adminb2b/roles/[id]` update/delete role
- `GET/POST/DELETE /api/users/signature` get/update/delete signature ของ `Admin`

### 4.3 CRM Core

- Customers:
  - `GET/POST /api/customers`
  - `GET/PUT/DELETE /api/customers/[id]`
  - `GET /api/customers/next-code` สร้าง customerCode ถัดไป
  - `GET /api/customers/check-tax-id` ตรวจเลขผู้เสียภาษีซ้ำ
- Leads:
  - `GET/POST /api/leads`
  - `POST /api/leads/[id]/convert` แปลง lead → customer + deal
  - `POST /api/import/leads` import leads จาก CSV (form-data)
- Deals:
  - `GET/POST /api/deals`
  - `GET/PATCH/DELETE /api/deals/[id]`
  - มี logic filter ตาม role ใน `src/app/api/deals/filter.ts`
- Pipeline stages:
  - `GET/POST/PUT /api/pipeline-stages` (PUT ใช้ reorder)
  - `PATCH/DELETE /api/pipeline-stages/[id]`
- Projects:
  - `GET/POST /api/projects`
  - `GET/PUT/PATCH/DELETE /api/projects/[id]`
- Activities:
  - `GET/POST /api/activities`
  - `GET/PATCH/DELETE /api/activities/[id]`
- Notes:
  - `GET/POST /api/notes`
  - `GET/PATCH/DELETE /api/notes/[id]`

### 4.4 Catalog / Products

- `GET/POST /api/products` (รองรับ search/pagination, includeDeleted แบบต้อง auth)
- `GET/PUT/PATCH/DELETE /api/products/[id]` (soft delete + restore)
- `GET /api/products/search` search แบบ lightweight สำหรับ autocomplete
- `GET/POST /api/categories`
- `GET/PUT/DELETE /api/categories/[id]`

### 4.5 Quotations / Sales Orders / Documents

- Quotations:
  - `GET/POST /api/quotations`
  - `GET/PUT/DELETE /api/quotations/[id]` (มี editHistory, lock fields เมื่อไม่ใช่ draft)
  - `GET/POST /api/quotations/[id]/pdf` (GET: PDF, POST: issue sales order number แล้วเรียก PDF)
  - `POST /api/quotations/[id]/send` (เปลี่ยนเป็น sent + แจ้ง LINE)
  - `PUT /api/quotations/[id]/status` (เปลี่ยน status + แจ้ง LINE)
  - `POST /api/quotations/[id]/convert` (legacy: mark convertedToOrder เป็นเลขที่)
  - `GET/POST/PUT /api/quotations/[id]/convert-to-sales-order` (สร้าง Order จาก Quotation)
  - `GET/POST/PUT /api/quotations/auto-generate` (สร้าง Quotation จาก Order)
- Sales Order PDF:
  - `GET /api/orders/[id]/pdf` (สำหรับ Order/Sales Order)

### 4.6 Orders / Payments

- `GET/POST /api/orders` (orderType online/sales_order, auto-generate quotation สำหรับ online)
- `GET/PUT /api/orders/[id]` (มี action หลายแบบ: confirm COD, verify slip, set due date, ฯลฯ)
- `GET /api/orders/my-orders` (ค้น order ตามเบอร์โทร)
- `POST/GET /api/payments/notifications` ส่งการแจ้งเตือนตามประเภท (รองรับ cron via GET)
- `POST /api/orders/[id]/upload-packing-proof` อัปโหลดหลักฐานแพ็ก (Cloudinary)
- `POST /api/orders/[id]/tax-invoice` request ใบกำกับภาษี
- `POST /api/orders/[id]/claim` เคลม
- `POST /api/orders/[id]/status` เปลี่ยนสถานะ order

### 4.7 Approvals

- `GET/POST /api/approvals`
- `PATCH /api/approvals/[id]`
- ใช้สำหรับดีล/ใบเสนอราคาที่เกิน policy (threshold/discount) เพื่ออนุมัติ/ปฏิเสธ

### 4.8 Reports / Analytics

- `GET /api/dashboard` KPI + charts
- `GET /api/forecast` พยากรณ์ยอดขาย (historical + pipeline + quotation + project)
- `GET /api/reports/sales-summary`
- `GET /api/reports/deals-by-stage`
- `GET /api/reports/customer-analysis`
- `GET /api/reports/performance`
- `GET /api/reports/product-sales`
- `GET /api/reports/activity-report`
- `GET /api/reports/export.csv` export deals CSV

### 4.9 Notifications (In-app + SMS/LINE utility)

- `GET/PATCH /api/notifications` list/mark-read (อิง `Notification` model)
- `POST /api/notification/sms` ส่ง SMS (มีการตรวจสิทธิ์แบบ jwtVerify จาก cookie)
- `POST /api/notification/dual` ส่ง SMS แบบ template
- `POST /api/line/webhook` รับ webhook จาก LINE bot
- โค้ดส่ง LINE ไป group ที่ผูกกับลูกค้า: `src/app/notification/group.ts`

### 4.10 WMS

- `GET /api/wms/stats`
- `GET /api/wms/products`
- `GET /api/wms/inbound` (PurchaseOrder + ASN)
- `GET /api/wms/outbound` (แปลง Orders → picking tasks)

### 4.11 Settings

- `GET/POST /api/settings` (อ่าน/อัปเดต `Settings`)
- `GET/POST /api/settings/logo` อัปโหลดโลโก้ไป Cloudinary แล้วเก็บลง `Settings.logoUrl`
- `GET/POST/PUT /api/settings/site` (`SiteSetting`: shipping fee/threshold)
- `GET/POST /api/adminb2b/settings` (อ่าน/อัปเดต `Settings` อีกชุดหนึ่ง)

### 4.12 Misc

- `GET /api/ping` health check

---

## 5) Data Models (MongoDB/Mongoose) — สิ่งที่ระบบ “มีจริง”

### Identity / Auth

- `Admin` ผู้ใช้ฝั่งแอดมิน (role ref ไป `Role`, มี team/zone/position/signatureUrl)
- `Role` roles + permissions list
- `OTPVerification` เก็บ token/ref/expires ของ OTP (auto-expire ด้วย TTL index)
- `User` ผู้ใช้ generic (role enum: customer/admin/manager) + signatureUrl (มีซ้ำกับ Admin)

### CRM / Sales

- `Customer` ข้อมูลลูกค้า + customerCode + authorizedPhones (ใช้กับ customer login)
- `Lead` leads + ownerId/team + convert → customerId/dealId
- `AssignmentState` state สำหรับ round-robin assignment
- `Deal` pipeline deal (stageId/stageName/ownerId/team/approvalStatus)
- `PipelineStage` สเตจของดีล
- `Project` โครงการ
- `Activity` งาน/กิจกรรมติดตาม
- `Note` โน้ตเร็ว

### Commerce / Docs / Policy

- `Product` สินค้า + SKU + units/options + stock/cost/location + soft delete
- `Category` หมวดหมู่
- `Quotation` ใบเสนอราคา + edit history + approval status + PDF
- `Order` ออเดอร์ online + sales_order + payment flow + packing proofs + tax invoice + claim
- `Approval` คำขออนุมัติ (deal/quotation)
- `Settings` ข้อมูลกิจการ + policy (approval threshold, max discount)
- `SiteSetting` ค่าขนส่ง/โลโก้แบบ site
- `Notification` in-app notification + TTL
- `PriceBook`, `DiscountPolicy` rule engine สำหรับ guardrails ส่วนลด (มี model + logic แล้ว แต่ยังไม่มี API/UI สำหรับบริหาร)

### WMS

- `PurchaseOrder`, `ASN` inbound docs

### Integrations

- `LineGroupLink` ผูก customer → LINE groupId (ใช้เวลาแจ้งเตือน)

---

## 6) Key Flows (ภาพรวมการทำงานจริง)

### 6.1 Admin login (OTP → JWT)

1) `/adminb2b/login` เรียก `POST /api/adminb2b/login/send-otp`
2) ยืนยันด้วย `POST /api/adminb2b/login/verify-otp`
3) server สร้าง JWT และ set cookie `b2b_token` + ฝั่ง client เก็บ token ใน `localStorage` เพื่อใช้ยิง API แบบ Bearer

### 6.2 Customer login (customerCode + whitelist phone)

1) `/login/customer` ส่ง OTP ผ่าน `POST /api/auth/customer/send-otp`
2) verify ผ่าน `POST /api/auth/customer/verify-otp`
3) server set cookie `token` (คนละ cookie กับฝั่ง admin)

### 6.3 Order (Shop) → Quotation auto-generate → Notifications

- `/shop` สร้าง `POST /api/orders` (orderType=online)
- backend พยายามสร้าง quotation อัตโนมัติ (ผ่าน `src/services/quotationGenerator.ts`)
- ถ้า paymentMethod=transfer จะ trigger แจ้งเตือนให้ upload slip
- ระบบแจ้งเตือนมีทั้ง SMS/LINE + in-app Notification (`Notification` model)

### 6.4 Deal/Quotation approvals

- Deal: ถ้า amount ≥ `Settings.salesPolicy.approvalAmountThreshold` จะสร้าง `Approval` และตั้ง `approvalStatus=pending`
- Quotation: guardrails ส่วนลดจาก `PriceBook` + `DiscountPolicy` + global max discount → อาจตั้ง pending และสร้าง `Approval`

### 6.5 PDF generation (Quotation / Sales Order)

- Quotation PDF: `GET /api/quotations/[id]/pdf`
  - รวมข้อมูล Settings (บริษัท/โลโก้/ธนาคาร)
  - เติม SKU จาก Product
  - เติมลายเซ็นจาก `Admin.signatureUrl` (ทั้งผู้เสนอ/ผู้อนุมัติ) ตาม role ที่เรียกสร้าง PDF
  - generate HTML → Puppeteer → PDF
- Sales Order PDF: `GET /api/orders/[id]/pdf` (เติม seller/approver signature)

---

## 7) Admin Panel — สิ่งที่ “มีแล้ว”

### 7.1 User/Admin Management

- หน้า `admins`: CRUD แอดมิน + toggle active + assign role
- หน้า `permissions`: CRUD roles + toggle permissions ต่อ role
- มี API ครบสำหรับ admins/roles และมี base permissions set

### 7.2 Business Operations

- CRM ครบแกน: leads → convert → customers + deals + pipeline stages + activities + notes
- Quotation workflow: draft → sent → accepted/rejected + PDF + issue SO number + convert to sales order
- Orders/payments: รองรับ COD/transfer/credit + reminder + slip flow + packing proof + tax invoice + claim
- Reports/dashboard/forecast: มี endpoint และ UI เรียกใช้แล้ว

### 7.3 Settings (ระดับหนึ่ง)

- company info + bank info + sales policy (threshold/discount) ผ่าน `Settings`
- upload logo ผ่าน Cloudinary (`/api/settings/logo`)

---

## 8) หน้าแอดมิน “ยังขาดอะไร” (ข้อเสนอแนะเชิงระบบ + หน้า UI ที่ควรมี)

ด้านล่างคือรายการที่ “มี foundation แล้ว” แต่ยังขาด UI/การบังคับใช้/ความครบถ้วน โดยจัดลำดับจากเร่งด่วน → เพิ่มมูลค่า

### A) ความปลอดภัย/สิทธิ์ (ควรทำก่อน)

1) **เปิดใช้งาน middleware auth จริง**
   - ตอนนี้ `middleware.ts` ปิด auth ด้วย `TEMP_DISABLE_AUTH = true`
   - ควรเปิดและทำให้สอดคล้องกับ flow token ในทุกหน้า/ทุก API

2) **ทำ RBAC ให้เป็นมาตรฐานเดียว**
   - ปัจจุบันมี role naming หลายชุด (เช่น `admin/manager/staff` vs `Super Admin/Sales Admin/Seller`) และหลาย API ใช้ `decodeJwt` โดยไม่ verify
   - แนะนำ: ยึด `Role.permissions[]` เป็นหลัก + สร้าง helper กลางสำหรับ “verify token + load admin + resolve permissions”

3) **ซ่อน/ล็อกฟีเจอร์ตาม permission ใน UI**
   - เช่น เมนู Sidebar ควร render เฉพาะที่มีสิทธิ์, ปุ่มลบ/แก้ไข disable ตาม permission

4) **Audit log / Activity log สำหรับการกระทำของแอดมิน**
   - ใครสร้าง/แก้/ลบอะไร เมื่อไหร่ (สำคัญมากสำหรับระบบขาย/เอกสาร)

### B) “หน้าโปรไฟล์แอดมิน” และ “หน้าตั้งค่าลายเซ็น” (ตรงกับโจทย์)

1) **หน้าโปรไฟล์ของตัวเอง**
   - แสดงข้อมูลจาก `/api/adminb2b/profile`
   - แก้ไข: ชื่อ/อีเมล/บริษัท/ตำแหน่ง/team/zone (field มีใน `Admin`)

2) **หน้าจัดการลายเซ็น (Signature Settings)**
   - อัปโหลดลายเซ็น (แนะนำใช้ Cloudinary หรือระบบ upload ที่มีอยู่)
   - ตั้งค่า `position` เพื่อไปแสดงใน PDF
   - แสดง preview ในเอกสาร (quotation/sales order)
   - รองรับหลายบทบาท (seller/approver) หากต้องการแยก signature ต่อ role

### C) System Settings ที่ควรเติม

- ตั้งค่าขนส่ง/threshold (`SiteSetting`) ให้มี UI ใช้งานจริง
- ตั้งค่า template ข้อความแจ้งเตือน (SMS/LINE) และเปิด/ปิดช่องทาง
- ตั้งค่าเลขรันเอกสาร/รูปแบบเลข (quotation number, sales order number) ให้กำหนดได้
- ตั้งค่า customer login whitelist (authorizedPhones) ผ่านหน้า customer

### D) Pricing/Discount Governance (มี logic แล้วแต่ยังไม่มีหน้าบริหาร)

- หน้า “PriceBook Management” และ “Discount Policy Management”
  - CRUD `PriceBook` และ `DiscountPolicy`
  - ตั้ง effectiveFrom/effectiveTo
  - ผูก customerGroup/role/สินค้า/หมวด/ขั้นต่ำจำนวน ฯลฯ
  - เชื่อม approval flow ให้ชัดเจน

### E) Notifications Center

- หน้า “Notifications” ดูรายการจาก `/api/notifications`, mark-as-read, filter by type/priority
- หน้า “Broadcast/Announcement” สำหรับส่ง SMS/LINE แบบปลอดภัย (มี endpoint แล้วบางส่วน)

### F) Data tools ที่ทีมแอดมินมักต้องใช้

- Import/Export เพิ่มเติม: customers/products/orders (ปัจจุบันมี lead import และ deals export csv)
- Recycle bin (restore) สำหรับ entity ที่รองรับ soft delete (เช่น Product) และเพิ่ม soft delete ให้ entity อื่นถ้าต้องการ

### G) WMS ให้ “ทำงานจริง” มากขึ้น (ถ้าจะใช้เป็นระบบคลัง)

- เพิ่มหน้าทำงาน inbound receiving/outbound picking/packing ที่เขียนกลับ DB + stock movements log
- เพิ่ม Stock Movement Ledger (รับเข้า/ส่งออก/ปรับปรุง) เพื่อ audit

---

## 9) Risks / Tech Debt ที่ควรรับรู้ (เพื่อวาง Roadmap)

- `middleware.ts` ปิด auth → API หลายส่วนพึ่ง “ความไว้ใจ” จาก client guard มากเกินไป
- หลาย route ใช้ `decodeJwt` (ไม่ verify) → เสี่ยงถูกปลอม token ถ้า middleware ไม่ทำงาน
- RBAC naming/level ไม่เป็นชุดเดียว → อาจเกิด “ผู้มีสิทธิ์ควรเห็นแต่ไม่เห็น” หรือ “ผู้ไม่ควรเห็นแต่เห็น”
- มี model ซ้ำด้าน identity (`User` vs `Admin`) และ cookie คนละชื่อ (`token` vs `b2b_token`) → ควรกำหนด boundary ชัด (customer vs admin)
- เมนู/หน้า UI บางส่วนมี link ที่ยังไม่พบ route (`/contact`, `/wms/movements`)

---

## 10) Next Suggested Steps (ลำดับที่คุ้มสุด)

1) เปิด auth middleware + ทำ verify token ให้เป็นมาตรฐานเดียวใน API
2) ปรับ RBAC ให้สอดคล้องกับ `Role.permissions` + ทำ UI gating ตาม permission
3) เพิ่มหน้า “โปรไฟล์ + ลายเซ็น” (ใช้ `/api/users/signature`) และให้ PDF ดึงข้อมูลครบ
4) เพิ่มหน้า “PriceBook/DiscountPolicy” เพื่อให้ guardrails ใช้งานได้จริงในธุรกิจ
5) เพิ่มหน้า Notifications center + ปรับ header/profile ให้ดึงข้อมูลจริงจาก backend

