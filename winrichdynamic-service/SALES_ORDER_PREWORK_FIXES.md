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

## ข้อเสนอแนะลำดับความสำคัญ (ย่อ)
1) จัดการ “เลข SO” ให้เป็นระบบเดียวและบังคับลง `Order`
2) แก้ flow แปลง Quotation → SO ให้เก็บข้อมูลราคา/ภาษีครบ
3) ยกเลิก/รวม flow “ออก SO แบบ PDF” ให้สร้าง `Order` จริง
4) ล็อกราคาใน SO และแก้ PDF ให้ใช้ยอดจาก Order
5) แก้สถานะซ้ำซ้อน + เติม validation ใน API
6) ปิดช่องว่าง auth + เคลียร์ migration ที่ค้าง

