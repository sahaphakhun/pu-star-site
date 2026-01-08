# วิเคราะห์และติดตามการปรับปรุง Modal/UI (Admin + ทั้งโปรเจ็กต์)

> วัตถุประสงค์: รวบรวมการตรวจสอบเชิงดีไซน์/พฤติกรรมของ modal และ UI ที่เกี่ยวข้องทั้งโปรเจ็กต์ พร้อมแนวทางปรับปรุงแบบเป็นขั้นตอน และอัปเดตทุกครั้งหลังทำงาน

## 0) สถานะล่าสุด (เริ่มต้น)
- วันที่/เวลา: กำลังเริ่มต้นการตรวจสอบ
- สcope: Modal ทั้งระบบ (Admin + ส่วนอื่น), overlay, header, spacing, z-index, พฤติกรรมการปิด, การเข้าถึง (accessibility)

---

## 1) รายการไฟล์ที่ตรวจสอบแล้ว + สิ่งที่พบ
> หมายเหตุ: จะเพิ่มรายการเรื่อย ๆ หลังตรวจเพิ่ม

### 1.1 ฐาน UI modal มาตรฐาน (Radix)
- ตรวจไฟล์: `src/components/ui/Modal.tsx`
  - พบ: ใช้ Radix Dialog + overlay สีดำ 80% + content แบบ centered
  - จุดสังเกต: ไม่มีการ offset sidebar โดยตรง (อ้างอิงเพียง `fixed inset-0`)
- ตรวจไฟล์: `src/components/ui/AlertDialog.tsx`
  - พบ: ใช้ Radix AlertDialog + overlay สีดำ 80% + content แบบ centered
  - จุดสังเกต: โทนสีปุ่มมาตรฐานเป็น blue/gray (ไม่ผูกกับธีม admin)

### 1.2 Modal แบบ custom (fixed inset-0)
- ตรวจไฟล์: `src/components/CustomerFormNew.tsx`
  - พบ: modal แบบ fixed overlay, header gradient, max-w-7xl, padding/spacing เฉพาะ
- ตรวจไฟล์: `src/components/QuotationForm.tsx`
  - พบ: modal แบบ fixed overlay, header gradient สีส้ม, max-w-6xl
- ตรวจไฟล์: `src/components/SalesOrderForm.tsx`
  - พบ: modal แบบ fixed overlay, header, footer sticky ภายในเอง
- ตรวจไฟล์: `src/components/CreditApprovalForm.tsx`
  - พบ: modal แบบ fixed overlay, header gradient สีเขียว, select แบบ native
- ตรวจไฟล์: `src/components/CustomerTagManager.tsx`
  - พบ: modal แบบ fixed overlay, header gradient สีม่วง/indigo
- ตรวจไฟล์: `src/components/sales-status/ProductProposalForm.tsx`
  - พบ: modal แบบ fixed overlay, header gradient สีฟ้า
- ตรวจไฟล์: `src/components/sales-status/SampleTestingForm.tsx`
  - พบ: modal แบบ fixed overlay, header gradient สีม่วง
- ตรวจไฟล์: `src/components/sales-status/PriceApprovalForm.tsx`
  - พบ: modal แบบ fixed overlay, header gradient สีเขียว
- ตรวจไฟล์: `src/components/QuickNoteModal.tsx`
  - พบ: modal แบบ fixed overlay, ใช้ Card เป็นกล่อง, form แบบ native
- ตรวจไฟล์: `src/components/AdminModal.tsx`
  - พบ: modal แบบ fixed overlay + framer-motion, มี `md:ml-56` offset

### 1.3 Modal ที่ฝังในหน้า (page-level modal)
- ตรวจไฟล์: `src/features/jubili/pages/Reports.jsx`
  - พบ: modal preview รายงาน แบบ fixed overlay และ layout เอง
- ตรวจไฟล์: `src/app/adminb2b/deals/page.tsx`
  - พบ: modal บันทึกมุมมอง (filter) แบบ fixed overlay + Card

