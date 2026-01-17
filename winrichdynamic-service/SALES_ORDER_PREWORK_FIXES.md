# เอกสารสรุปปัญหาและสิ่งที่ต้องแก้ก่อนทำระบบแบ่งส่งสินค้า

เอกสารนี้รวบรวม “ปัญหาที่ต้องแก้ไขก่อน” เพื่อให้ระบบใบสั่งขายมีฐานข้อมูลที่ถูกต้องและพร้อมรองรับการแบ่งส่งในขั้นถัดไป

## ปัญหาที่ต้องแก้ (ภาษาง่าย ๆ)
1) **เลขใบสั่งขาย (SO) สร้างหลายทางและไม่ตรงกัน**
   - ปัจจุบันเลขถูกสร้างจากหลายจุด และบาง flow ไม่บันทึกเลขลง `Order`
   - ผลคือเอกสาร/รายงาน/ค้นหาไม่สอดคล้องกัน
   - ไฟล์เกี่ยวข้อง: `src/components/SalesOrderForm.tsx`, `src/services/salesOrderGenerator.ts`, `src/utils/salesOrderNumber.ts`, `src/scripts/run-migrations.js`

2) **แปลงใบเสนอราคา → ใบสั่งขาย แต่ข้อมูลราคาไม่ครบ**
   - การสร้าง Sales Order จาก Quotation ไม่เติม `discount/amount/vat` ในรายการ
   - PDF ใบสั่งขายจึงคำนวณยอดผิด
   - ไฟล์เกี่ยวข้อง: `src/services/salesOrderGenerator.ts`, `src/utils/salesOrderPdf.ts`

3) **ออกใบสั่งขายจากใบเสนอราคา แต่ไม่สร้าง Order จริง**
   - ตอนกด “ออก SO” ระบบแค่ mark ใน Quotation แล้วดาวน์โหลด PDF
   - WMS/หน้ารายการ Sales Order จะไม่เห็นใบสั่งขายนั้น
   - ไฟล์เกี่ยวข้อง: `src/app/api/quotations/[id]/pdf/route.ts`, `src/app/adminb2b/quotations/page.tsx`

4) **ราคายังเปลี่ยนตามสินค้าได้หลังออกใบสั่งขาย**
   - ฟอร์มสามารถดึงราคาสินค้าปัจจุบันมาใช้ใหม่ ทำให้ราคา SO เปลี่ยนได้
   - ต้องล็อกราคาใน SO เป็น “ราคา snapshot”
   - ไฟล์เกี่ยวข้อง: `src/components/SalesOrderForm.tsx`

5) **PDF ใบสั่งขายอาจไม่ตรงยอดจริง**
   - PDF คำนวณจาก `items.amount` หากว่างจะผิด
   - ไม่มีแสดง shipping fee / order-level discount อย่างชัดเจน
   - ไฟล์เกี่ยวข้อง: `src/utils/salesOrderPdf.ts`, `src/app/api/orders/[id]/pdf/route.ts`

6) **สถานะคำสั่งซื้อซ้ำซ้อน (status vs deliveryStatus)**
   - บางหน้าใช้ `status` บางหน้าใช้ `deliveryStatus`
   - ทำให้สับสนและรายงานไม่ตรง
   - ไฟล์เกี่ยวข้อง: `src/models/Order.ts`, `src/app/api/orders/[id]/status/route.ts`

7) **มีการเรียก API tracking ที่ไม่มีจริง**
   - `addTracking()` ใน client เรียก `/api/orders/[id]/tracking` แต่ไม่มี route นี้
   - ควรสร้าง endpoint หรือเอาออก
   - ไฟล์เกี่ยวข้อง: `src/features/jubili/services/apiService.ts`

8) **API อัปเดต Order ไม่มี validation**
   - `PUT /api/orders/[id]` อัปเดตฟิลด์ใดก็ได้แบบไม่ตรวจสอบ
   - เสี่ยงข้อมูลผิด/ทับค่าที่ไม่ควรเปลี่ยน
   - ไฟล์เกี่ยวข้อง: `src/app/api/orders/[id]/route.ts`

9) **ระบบ auth ถูกปิด ทำให้ทุก API เปิด**
   - `TEMP_DISABLE_AUTH = true` ทำให้ไม่มีการตรวจสิทธิ์
   - ควรเปิด auth ก่อนเริ่มเพิ่มระบบใหม่
   - ไฟล์เกี่ยวข้อง: `middleware.ts`

