# Sales Order System Audit (Detailed Inspection Log)

เอกสารนี้บันทึกการตรวจสอบระบบใบสั่งขายแบบละเอียด พร้อมจุดเชื่อมต่อกับส่วนอื่น และช่องว่างที่พบในระบบปัจจุบัน เพื่อใช้เป็นฐานในการออกแบบ “ระบบแบ่งส่งสินค้า” ตามความต้องการใหม่

## Scope
- ตรวจเส้นทาง “ใบเสนอราคา → ใบสั่งขาย → PDF → เปลี่ยนสถานะ → WMS/แจ้งเตือน”
- ตรวจทั้งส่วน UI, API, Service, Model, PDF, และ Integrations ที่เกี่ยวข้องกับใบสั่งขาย

## System Map (High-Level)
- Order model ใช้เป็น Sales Order ผ่าน `orderType = sales_order`
- ใบเสนอราคา (Quotation) สามารถแปลงเป็น Sales Order ได้หลายทาง
- การสร้าง PDF ใบสั่งขายใช้ `Order` เป็นหลัก
- WMS outbound อ่าน `Order` แล้วแสดงงานเบิก/แพ็ค/ส่ง
- ระบบแจ้งเตือนอ้างอิง order id เป็นหลัก ไม่ใช่เลขใบสั่งขาย

## Inspection Log (ตรวจทีละจุด)

### 1) Data Model: Order (Sales Order)
ไฟล์ที่ตรวจ: `src/models/Order.ts`
- ฟิลด์หลักสำหรับใบสั่งขายอยู่ใน `Order` โดยใช้ `orderType: 'sales_order'`
- รายการสินค้าอยู่ใน `items[]` ซึ่งมี `unitPrice`, `discount`, `amount` ต่อหน่วย/ต่อรายการ
- มีทั้ง `status` (pending/confirmed/ready/shipped/delivered/cancelled) และ `deliveryStatus` (pending/preparing/shipped/delivered) แยกกัน
- ไม่มี `lineId` หรือ identifier ต่อรายการ ทำให้ยากต่อการอ้างอิงรายการเดิมเมื่อ “แบ่งส่ง”
- ยังไม่มีโครงสร้าง `deliveryBatches` สำหรับการแบ่งส่งอยู่ใน Order

ข้อสังเกต:
- ควรมี ID ต่อรายการสินค้า เพื่อใช้ tracking การส่งเป็นงวด
- ควรมี summary ฟิลด์สำหรับ delivered/remaining เพื่อคำนวณยอดคงเหลือเร็วขึ้น

---

### 2) การสร้างใบสั่งขาย (Manual)
ไฟล์ที่ตรวจ: `src/components/SalesOrderForm.tsx`, `src/features/jubili/pages/SalesOrders.jsx`, `src/app/api/orders/route.ts`

พฤติกรรมปัจจุบัน:
- ฟอร์ม Sales Order ดึงราคาจากสินค้า ณ เวลาที่เลือก (ProductAutocomplete) แล้วคำนวณยอดรวมในฟอร์ม
- การบันทึกไปที่ `POST /api/orders` ส่ง `orderType: 'sales_order'` และ `salesOrderNumber` แบบ `SO${Date.now()}`
- API `POST /api/orders` คำนวณ `totalAmount` สำหรับ sales order ด้วยสูตร:
  - subtotal (จาก item.amount) + vatAmount + shippingFee - discount
- ในฟอร์มไม่มี order-level discount แยก (ส่งเฉพาะ item.discount)

ช่องว่างที่พบ:
- การแก้ไขใบสั่งขายสามารถเปลี่ยนราคาใหม่จากสินค้าได้ง่าย (ไม่มี “lock price”)
- เลขใบสั่งขายถูกสร้างแบบ timestamp ไม่มีตรวจซ้ำและไม่สอดคล้องกับเลขจากส่วนอื่น
- ระบบไม่บังคับให้ `salesOrderNumber` ต้องมี / unique

---

### 3) การสร้างใบสั่งขายจากใบเสนอราคา
ไฟล์ที่ตรวจ: `src/services/salesOrderGenerator.ts`, `src/services/quotationGenerator.ts`,
`src/app/api/quotations/[id]/convert-to-sales-order/route.ts`