### 1.4 ฟอร์ม modal ที่ใช้ Radix Modal
- ตรวจไฟล์: `src/components/OpportunityForm.tsx`
  - พบ: ใช้ `ModalContent` จาก Radix, max-w-4xl, overflow-y
- ตรวจไฟล์: `src/components/ProjectForm.tsx`
  - พบ: ใช้ `ModalContent` จาก Radix, max-w-4xl, overflow-y
- ตรวจไฟล์: `src/components/ActivityForm.tsx`
  - พบ: ใช้ `ModalContent` จาก Radix, max-w-2xl, overflow-y

---

## 2) วิเคราะห์ปัญหา/ความไม่สม่ำเสมอ (ผลกระทบ)
1) **มีหลายระบบ modal อยู่พร้อมกัน** (Radix + custom)  
   - ผลกระทบ: UI ไม่สม่ำเสมอ, พฤติกรรมการปิด/โฟกัสต่างกัน, accessibility ไม่เท่ากัน
2) **ความกว้าง/ความสูง/spacing ต่างกันมาก**  
   - ผลกระทบ: ภาพรวมไม่เป็นมาตรฐาน, การอ่านข้อมูลยาก
3) **สี/ธีม header ของ modal แตกต่างกันแบบไม่มีมาตรฐาน**  
   - ผลกระทบ: ผู้ใช้รู้สึกว่าเป็นคนละระบบ/คนละโมดูล
4) **การ offset กับ sidebar ไม่ตรงกัน**  
   - พบ `md:ml-56` ใน `AdminModal` แต่ sidebar ใหม่กว้าง 16rem
   - ผลกระทบ: modal อาจทับ sidebar หรือไม่กึ่งกลาง
5) **select/input ใช้ทั้ง component และ native**  
   - ผลกระทบ: focus ring/spacing/typography ไม่เท่ากัน
6) **z-index เท่ากันหลายตัว** (`z-50`)  
   - ผลกระทบ: modal ซ้อนทับ/ชนกับ sidebar หรือ popover ได้ง่าย
7) **การปิด modal ไม่สม่ำเสมอ**  
   - ผลกระทบ: ผู้ใช้เดาไม่ได้ว่าจะปิดอย่างไร

---

## 3) แนวทางปรับปรุงที่ควรทำ (ข้อเสนอแนะเชิงระบบ)
> จะเริ่มทำเมื่อได้รับอนุมัติจากผู้ใช้

### 3.1 ทำ “มาตรฐาน Modal” กลาง
- สร้าง/ปรับ `Modal` (Radix) ให้รองรับ:
  - Header/Footer แบบมาตรฐาน
  - ขนาด 2–3 ระดับ (เช่น `sm`, `md`, `lg`, `xl`)
  - overlay และ z-index ที่เท่ากันทุกที่
  - รองรับ offset กับ sidebar (`--admin-sidebar-width`)

### 3.2 รีแฟคเตอร์ modal custom ให้ใช้ฐานเดียวกัน
- เปลี่ยน modal ที่เป็น `fixed inset-0` ให้ใช้ `Modal` กลาง
- ถ้าจำเป็นคงดีไซน์เฉพาะ ให้ส่ง className เพิ่มแทน

### 3.3 ปรับธีม/โทนสี
- ใช้โทนกลางเดียวกับ admin shell (slate/sky/teal)
- ทำระบบสีของ header ให้ดูเป็นมิตร แต่สม่ำเสมอ

### 3.4 ทำมาตรฐาน input/select
- บังคับใช้ `Input`, `Textarea`, `Select` component ให้ครบใน modal
- ลด native input ที่มีคลาสเอง

---

## 4) แผนดำเนินการ (draft)
1) สร้างมาตรฐาน `AdminModalShell` หรือ `Modal` ที่มี header/footer และ sizing
2) รีแฟคเตอร์ modal ที่สำคัญก่อน (Customer/Quotation/Orders)
3) ไล่ปรับ modal ใน sales-status และ report preview
4) ปรับ spacing และ z-index ให้ตรงกันทุก modal