10) **ข้อมูลเก่าบางรายการยังไม่ครบ**
   - บาง SO ไม่มีเลข หรือข้อมูลอื่นยังไม่ถูก backfill
   - ต้องทำ migration ให้เรียบร้อยก่อนรองรับระบบแบ่งส่ง
   - ไฟล์เกี่ยวข้อง: `src/scripts/run-migrations.js`

## ปัญหาที่ต้องแก้ (ใบเสนอราคา)
1) **สูตร VAT/ยอดรวมไม่ตรงกันระหว่างฟอร์มกับฝั่งเซิร์ฟเวอร์**
   - ฟอร์มคำนวณ VAT แบบ “บวกเพิ่ม” แต่โมเดล/บริการถือว่าราคารวม VAT แล้ว
   - ทำให้ยอดในฐานข้อมูลและ PDF ต่างจากหน้าจอ โดยเฉพาะตอนสร้างใหม่
   - ไฟล์เกี่ยวข้อง: `src/components/QuotationForm.tsx`, `src/services/quotationService.ts`, `src/models/Quotation.ts`, `src/utils/quotationPdf.ts`

2) **อัปเดตใบเสนอราคาไม่คำนวณยอดใหม่บนเซิร์ฟเวอร์**
   - `PUT /api/quotations/[id]` ใช้ `findByIdAndUpdate` ทำให้ไม่ได้รัน pre-save คำนวณยอด
   - ถ้า client คำนวณผิด ยอดจะผิดถาวรในฐานข้อมูล
   - ไฟล์เกี่ยวข้อง: `src/app/api/quotations/[id]/route.ts`, `src/models/Quotation.ts`

3) **สถานะ sent ถูกตั้งจากฟอร์มโดยไม่มีข้อมูลการส่ง**
   - ปุ่ม “บันทึกและส่งอนุมัติ” ตั้ง `status=sent` แต่ไม่เติม `sentAt/sentBy/sentMethod`
   - ข้อมูลการส่งไม่ครบและประวัติเอกสารไม่สะท้อนการส่งจริง
   - ไฟล์เกี่ยวข้อง: `src/components/QuotationForm.tsx`, `src/app/api/quotations/[id]/send/route.ts`, `src/models/Quotation.ts`

4) **ระบบอนุมัติส่วนลดใช้งานไม่ครบ**
   - `checkDiscountGuardrails` ถ้าลดเกินนโยบายจะ error ทันที ทำให้ไม่เข้า flow ขออนุมัติ
   - ฟอร์มสามารถตั้ง `approvalStatus=pending` แต่ไม่สร้าง Approval record
   - ไฟล์เกี่ยวข้อง: `src/utils/pricing.ts`, `src/services/quotationService.ts`, `src/app/api/quotations/[id]/route.ts`, `src/components/QuotationForm.tsx`, `src/app/api/approvals/route.ts`

5) **เลขใบเสนอราคาอาจซ้ำ**
   - ใช้วิธีนับเอกสารรายเดือนแบบไม่ล็อก และไม่มี unique index
   - เสี่ยงเลขซ้ำเมื่อสร้างพร้อมกันหลายคน
   - ไฟล์เกี่ยวข้อง: `src/services/quotationService.ts`, `src/services/quotationGenerator.ts`, `src/models/Quotation.ts`

6) **Schema กับ Model ไม่ตรงกัน**
   - `subject` และ `productName` เป็น optional ใน schema แต่ model บังคับ required
   - บางช่องทางสร้างใบเสนอราคาอาจ fail ด้วย validation ที่ไม่คาดคิด
   - ไฟล์เกี่ยวข้อง: `src/schemas/quotation.ts`, `src/models/Quotation.ts`

7) **การแปลงใบเสนอราคา → ใบสั่งขายมีหลายเส้นทางและผลลัพธ์ไม่เหมือนกัน**
   - `/convert` แค่เขียนเลขลง `convertedToOrder`
   - `/pdf` ทำเครื่องหมายออก SO แต่ไม่สร้าง Order จริง
   - `/convert-to-sales-order` ถึงจะสร้าง Order จริง
   - ไฟล์เกี่ยวข้อง: `src/app/api/quotations/[id]/convert/route.ts`, `src/app/api/quotations/[id]/pdf/route.ts`, `src/app/api/quotations/[id]/convert-to-sales-order/route.ts`, `src/services/salesOrderGenerator.ts`