พฤติกรรมปัจจุบัน:
- ใช้ `generateSalesOrderFromQuotation()` เพื่อสร้าง Order ใหม่จาก Quotation
- Order ที่สร้าง “ไม่มี” `salesOrderNumber` และ “ไม่มี” `vatRate/vatAmount`
- รายการสินค้าใน Sales Order ถูกสร้างด้วย `price` และ `unitPrice` แต่ **ไม่เติม item.discount/amount**
- Quotation ถูกอัปเดต `salesOrderNumber = SO<id-suffix>` แต่ Order ไม่ถูกอัปเดตเลขเดียวกัน

ช่องว่างที่พบ:
- Sales Order ที่สร้างจาก Quotation ไม่มีเลขใบสั่งขายในตัวเอง (ต้องรอ migration)
- PDF ใบสั่งขายจะคำนวณจาก item.amount/discount ที่ว่าง → ตัวเลขผิดจาก Quotation

---

### 4) Issue Sales Order (PDF) จากใบเสนอราคา (ไม่สร้าง Order)
ไฟล์ที่ตรวจ: `src/app/api/quotations/[id]/pdf/route.ts`,
`src/app/adminb2b/quotations/page.tsx`, `src/utils/salesOrderNumber.ts`

พฤติกรรมปัจจุบัน:
- “ออกใบสั่งขาย” จากหน้าใบเสนอราคา = mark `salesOrderIssued=true` ใน Quotation แล้วโหลด PDF ใบเสนอราคาเดิม
- ไม่มีการสร้าง `Order` จริง แต่มีเลขใบสั่งขายใน Quotation

ช่องว่างที่พบ:
- มี 2 เส้นทาง: “ออก SO (แค่ PDF)” กับ “แปลงเป็น Sales Order จริง” → ข้อมูลไม่สอดคล้อง
- ระบบปลายทาง (WMS/Orders) อ่านจาก Order จึงไม่เห็น “SO ที่ออกแล้ว” ใน Quotation ถ้าไม่ได้สร้าง Order

---

### 5) เปลี่ยนสถานะใบสั่งขาย / ออเดอร์
ไฟล์ที่ตรวจ: `src/app/api/orders/[id]/status/route.ts`, `src/app/api/orders/[id]/route.ts`,
`src/app/adminb2b/orders/page.tsx`

พฤติกรรมปัจจุบัน:
- `PATCH /api/orders/[id]/status` ใช้เปลี่ยน status โดยมี auth และถ้าเป็นออนไลน์ (orderType != sales_order) จะ auto-generate quotation + sales order
- `PUT /api/orders/[id]` สามารถอัปเดตฟิลด์อะไรก็ได้ (ไม่มี validation)

ช่องว่างที่พบ:
- status flow ไม่มีการ enforce step (เช่น shipped ก่อน confirmed)
- ระบบมีทั้ง `status` และ `deliveryStatus` แต่บางหน้าใช้คนละ field

---

### 6) PDF ใบสั่งขาย
ไฟล์ที่ตรวจ: `src/app/api/orders/[id]/pdf/route.ts`, `src/utils/salesOrderPdf.ts`

พฤติกรรมปัจจุบัน:
- PDF ใช้ข้อมูลจาก Order และคำนวณยอดรวมจาก `items.amount` หากไม่มี `subtotal`
- ถ้า `vatRate` ไม่มี จะใช้ default 7%
- ไม่มีส่วนแสดง shipping fee และ order-level discount แยกใน PDF

ช่องว่างที่พบ:
- ถ้า Order ถูกสร้างจาก Quotation และไม่มี item.discount/amount → PDF ผิด
- หาก order-level discount ถูกใช้จริง อาจไม่สะท้อนในรายการสินค้า

---

### 7) WMS Outbound และ Picking Tasks
ไฟล์ที่ตรวจ: `src/app/api/wms/outbound/route.ts`, `src/app/wms/outbound/page.tsx`

พฤติกรรมปัจจุบัน:
- ดึง Order ทั้งหมด (หรือ filter ด้วย orderType) แล้วสร้าง salesOrders/pickingTasks แบบสรุป
- ไม่มีโครงสร้าง “แบ่งส่ง” → pickedItems/totalItems คิดจากสถานะรวม

ช่องว่างที่พบ:
- ไม่มีการ track รายการเบิกทีละงวด
- ไม่สามารถเชื่อมกับเลขส่งย่อย (เช่น SO0001_0001)

---

### 8) Notifications & Payment Integration
ไฟล์ที่ตรวจ: `src/app/notification/paymentNotifications.ts`, `src/lib/notifications.ts`