---

## 5) บันทึกการอัปเดต (จะเติมหลังทำงาน)
### 5.1 เริ่มต้นงานปรับปรุง
- แนวทางที่ได้รับ: ผู้ใช้ต้องการ “สร้างโค้ดใหม่” และลบโค้ดเก่าเสมอ, หลีกเลี่ยงการอ้างอิงโค้ดเดิม (เน้นให้ทำงานได้เหมือนเดิม)
- แผนดำเนินการ: สร้างชุด modal ใหม่แบบมาตรฐาน แล้วทยอยแทนที่ modal แบบเดิมทีละชุด พร้อมลบโค้ดเดิมออก

### 5.2 สร้างชุด modal ใหม่ (ฐานมาตรฐาน)
- สร้างไฟล์ใหม่: `src/components/ui/AppModal.tsx`
- เนื้อหา: Modal ใหม่บน Radix Dialog (โครงใหม่ทั้งหมด), มี header/body/footer มาตรฐาน, ขนาดหลายระดับ, overlay blur, z-index สูงกว่า sidebar และรองรับการจัดกึ่งกลางในพื้นที่ content ผ่าน `align="content"`
- เหตุผล: ลดความเสี่ยงจากโค้ดเดิม, ทำให้ทุก modal ใช้หน้าตา/พฤติกรรมเดียวกัน

### 5.3 แทนที่ AdminModal เดิม
- ตรวจไฟล์: `src/app/adminb2b/quotations/page.tsx`
  - ปรับใช้ `AppModal` แทน `AdminModal` สำหรับฟอร์มใบเสนอราคาและ prompt modal
  - ปรับโครง header/body/footer ของ prompt ให้ใช้มาตรฐานใหม่
- ตรวจไฟล์: `src/app/adminb2b/products/page.tsx`
  - ปรับใช้ `AppModal` แทน `AdminModal` สำหรับฟอร์มสินค้า
- ลบไฟล์เดิม: `src/components/AdminModal.tsx`
- ผลกระทบ: Modal ในหน้าจัดการใบเสนอราคา/สินค้าใช้มาตรฐานใหม่ (รองรับ sidebar offset และ z-index ใหม่)

### 5.4 แทนที่ modal หลัก (Customer/Quotation/SalesOrder)
- ตรวจไฟล์: `src/components/CustomerFormNew.tsx`
  - ปรับใช้ `AppModal` + header/body/footer มาตรฐาน
  - ลบ overlay แบบ `fixed inset-0` เดิมออก
- ตรวจไฟล์: `src/components/QuotationForm.tsx`
  - ปรับโครง modal เป็น `AppModal` (ทั้ง embedded และไม่ embedded)
  - ลบ header gradient และ overlay เดิม
- ตรวจไฟล์: `src/components/SalesOrderForm.tsx`
  - ปรับโครง modal เป็น `AppModal` และจัด header/body/footer ใหม่
  - ลบ overlay เดิม และลบปุ่มปิดบน header เดิม (ใช้ close button มาตรฐาน)
- ผลกระทบ: ฟอร์มหลักใช้โครง modal เดียวกัน ลดความต่างของ UX และลดความเสี่ยงเรื่อง z-index/overlay

### 5.5 รีแฟคเตอร์ modal ใน sales-status และเครื่องมือย่อย
- ตรวจไฟล์: `src/components/QuickNoteModal.tsx`
  - เปลี่ยนเป็น `AppModal` แบบมาตรฐาน, ลดการใช้ Card/overlay เดิม
- ตรวจไฟล์: `src/components/CustomerTagManager.tsx`
  - เปลี่ยนเป็น `AppModal`, ใช้ header/body/footer กลาง
- ตรวจไฟล์: `src/components/CreditApprovalForm.tsx`
  - เปลี่ยนเป็น `AppModal`, ลบ footer เดิมที่ซ้ำซ้อน
- ตรวจไฟล์: `src/components/sales-status/ProductProposalForm.tsx`
  - เปลี่ยนเป็น `AppModal`, ลบ header gradient และ footer เดิม
