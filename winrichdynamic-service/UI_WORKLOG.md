# เอกสารทำงานแบบใช้ไปทำไป (Live Worklog)

## วิธีใช้ (สั้น ๆ)
- ทุกครั้งที่ตรวจหรือแก้จุดใด ให้เพิ่มรายการใน “รายการวันนี้” ก่อน แล้วค่อยทำงาน
- เมื่อทำเสร็จ ให้ย้ายไป “เสร็จแล้ว” และเขียนบันทึกสั้น ๆ ใน “บันทึกการเปลี่ยนแปลง”
- ถ้าพบปัญหา/ความเสี่ยง ให้เพิ่มใน “ความเสี่ยง/บัคที่ต้องตาม”

## สถานะรวม (ปัจจุบัน)
- สโคปหลัก: [ ] จบทั้งหมด
- โฟกัสตอนนี้: ใบสั่งขาย (ฟอร์มที่อยู่ + view/print + ลายเซ็น)
- Blocker: ไม่มี

## รายการวันนี้ (ทำก่อน-หลัง)
- [ ] ตรวจสอบการรัน migration บน Railway (log + ผลใน DB)

## เสร็จแล้ว (ย้ายจากรายการวันนี้)
- [x] อัปเดตฟอร์มใบสั่งขายให้ใช้ AddressAutocomplete + shipToSameAsCustomer
- [x] เพิ่มหน้า view/print ใบสั่งขาย + PDF + ลายเซ็นแอดมิน
- [x] เชื่อมปุ่มดู/พิมพ์จากหน้า list ใบสั่งขาย
- [x] ทำ migration อัตโนมัติบน Railway (assignedTo/ownerId → adminId)
- [x] เก็บกวาด localStorage/mock (DataContext/mockData/useSavedFilters/AdminSidebar)

## บันทึกการเปลี่ยนแปลง (สรุปสั้น ๆ)
### 2026-01-08 04:22
- ทำอะไร: เพิ่ม View/Print ใบสั่งขาย + PDF + ลายเซ็น และอัปเดตฟอร์มที่อยู่จัดส่ง
- ไฟล์: `src/components/SalesOrderForm.tsx`, `src/features/jubili/pages/SalesOrders.jsx`, `src/app/adminb2b/sales-orders/[id]/view/page.tsx`, `src/app/api/orders/[id]/pdf/route.ts`, `src/app/api/orders/route.ts`, `src/models/Order.ts`, `src/services/salesOrderGenerator.ts`, `src/utils/salesOrderPdf.ts`, `src/features/jubili/services/apiService.ts`
- ผลลัพธ์: ใบสั่งขายใช้ข้อมูลจริง, โหลดลายเซ็นแอดมินได้, ดาวน์โหลด PDF ได้

### 2026-01-08 04:35
- ทำอะไร: เพิ่ม migration อัตโนมัติสำหรับ adminId และล้าง localStorage/mock
- ไฟล์: `src/scripts/run-migrations.js`, `package.json`, `src/hooks/useSavedFilters.ts`
- ผลลัพธ์: รัน migration ก่อน start บน Railway และตัด localStorage/mock ที่ไม่ใช้แล้ว

### 2026-01-08 04:43
- ทำอะไร: เพิ่ม migration เสริม (customerCode, order linkage, salesOrderNumber)
- ไฟล์: `src/scripts/run-migrations.js`
- ผลลัพธ์: backfill customerCode และเติม owner/ที่อยู่/เลข SO จากใบเสนอราคาให้ใบสั่งขาย

## เช็กลิสต์ตามโมดูล
### ลูกค้า
- [ ] ฟอร์มใช้ข้อมูลจริง + ตรวจเลขภาษี
- [ ] รหัสลูกค้า CYYMMXXXX ใช้งานจริง
- [ ] assignedTo เป็น adminId

### โครงการ/โอกาส
- [ ] ที่อยู่ใช้ AddressAutocomplete
- [ ] เลือกลูกค้าจากข้อมูลจริง

### ใบเสนอราคา
- [ ] ฟอร์มใช้ข้อมูลจริง + ค้นหาสินค้าแบบ keyword
- [ ] ที่อยู่จัดส่งครบจังหวัด/อำเภอ/ตำบล/ไปรษณีย์
- [ ] PDF/หน้า View แสดงลายเซ็นแอดมินที่ถูกต้อง

### ใบสั่งขาย
- [ ] ฟอร์มใช้ข้อมูลจริง
- [ ] ที่อยู่จัดส่งครบ + shipToSameAsCustomer
- [ ] มี View/Print + ลายเซ็น

### รายงาน/WMS
- [ ] ใช้ API จริงทั้งหมด
- [ ] มี auth guard ใน API ใหม่

## รายการที่ต้องเพิ่ม/ลบใน UI
- เพิ่ม: (รายการ)
- ลบ/ซ่อน: (รายการ)

## ความเสี่ยง/บัคที่ต้องตาม
- (รายการความเสี่ยง)

## ตัดสินใจสำคัญ (Decision Log)
- วันที่: รายการตัดสินใจ/เหตุผล

## การย้ายข้อมูล (Migration)
- งานที่ต้อง migrate: (เช่น assignedTo เป็น adminId)
- สถานะ: (ยังไม่ทำ/ทำแล้ว/ต้องตรวจ)

## การทดสอบที่ต้องทำ
- [ ] ทดสอบ flow ลูกค้า → ใบเสนอราคา → ใบสั่งขาย → รายงาน
- [ ] ทดสอบสิทธิ์/การเข้าถึง API

## ไฟล์ที่แตะล่าสุด (อัปเดตสั้น ๆ)
- `path/to/file`