พฤติกรรมปัจจุบัน:
- แจ้งเตือนใช้ order id (ท้าย 6 ตัว) ไม่ได้ใช้ `salesOrderNumber`
- ไม่มีข้อความ/โครงสร้างรองรับ “แบ่งส่ง”

---

### 9) Client API Wrappers
ไฟล์ที่ตรวจ: `src/features/jubili/services/apiService.ts`

ช่องว่างที่พบ:
- `addTracking()` เรียก `/api/orders/[id]/tracking` แต่ไม่มี route นี้จริง
- กรณี PDF / issue SO ใน Quotation ยังอยู่คนละเส้นทางกับ Sales Order จริง

---

### 10) Migration & Numbering
ไฟล์ที่ตรวจ: `src/scripts/run-migrations.js`, `src/utils/salesOrderNumber.ts`

พฤติกรรมปัจจุบัน:
- มี migration ย้อนเติม salesOrderNumber จาก Quotation → Order
- `buildSalesOrderNumber()` ใช้ `SO` + id suffix

ช่องว่างที่พบ:
- การสร้างเลขปัจจุบันกระจัดกระจายหลายจุด ไม่ได้ใช้แหล่งเดียว

---

### 11) Auth / Access Control
ไฟล์ที่ตรวจ: `middleware.ts`

ข้อสังเกต:
- `TEMP_DISABLE_AUTH = true` ทำให้ทุก API/หน้าเปิดใช้งาน
- endpoint บางจุด (เช่น `/api/orders`) ไม่มี auth guard ในตัว

---

## Key Gaps & Risks (สรุปจุดเสี่ยงสำคัญ)
1) **เลขใบสั่งขายไม่สอดคล้องกัน**  
   - หลายจุดสร้างเลขเอง (`SalesOrderForm`, `salesOrderGenerator`, `buildSalesOrderNumber`)  
   - บาง flow ไม่สร้างเลขใน Order แต่สร้างใน Quotation  

2) **ราคาถูกแก้ได้หลังออกใบสั่งขาย**  
   - ฟอร์มยังดึงราคาจากสินค้าเมื่อแก้ไข  
   - ไม่มี lock หรือ snapshot ที่ชัดเจน  

3) **ยอดรวมและ PDF อาจผิดจาก Quotation**  
   - `generateSalesOrderFromQuotation()` ไม่เติม item.discount/amount และ vat fields  
   - PDF คำนวณจาก item.amount จึงไม่ตรงกับ Quotation  

4) **โครงสร้างข้อมูลไม่รองรับการแบ่งส่ง**  
   - ไม่มี delivery batches ใน Order  
   - ไม่มี lineId/itemId สำหรับ tracking ต่อรายการ  

5) **API และ UI ไม่มีเส้นทางจัดส่งแบบเป็นงวด**  
   - WMS outbound สรุปแบบ order-level เท่านั้น  
   - ไม่มี delivery note/partial invoice  

6) **การเปลี่ยนสถานะไม่มี validation และมีหลาย status field**  
   - ความเสี่ยงเรื่องข้อมูลสับสน (status vs deliveryStatus)  

7) **Missing API route**  
   - `addTracking` เรียก endpoint ที่ไม่มีจริง  

---

## Requirement ใหม่ที่ต้องรองรับ (จากผู้ใช้)
- แบ่งส่งสินค้าในใบสั่งขายได้ (SO + suffix `_0001`, `_0002`…)
- เลือกติ๊กสินค้า/จำนวนต่อรอบส่ง
- แสดงยอดคงเหลือ (จำนวนและมูลค่า)
- ราคาต้องอิง “ราคาตามใบสั่งขาย” เท่านั้น ไม่ดึงจาก Product
- ต้องบอกมูลค่าของการส่งแต่ละรอบอย่างชัดเจน

---

## Proposed Design: Partial Delivery (แบ่งส่งสินค้า)

### 1) Data Model (Order)
เพิ่มโครงสร้างใน `Order` เพื่อเก็บรอบส่งและการคงเหลือ
- เพิ่ม `lineId` ใน `items[]` เพื่ออ้างอิงรายการเดิมแบบถาวร
- เพิ่ม `deliveryBatches[]` (หรือ `fulfillmentBatches[]`) ตัวอย่าง:
  - `batchId`: string (uuid)
  - `batchNumber`: `${salesOrderNumber}_${0001}`
  - `sequence`: number
  - `status`: 'draft' | 'picking' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
  - `deliveryDate`, `trackingNumber`, `shippingProvider`, `deliveryMethod`, `notes`
  - `items[]`: { lineId, productId, name, sku, unitLabel, quantity, unitPrice, discountPerUnit, amount }
  - `subtotal`, `vatRate`, `vatAmount`, `totalAmount` (คำนวณจากราคาของ Order เท่านั้น)
  - `createdAt`, `createdBy`