8) **Quotation settings ยังไม่เชื่อมจริง**
   - UI เรียก `/api/settings/quotation` แต่ไม่มี route นี้
   - `checkIfQuotationRequired` อ้าง field ที่ไม่มีใน `Product/Customer`
   - ไฟล์เกี่ยวข้อง: `src/components/quotation/QuotationSettings.tsx`, `src/services/quotationGenerator.ts`, `src/models/Product.ts`, `src/models/Customer.ts`

9) **Jubili ใช้ method ไม่ตรงกับ backend**
   - ฝั่ง Jubili เรียก `PATCH /api/quotations/[id]/status` แต่ backend มีเฉพาะ `PUT`
   - เปลี่ยนสถานะอาจไม่สำเร็จในหน้า Jubili
   - ไฟล์เกี่ยวข้อง: `src/features/jubili/services/apiService.ts`, `src/app/api/quotations/[id]/status/route.ts`

## ข้อสังเกต/จุดแปลก (ใบเสนอราคา)
1) **Quotation มีฟิลด์ติดตามการส่งสินค้า**
   - มี `deliveryBatches/remainingQuantity/deliveryStatus` อยู่ในใบเสนอราคา
   - ยังไม่เห็น flow ใช้งานจริง อาจสับสนกับระบบส่งจริง
   - ไฟล์เกี่ยวข้อง: `src/models/Quotation.ts`, `src/components/QuotationForm.tsx`, `src/app/api/quotations/[id]/route.ts`

2) **ฟิลด์ในฟอร์มหลายตัวไม่ถูกบันทึกจริง**
   - เช่น `importance/team/attachments/deliveryDate/paymentDays/issueDate` ฯลฯ
   - อาจทำให้ผู้ใช้คิดว่าเก็บแล้วแต่จริง ๆ ไม่ถูกใช้
   - ไฟล์เกี่ยวข้อง: `src/components/QuotationForm.tsx`, `src/schemas/quotation.ts`

3) **มีฟอร์มใบเสนอราคา 2 ชุดคนละระบบ**
   - `src/components/QuotationForm.tsx` (ใบเสนอราคา)
   - `src/components/sales-status/QuotationForm.tsx` (อัปเดตสถานะลูกค้า)
   - ชื่อเหมือนกันแต่คนละ data model

4) **UI สองชุดแสดงสถานะไม่สอดคล้อง**
   - หน้า Jubili มีสถานะ `pending/approved` แต่ model ใช้ `draft/sent/accepted/...`
   - อาจทำให้แปลผลสถานะผิด
   - ไฟล์เกี่ยวข้อง: `src/features/jubili/pages/Quotations.jsx`, `src/models/Quotation.ts`

5) **ใบเสนอราคาเปิดดู/ดาวน์โหลด PDF ได้โดยไม่ต้องล็อกอิน**
   - `/quotation/[id]/pdf` และ `/quotation/[id]/data` ไม่มี auth บังคับ (ยกเว้น seller)
   - หากลิงก์หลุดอาจมีความเสี่ยงข้อมูล
   - ไฟล์เกี่ยวข้อง: `src/app/quotation/[id]/pdf/route.ts`, `src/app/quotation/[id]/data/route.ts`, `src/services/quotationPdfService.ts`

6) **ไม่มีระบบทำให้สถานะหมดอายุอัตโนมัติ**
   - มี virtual `isExpired` แต่ไม่มี job ตั้ง `status=expired`
   - ไฟล์เกี่ยวข้อง: `src/models/Quotation.ts`

7) **การส่งใบเสนอราคาไม่ถูกบันทึกใน editHistory**
   - `/send` route ไม่ push `editHistory` แต่ `/status` route ทำ
   - ประวัติเอกสารอาจไม่ครบ
   - ไฟล์เกี่ยวข้อง: `src/app/api/quotations/[id]/send/route.ts`, `src/app/api/quotations/[id]/status/route.ts`

8) **ฟิลด์เชื่อม Order/Quotation ซ้ำซ้อน**
   - Order มีทั้ง `quotationId`, `generatedQuotationId`, `sourceQuotationId`
   - ใช้งานต่างกัน ทำให้ติดตามที่มาลำบาก
   - ไฟล์เกี่ยวข้อง: `src/models/Order.ts`, `src/services/quotationGenerator.ts`, `src/services/salesOrderGenerator.ts`