- ตรวจไฟล์: `src/components/sales-status/SampleTestingForm.tsx`
  - เปลี่ยนเป็น `AppModal`, ลบ footer เดิมที่ซ้ำซ้อน
- ตรวจไฟล์: `src/components/sales-status/PriceApprovalForm.tsx`
  - เปลี่ยนเป็น `AppModal`, ลบ footer เดิมที่ซ้ำซ้อน
- ตรวจไฟล์: `src/components/sales-status/QuotationForm.tsx`
  - เปลี่ยนเป็น `AppModal`, ลบ footer เดิมที่ซ้ำซ้อน
- ตรวจไฟล์: `src/features/jubili/pages/Reports.jsx`
  - เปลี่ยน preview modal เป็น `AppModal`
- ตรวจไฟล์: `src/app/adminb2b/deals/page.tsx`
  - เปลี่ยน save filter modal เป็น `AppModal`
- ลบไฟล์เดิม: `src/components/ui/Modal.tsx` (ไม่มีการใช้งานแล้ว)
- ผลกระทบ: modal ในกลุ่มขาย/เครื่องมือย่อยใช้มาตรฐานเดียวกัน ลดความแตกต่างของสีและรูปแบบ

### 5.6 รีแฟคเตอร์ modal ฝั่ง shop
- ตรวจไฟล์: `src/app/shop/components/OrderForm.tsx`
  - เปลี่ยนเป็น `AppModal` และใช้ layout ใหม่ (header/body/footer)
  - ลดการพึ่ง framer-motion และย้ายปุ่มไปอยู่ footer มาตรฐาน
- ตรวจไฟล์: `src/app/shop/components/CartDrawer.tsx`
  - สร้างใหม่ทั้งไฟล์ด้วย `AppModal`
  - รักษาการทำงานเดิม (ตะกร้า, ปรับจำนวน, ลบ, รวมยอด, ไปสั่งซื้อ)
- ผลกระทบ: modal ฝั่ง shop ใช้มาตรฐานเดียวกับระบบหลัก ลด overlay แบบเก่า

### 5.7 เก็บงานความสอดคล้องและล้างโค้ดเก่า
- ตรวจไฟล์: `src/app/globals.css`
  - ลบสไตล์ `adminb2b-modal` และ `adminb2b-modal-overlay` ที่ไม่ถูกใช้งานแล้ว
- ตรวจสอบ overlay ที่เหลือ: พบเฉพาะ backdrop ของ `MobileSidebar` (ยังคงไว้)
- ผลกระทบ: ลดโค้ดเก่า, ลดความสับสนของ style ที่ไม่ถูกใช้งาน

### 5.8 แก้ไข syntax error หลัง build (โครง JSX)
- ตรวจไฟล์: `src/components/CreditApprovalForm.tsx`
  - ลบ `</div>` ที่เกินออกก่อน `</AppModalBody>` (ทำให้ JSX สมบูรณ์)
- ตรวจไฟล์: `src/components/QuotationForm.tsx`
  - ลบ `</div>` ที่เกินก่อนส่วนรายการสินค้า และจัดโครงปิดแท็กให้ครบ
- ตรวจไฟล์: `src/components/SalesOrderForm.tsx`
  - ลบ `</div>` ที่เกินก่อนส่วนรายการสินค้า และจัดโครงปิดแท็กให้ครบ
- ผลกระทบ: แก้ compile error “Expected '</', got 'jsx text'” ให้ JSX ถูกต้อง

### 5.9 ผลการ build
- รันทดสอบ: `npm run build -- --no-lint`
- ผลลัพธ์: Build ผ่านสำเร็จ
- หมายเหตุ: มีข้อความเตือนเรื่อง Cloudinary env ไม่ครบ (`[B2B] Cloudinary env not fully set. Upload API will be disabled.`) ซึ่งเป็น warning เดิมของระบบ ไม่ใช่ error จากการแก้ modal