- เพิ่ม summary fields:
  - `deliveredSummary`: { totalDeliveredQty, totalRemainingQty, deliveredValue, remainingValue }
  - `deliveryStatus`: 'not_started' | 'partially_delivered' | 'fully_delivered'

หมายเหตุ: ควรคำนวณยอดด้วย “ราคาจาก Order” เท่านั้น เพื่อไม่พึ่ง Product

---

### 2) Pricing Rules (ยึดราคาจากใบสั่งขาย)
- ราคาต่อหน่วย/ส่วนลดต้อง snapshot ตอนสร้าง SO แล้วถูกใช้ไปจนจบ
- คำนวณมูลค่ารอบส่ง:
  - `lineAmount = (unitPrice - discountPerUnit) * qty`
  - `batchSubtotal = sum(lineAmount)`
  - `batchVat = batchSubtotal * vatRate`
  - `batchTotal = batchSubtotal + batchVat (+ shippingFee ตามนโยบาย)`

**จุดต้องตัดสินใจร่วมกัน**
- Shipping fee จะคิดรอบไหน? (รอบแรก/รอบสุดท้าย/เฉลี่ยตามสัดส่วน)
- ถ้ามี order-level discount จะกระจายยังไง? (pro-rate ตามมูลค่ารายการ)

---

### 3) Numbering (SO + _0001)
- ใช้ `salesOrderNumber` เป็นฐาน
- สร้าง `batchNumber = ${salesOrderNumber}_${pad4(sequence)}`
- `sequence` นับเพิ่มจาก batch ล่าสุด (ไม่ reuse)
- ถ้า `salesOrderNumber` ยังว่าง ต้องสร้างก่อน (บังคับให้มีเลขเมื่อออก SO)

---

### 4) API Design (ตัวอย่าง)
1) `POST /api/orders/{id}/deliveries`
   - สร้างรอบส่งใหม่ด้วยรายการและจำนวน
   - ตรวจไม่ให้เกิน remaining
   - คำนวณมูลค่าและอัปเดต summary

2) `GET /api/orders/{id}/deliveries`
   - ดึงรายการรอบส่งทั้งหมด

3) `PATCH /api/orders/{id}/deliveries/{batchId}`
   - อัปเดตสถานะ, tracking, เอกสารแนบ

4) `GET /api/orders/{id}/deliveries/{batchId}/pdf`
   - สร้างเอกสารส่งของ (Delivery Note) พร้อมเลข `_0001`

---

### 5) UI Changes
- หน้า Sales Order detail:
  - แสดง “รายการคงเหลือ” ต่อสินค้า
  - ปุ่ม “สร้างรอบส่ง” พร้อมติ๊กสินค้ากับจำนวน
  - ตาราง history ของรอบส่ง (batchNumber + มูลค่า)
- หน้า WMS Outbound:
  - ใช้ batch เป็นหน่วยหลักของ Picking/Shipping
  - แยกงานตามรอบส่งแทน order เดียว

---

### 6) Migration Plan
- เติม `lineId` ให้ items เดิมทุกใบสั่งขาย
- สร้าง `deliveryStatus = not_started` และ summary values จากยอดเดิม
- สำหรับ sales order ที่มีการส่งบางส่วนแบบ manual อาจต้อง backfill ด้วย batch เสมือน (optional)

---

### 7) Testing Plan (ขั้นต่ำ)
- Unit test คำนวณ batchSubtotal/batchTotal จากราคาใน Order
- Validation test ห้ามส่งเกิน remaining
- Test การสร้าง batch number `_0001` และ increment

---

## Open Questions / Decisions
1) Shipping fee และส่วนลดรวม จะกระจายต่อ batch อย่างไร?
2) ต้องการออกเอกสารอะไรต่อ batch? (ใบส่งของ/ใบกำกับชั่วคราว)
3) ยอดคงเหลือควรคำนวณแบบ include VAT หรือ exclude VAT?
4) ต้องการให้ batch “ยกเลิก” ส่งผลยังไงกับ summary?

