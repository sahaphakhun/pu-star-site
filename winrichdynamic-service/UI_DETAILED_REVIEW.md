# บันทึกการตรวจ UI แบบละเอียด

## ภาพรวมแพลตฟอร์ม (เข้าใจระบบก่อนให้คำแนะนำ)
- Winrich Dynamic Service เป็นระบบ B2B บน Next.js ที่รันแยกเป็น subdomain (บน Railway)
- โดเมนหลักของระบบคือ CRM/ERP สำหรับการขาย B2B: ลูกค้า, ใบเสนอราคา, ใบสั่งขาย, ออเดอร์, โปรเจกต์, ดีล/โอกาส, งานติดตาม, อนุมัติ
- มีโมดูลรายงาน, แดชบอร์ด และระบบสิทธิ์ผู้ดูแล (admin/roles)
- มีโมดูล WMS สำหรับคลังสินค้า (inventory/inbound/outbound/reports)
- มีหน้าร้าน/สั่งซื้อ (shop) และหน้าลูกค้า (my-orders)
- ระบบเสริม: แจ้งเตือน LINE/SMS/Email, ระบบชำระเงิน, และการสร้าง PDF ใบเสนอราคา

## หลักการตรวจและการจดบันทึก
- ตรวจทีละจุดของ UI และอัปเดตเอกสารทันทีหลังตรวจจุดนั้นเสร็จ
- สำหรับแต่ละจุด จะระบุ: จุดที่ควรเพิ่ม/ลบ/ปรับ, ความเสี่ยงด้านการใช้งานจริง, และข้อเสนอแนะสั้นๆ

## บันทึกการตรวจ UI (เรียงตามการตรวจจริง)

### 1) Root layout + Globals (`src/app/layout.tsx`, `src/app/globals.css`)
- จุดที่ควรเพิ่ม/ปรับ: พิจารณาใช้ฟอนต์ไทยหลัก (เช่น Sarabun/Noto Sans Thai) สำหรับ UI ภาษาไทยทั้งหมด เพื่อความอ่านง่ายและคงรูปแบบเดียวกับเอกสาร PDF
- จุดที่ควรลบ/รวม: มี `Toaster` ซ้ำทั้งใน `src/app/layout.tsx` และ `src/app/adminb2b/layout.tsx` → ควรรวมไว้ที่ root แห่งเดียวเพื่อไม่ซ้อน toast
- ความเสี่ยงการใช้งานจริง: class `adminb2b-modal` ถูกกำหนด global อาจกระทบ modal นอก admin หากใช้ชื่อ class ซ้ำ ควรแยกชื่อเฉพาะ
- หมายเหตุ: `html` ฟอนต์ `Inter` และ `font-size: 14px` ตั้งเป็น default อาจเล็กสำหรับหน้าที่เป็นตาราง/รายงาน ควรทดสอบกับข้อมูลจริง

### 2) Main layout + Header/Sidebar (`src/components/layout/*`, `src/app/adminb2b/layout.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: Header แสดงชื่อผู้ใช้และบทบาทแบบ hardcode ควรผูกกับข้อมูลจริงจาก `/api/adminb2b/profile` และรองรับ avatar/ชื่อย่อจริง
- จุดที่ควรเพิ่ม/ปรับ: ไอคอนแจ้งเตือน/ข้อความ/ปฏิทินไม่มี action → ควรเชื่อมไปหน้ารายการหรือเปิด panel ให้ใช้งานได้จริง
- จุดที่ควรลบ/พิจารณา: Language selector และปุ่ม WINR ยังไม่ทำงานจริง หากไม่มีระบบภาษา/การเงินนี้ ให้ซ่อนไว้หรือใส่ tooltip ว่า “ยังไม่เปิดใช้”
- จุดที่ควรเพิ่ม/ปรับ: เมนู Sidebar ไม่ครอบคลุมหน้าที่มีจริง (เช่น approvals, admins, categories, orders, settings เฉพาะ) ควรทบทวนเมนูให้ตรงกับหน้าที่มีใช้งานจริง
- ความเสี่ยง: รายการเมนูถูกประกาศซ้ำใน Sidebar/MobileSidebar อาจคลาดกันในอนาคต ควรแยกเป็นแหล่งข้อมูลเดียวเพื่อกัน UI ไม่ตรงกัน

### 3) หน้า Home (`src/app/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ลิงก์ `/contact` ยังไม่มีหน้ารองรับ (ถ้าไม่มีจริงควรลบหรือสร้างหน้า)
- จุดที่ควรปรับ: ข้อความ “หน้านี้จะเป็น B2B shop ในอนาคต” เหมาะกับ staging มากกว่า production → ควรเปลี่ยนเป็นคำอธิบายบริการหรือ redirect ไป `/adminb2b`/`/shop`
- ความเสี่ยง: เป็นหน้าเรียบมาก ไม่มีการยืนยันตัวตนหรือการนำทางไปโมดูลหลักที่ชัดเจน อาจทำให้ผู้ใช้หลงทาง

### 4) หน้าล็อกอิน/สมัครสมาชิก (Admin + Customer) (`src/app/login/*`, `src/app/adminb2b/login`, `src/app/adminb2b/register`)
- จุดที่ควรเพิ่ม/ปรับ: แยกบทบาทผู้ใช้อย่างชัดเจนใน UI (ลูกค้า vs admin) เพื่อไม่ให้สับสนว่าควรใช้หน้าไหน
- จุดที่ควรเพิ่ม/ปรับ: หน้า Admin Register เปิดให้เลือก role ได้เอง อาจไม่สอดคล้องกับระบบสิทธิ์จริง → ควรให้ระบบกำหนด role หลังอนุมัติ หรือซ่อนตัวเลือก role ในหน้าสมัคร
- จุดที่ควรเพิ่ม/ปรับ: เพิ่มลิงก์ “ลืมเบอร์/ติดต่อผู้ดูแล” หรือช่องทางช่วยเหลือ เมื่อ OTP ไม่มา
- จุดที่ควรเพิ่ม/ปรับ: เพิ่มตัวบ่งชี้สถานะการนับถอยหลัง OTP ให้ชัดเจนขึ้น (บางหน้ามี/บางหน้าไม่มีรูปแบบเดียวกัน)
- ความเสี่ยง: ไม่มีการบังคับรูปแบบเบอร์โทร/ประเทศที่สอดคล้องกันทุกหน้า อาจทำให้ OTP ส่งไม่สำเร็จเมื่อข้อมูลไม่ normalize

### 5) หน้า `/adminb2b` (Redirect to dashboard) (`src/app/adminb2b/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `useRouter().push()` แทน `location.href` เพื่อให้การเปลี่ยนหน้าไม่รีโหลดทั้งหน้าและรักษา state ได้ดีขึ้น
- จุดที่ควรลบ/ปรับ: มีช่องว่าง/บรรทัดว่างจำนวนมากในไฟล์ ควรจัดรูปแบบให้กระชับเพื่ออ่านง่าย
- ความเสี่ยง: หาก token หมดอายุ/ไม่มีสิทธิ์ ควร redirect ไปหน้า login แทนที่จะไป dashboard ตรงๆ

### 6) แดชบอร์ด B2B (`src/app/adminb2b/dashboard/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ตัวกรองทีม/ผู้รับผิดชอบ/ช่วงเวลาเป็น UI เปล่า ยังไม่เชื่อม query ไป API → ควรผูกกับพารามิเตอร์และรีเฟรชข้อมูลจริง
- จุดที่ควรเพิ่ม/ปรับ: ส่วน “รูปภาพกิจกรรมล่าสุด” ยังเป็น placeholder ควรดึงรูปจากกิจกรรมจริงหรือซ่อนทั้งบล็อกเมื่อไม่มีข้อมูล
- จุดที่ควรเพิ่ม/ปรับ: ควรมี empty state สำหรับกราฟที่ไม่มีข้อมูล (เช่น paymentMethodData ว่าง) เพื่อไม่ให้แสดงกราฟเปล่า
- จุดที่ควรลบ/พิจารณา: KPI/กราฟบางส่วนมีการซ้ำข้อมูล (เช่น quotation totals แสดงหลายจุด) หากทำให้ผู้ใช้สับสน ควรลดซ้ำหรือจัดกลุ่มใหม่
- ความเสี่ยง: ไม่มีการตรวจ token/สิทธิ์ใน UI ก่อนโหลด อาจเห็น error เฉพาะเมื่อ API ปฏิเสธ ควรมี UX สำหรับหมดอายุ login

### 7) ลูกค้า (Customers) (`src/app/adminb2b/customers/page.tsx`, `src/features/jubili/pages/Customers.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่มสลับแท็บ “รายการลูกค้า/สายลูกค้า” ยังไม่เปลี่ยนเนื้อหา (ไม่มี conditional render) → ควรแยก UI list vs pipeline ให้ตรงกับแท็บ
- จุดที่ควรเพิ่ม/ปรับ: ปุ่มสถานะ (นำเสนอสินค้า/เสนอราคา/ทดสอบ/อนุมัติราคา) ถูกเตรียม state ไว้ แต่ไม่มีการ render ฟอร์มที่เกี่ยวข้อง → UI กดแล้วไม่เห็นอะไร
- จุดที่ควรเพิ่ม/ปรับ: ลิงก์สรุป “ลูกค้าที่ติดต่อกับเรา...” ใช้ `href="#"` ไม่มี action → ควรเชื่อม filter จริงหรือซ่อน
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม filter ทีม/ผู้รับผิดชอบ/คำลูกค้า เป็น UI เปล่า ควรผูกกับ query หรือเอาออก
- ความเสี่ยง: ไม่มี pagination/virtualization เมื่อข้อมูลลูกค้าจำนวนมาก ตารางจะช้าและ UX ติดขัด

### 8) รายละเอียดลูกค้า (`src/app/adminb2b/customers/[id]/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: เป็น client component แต่ประกาศ `async` และรับ `params` เป็น `Promise` → ควรใช้ `params: { id: string }` ปกติ เพื่อหลีกเลี่ยง hydration/typing issue
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี loading/error state เมื่อโหลดข้อมูลลูกค้า/กิจกรรม/โน้ต ควรเพิ่มสถานะเพื่อ UX ที่ดีขึ้น
- จุดที่ควรเพิ่ม/ปรับ: API call ไม่ส่ง `credentials` และไม่จัดการกรณี 401/404
- จุดที่ควรเพิ่ม/ปรับ: ข้อมูลแสดงน้อยมาก (ไม่มีที่อยู่, ผู้รับผิดชอบ, เงื่อนไขชำระเงิน, tag) หากใช้จริงควรแสดงข้อมูลหลักให้ครบ

### 9) สินค้า (Products) (`src/app/adminb2b/products/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “แก้ไข” เรียก `setEditingProduct` แต่ไม่เปิด modal → UI แก้ไขใช้งานไม่ได้จริง
- จุดที่ควรเพิ่ม/ปรับ: แสดงหมวดหมู่ในตารางเป็น ID (`product.category`) ควร map เป็นชื่อหมวดหมู่เพื่อให้ผู้ใช้เข้าใจง่าย
- จุดที่ควรเพิ่ม/ปรับ: ช่องสต็อกแสดงจำนวนหน่วยสินค้า (units length) แทนจำนวนคงเหลือจริง ควรผูกกับข้อมูล inventory จริง
- จุดที่ควรลบ/ปรับ: ปุ่ม “ออกจากระบบ” อยู่เฉพาะหน้าสินค้า ควรย้ายไปพื้นที่ global header เพื่อความสม่ำเสมอ
- ความเสี่ยง: useTokenManager ใช้ header Bearer แต่หลายหน้าอื่นใช้ cookie → UX อาจไม่สอดคล้องหาก token ขาดหรือหมดอายุ

### 10) โครงการ (Projects) (`src/app/adminb2b/projects/page.tsx`, `src/features/jubili/pages/Projects.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: ใช้ข้อมูล placeholder หลายจุด (ประเภทโครงการ, ป้าย Project Sales, owner default, activityCount default) → หากไม่มีข้อมูลจริงควรซ่อนหรือแสดง “ไม่ระบุ”
- จุดที่ควรเพิ่ม/ปรับ: ไอคอนในตารางสุ่มทุก render (`getRandomIcon`) ทำให้ UI เปลี่ยนตลอด → ควรใช้ค่า deterministic (เช่น hash จาก projectCode)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “ค้นหาเพิ่มเติม” ไม่มีฟังก์ชันเพิ่มจากการค้นหาปกติ อาจทำให้ผู้ใช้สับสน ควรเชื่อมกับ advanced filters หรือเอาออก
- จุดที่ควรเพิ่ม/ปรับ: ควรมีลิงก์ไปหน้ารายละเอียดลูกค้า/โครงการเมื่อคลิกแถวหรือชื่อ เพื่อใช้งานจริงได้เร็วขึ้น
- ความเสี่ยง: ค่า statusFilter เริ่มต้นเป็น “กำหนด” และส่งต่อไป API อาจไม่ตรงกับค่า enum ถ้า map ไม่ครอบคลุม → ต้องตรวจสอบกับ backend จริง

### 11) ใบเสนอราคา (รายการ) (`src/app/adminb2b/quotations/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: การดึงโปรไฟล์แอดมินใน `handleSendViaLine` ยังใช้ `localStorage` (token) ทั้งที่ระบบใหม่ใช้ cookie → ควรย้ายไปใช้ `credentials: include` เพื่อไม่ขัดกับแนวทางใหม่
- จุดที่ควรเพิ่ม/ปรับ: `fetchCustomers`/`fetchQuotations` ไม่มี `credentials` อาจทำให้โหลดข้อมูลไม่ได้หาก backend บังคับ auth cookie
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “ออกใบสั่งขาย (PDF)”/“ส่งผ่าน LINE” ไม่มีสถานะ loading ต่อรายการชัดเจน (มีเฉพาะ sendingId) ควรปิดปุ่มอื่นระหว่างดำเนินการเพื่อกันกดซ้ำ
- จุดที่ควรเพิ่ม/ปรับ: ค่า `assignedTo` แสดงด้วย adminMap แต่หาก `assignedTo` เป็นชื่อแทน id จะซ้ำซ้อน ควรยืนยันว่าเก็บเป็น adminId เท่านั้น
- ความเสี่ยง: ไม่มี pagination เมื่อใบเสนอราคาเยอะ ตารางจะหนักและ UX ช้า

### 12) ใบเสนอราคา (ฟอร์ม/Modal) (`src/components/QuotationForm.tsx`)
- แก้ไขแล้ว: เพิ่มโหมด `embedded` ให้ QuotationForm เพื่อหลีกเลี่ยง overlay ซ้อนกับ `AdminModal` และปุ่มปิด (X) ทำงานได้ปกติ
- แก้ไขแล้ว: ช่องเลือกโครงการ/โอกาสดึงข้อมูลจริงจาก `/api/projects` และ `/api/deals`
- แก้ไขแล้ว: ที่อยู่จัดส่งใช้ `AddressAutocomplete` ครบจังหวัด/อำเภอ/ตำบล/ไปรษณีย์ และผูกค่ากับลูกค้าเมื่อเลือก “ที่อยู่เดียวกับลูกค้า”
- ความเสี่ยง: ทีมที่รับผิดชอบยังเป็นค่า hardcode ควรดึงจากระบบทีมจริงเพื่อไม่ซ้ำซ้อนกับระบบอื่น

### 13) ใบเสนอราคา (หน้า View/Print) (`src/app/adminb2b/quotations/[id]/view/page.tsx`)
- แก้ไขแล้ว: ข้อมูลบริษัทดึงจาก `/api/settings` (fallback เป็นค่าเดิมเมื่อยังไม่มีข้อมูล)
- แก้ไขแล้ว: พื้นที่ลายเซ็นผูกกับ `/api/users/signature` และแสดงชื่อ/ตำแหน่งของผู้รับผิดชอบ
- แก้ไขแล้ว: เพิ่ม `credentials` ใน `fetch` สำหรับโหลดข้อมูลและดาวน์โหลด PDF
- แก้ไขแล้ว: แสดงชื่อผู้รับผิดชอบจากข้อมูลลายเซ็น หากไม่มีจึง fallback เป็น `assignedTo`

### 14) ใบสั่งขาย (รายการ) (`src/app/adminb2b/sales-orders/page.tsx`, `src/features/jubili/pages/SalesOrders.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม filter ทีม/ค้นหาเพิ่มเติมยังเป็น UI เปล่า → ควรเชื่อมกับ query จริงหรือซ่อน
- จุดที่ควรเพิ่ม/ปรับ: ไอคอนสุ่ม (`getRandomIcon`) เปลี่ยนทุก render → ควรทำให้คงที่ตาม order เพื่อไม่ก่อความสับสน
- จุดที่ควรเพิ่ม/ปรับ: `projectName` แสดง “-” ตลอด เพราะยังไม่ได้ผูกกับโครงการ → ควรดึงจากข้อมูลใบเสนอราคา/โครงการถ้ามี
- จุดที่ควรเพิ่ม/ปรับ: ผู้รับผิดชอบแสดงจาก `ownerId` ดิบ หากไม่มีชื่อ → ควร map กับ admin name
- แก้ไขแล้ว: เพิ่มปุ่มดู/พิมพ์ใบสั่งขาย พร้อมดาวน์โหลด PDF

### 15) ใบสั่งขาย (ฟอร์ม) (`src/components/SalesOrderForm.tsx`)
- แก้ไขแล้ว: ที่อยู่จัดส่งใช้ `AddressAutocomplete` ครบจังหวัด/อำเภอ/ตำบล/ไปรษณีย์
- แก้ไขแล้ว: เพิ่มตัวเลือก “ที่อยู่เดียวกับลูกค้า” และ auto-fill จากลูกค้า
- จุดที่ควรเพิ่ม/ปรับ: รายการ quotation/customer ควรถูกกรองให้สัมพันธ์กัน (เลือก quotation แล้ว auto-fill customer/ที่อยู่)
- ความเสี่ยง: ทีมที่รับผิดชอบเป็นค่า hardcode เช่นเดียวกับ QuotationForm อาจซ้ำซ้อนกับระบบทีมจริง

### 16) ออเดอร์ (รายการ) (`src/app/adminb2b/orders/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: การเปลี่ยนสถานะใช้ `localStorage` token และ `alert` → ควรปรับเป็น `credentials: include` และใช้ toast/modal ให้สม่ำเสมอ
- จุดที่ควรเพิ่ม/ปรับ: `fetch('/api/orders')` ไม่มี auth/credentials อาจโหลดไม่สำเร็จเมื่อ backend ปรับสิทธิ์
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “ดูรายละเอียด” ใช้ `location.href` (reload) ควรใช้ router เพื่อ UX ลื่นไหล
- จุดที่ควรเพิ่ม/ปรับ: ยังไม่รองรับช่องทางชำระเงิน “credit” ใน UI list (ระบบมี credit ใน backend)

### 17) ออเดอร์ (รายละเอียด) (`src/app/adminb2b/orders/[id]/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `params` แบบ Promise ใน client component → ควรใช้ `useParams()` หรือรับ `params` ธรรมดา
- จุดที่ควรเพิ่ม/ปรับ: ลิงก์ดูใบเสนอราคาใช้ `/adminb2b/quotations/${id}` แต่หน้าจริงคือ `/adminb2b/quotations/${id}/view` → ลิงก์ผิด
- จุดที่ควรเพิ่ม/ปรับ: สร้างใบเสนอราคาใช้ `alert` และไม่มี loading state ที่ชัดเจนในส่วนรายการ → ควรใช้ toast + disable ปุ่ม
- จุดที่ควรเพิ่ม/ปรับ: `fetch` ไม่มี `credentials` และไม่รองรับ 401/403

### 18) Leads (`src/app/adminb2b/leads/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี loading/error state ขณะโหลด/แปลง lead → ควรเพิ่มสถานะให้ผู้ใช้รับรู้
- จุดที่ควรเพิ่ม/ปรับ: `fetch` ไม่มี `credentials` และไม่มีการจัดการ 401
- จุดที่ควรเพิ่ม/ปรับ: ข้อมูลสถานะ/ที่มายังแสดงเป็นภาษาอังกฤษ (`qualified`, `converted`) ควรแสดง label ภาษาไทยให้สม่ำเสมอ
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “แปลงเป็นดีล” ไม่มี confirmation/ผลลัพธ์ชัดเจน (เช่น toast)
- ความเสี่ยง: การอัปโหลด CSV ไม่มี feedback สำเร็จ/ล้มเหลว และ input ไม่ถูก style เหมือนส่วนอื่น

### 19) ดีล (Deals) (`src/app/adminb2b/deals/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ไม่มีปุ่มสร้างดีลในหน้า → หาก workflow จริงต้องมี action สำหรับสร้าง/นำเข้า
- จุดที่ควรเพิ่ม/ปรับ: ตัวกรองทีม/owner เป็น input เปล่า ควรเป็น dropdown ที่อิงรายชื่อทีม/แอดมินจริง
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี error state/empty state ที่ชัดเจนเมื่อโหลดล้มเหลว → ตอนนี้เงียบและ setDeals([])
- จุดที่ควรเพิ่ม/ปรับ: Saved Filters ใช้ localStorage (`useSavedFilters`) ไม่ซิงก์กับผู้ใช้/อุปกรณ์อื่น → หากต้องการใช้งานจริงควรเก็บบน backend
- ความเสี่ยง: `fetch` ไม่มี `credentials` อาจถูกปฏิเสธเมื่อเปิดใช้งาน auth cookie

### 20) ดีล (รายละเอียด) (`src/app/adminb2b/deals/[id]/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: client component ใช้ `async`/`params` แบบ Promise → ควรใช้ `useParams()` หรือรับ params ปกติ
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี loading/error state และไม่ส่ง `credentials`
- จุดที่ควรเพิ่ม/ปรับ: ควรมีปุ่มแก้ไข/เปลี่ยนสเตจ/ดูใบเสนอราคาที่เกี่ยวข้องเพื่อใช้งานจริง

### 21) โอกาส (Opportunities) (`src/app/adminb2b/opportunities/page.tsx`, `src/features/jubili/pages/Opportunities.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: Tab “ใหม่/ติดต่อแล้ว” ส่ง `status` เป็นค่าใน UI แต่ API รองรับ `open/won/lost` → ฟิลเตอร์อาจไม่ทำงานจริง ควร map ให้ตรง backend
- จุดที่ควรเพิ่ม/ปรับ: contact/phone แสดงเป็น “-” เพราะไม่มีข้อมูลจาก API → ถ้าจำเป็นต้องเก็บใน Deal model หรือดึงจากลูกค้า
- จุดที่ควรเพิ่ม/ปรับ: filter customerId/ownerId/team เป็น input เปล่า ควรเป็น dropdown จากข้อมูลจริง
- ความเสี่ยง: `fetch` ไม่มี `credentials` → อาจถูกปฏิเสธเมื่อเปิด auth

### 22) งานติดตาม (Activities) (`src/app/adminb2b/tasks/page.tsx`, `src/features/jubili/pages/Activities.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: filter เจ้าของเป็น input เปล่า ไม่มี dropdown จากรายชื่อจริง → ควรเชื่อมกับ admin list
- จุดที่ควรเพิ่ม/ปรับ: มีฟิลด์ `customerId` ใน state แต่ไม่มีช่องกรองใน UI → ควรเพิ่มหรือเอาออกเพื่อไม่สับสน
- จุดที่ควรเพิ่ม/ปรับ: การโหลดสถิติ/กิจกรรมควรมี empty state แยกจาก error เพื่อบอกว่า “ไม่มีงาน”
- ความเสี่ยง: หาก API require auth cookie และ `useApiService` ยังไม่ส่ง จะโหลดไม่สำเร็จ (ต้องยืนยันใน service)

### 23) คาดการณ์ (Forecast) (`src/app/adminb2b/forecast/page.tsx`, `src/features/jubili/pages/Forecast.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: หาก API ส่งข้อมูลว่าง (forecastData ไม่มี monthlyData) ควรมี empty state แทนกราฟเปล่า
- จุดที่ควรเพิ่ม/ปรับ: ควรแสดง “อัปเดตล่าสุด” เพื่อให้ผู้ใช้เชื่อถือข้อมูลคาดการณ์
- ความเสี่ยง: หาก forecast API ยังไม่พร้อม หน้าอาจค้างที่ error เสมอ ควรมีข้อความอธิบายและวิธีติดต่อผู้ดูแล

### 24) รายงาน (Reports) (`src/app/adminb2b/reports/page.tsx`, `src/features/jubili/pages/Reports.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: ตัวเลือก “Excel/PDF” ยังดาวน์โหลดเป็น JSON (mock) → ควร implement จริงหรือซ่อนตัวเลือกที่ยังไม่รองรับ
- จุดที่ควรเพิ่ม/ปรับ: รายงานที่สร้างแล้วเก็บใน state เท่านั้น (หายเมื่อรีเฟรช) → หากต้องใช้งานจริงควรเก็บบน backend หรืออย่างน้อย cache ฝั่ง server
- จุดที่ควรเพิ่ม/ปรับ: ฟิลเตอร์ ownerId/stageId เป็น input เปล่า ควรเป็น dropdown จากข้อมูลจริง
- จุดที่ควรเพิ่ม/ปรับ: แท็บ “คลังข้อมูล” ยังเป็น placeholder → ถ้าไม่มี roadmap ใกล้ ๆ ควรซ่อน
- ความเสี่ยง: `fetchWithAuth` ใช้ token (อาจ localStorage) ไม่สอดคล้องกับแนวทาง cookie-based ใหม่

### 25) ตั้งค่า (Settings) (`src/app/adminb2b/settings/page.tsx`, `src/features/jubili/pages/Settings.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: เมนูหลายรายการแสดง Coming Soon → หากไม่มีแผนชัดเจนควรซ่อนเมนูเพื่อไม่ให้ผู้ใช้คาดหวัง
- จุดที่ควรเพิ่ม/ปรับ: Toggle feature (GeoFence/AutoSuggest/CheckIn) เป็น UI แสดงผลอย่างเดียว ไม่สามารถแก้ไขได้จริง
- จุดที่ควรเพิ่ม/ปรับ: ข้อมูลบริษัทในส่วน view ควรใช้ข้อมูลจาก `settings` จริง 100% และรองรับอัปโหลดโลโก้/ที่อยู่แบบมีโครงสร้าง
- ความเสี่ยง: หาก `getSettings` ล้มเหลว หน้าจะค้าง error state ไม่มี fallback ชัดเจนสำหรับผู้ใช้ทั่วไป

### 26) อนุมัติ (Approvals) (`src/app/adminb2b/approvals/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `window.prompt` สำหรับเหตุผล → ควรใช้ modal ที่มี validation และ UX สม่ำเสมอ
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี loading/error state ที่ชัดเจนระหว่างดึงข้อมูล/กดอนุมัติ
- จุดที่ควรเพิ่ม/ปรับ: `fetch` ไม่มี `credentials` และไม่มีการจัดการกรณี 401/403
- จุดที่ควรเพิ่ม/ปรับ: แสดง targetId ดิบ ควรลิงก์ไปดูดีล/รายการที่ขออนุมัติ

### 27) สิทธิ์/ผู้ดูแล (Permissions) (`src/app/adminb2b/permissions/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: การสร้างบทบาท/แอดมินใช้ `prompt` → ควรแทนด้วย modal ฟอร์มแบบเต็มเพื่อ validate และ UX
- จุดที่ควรเพิ่ม/ปรับ: ไม่มีการแก้ไขชื่อ/คำอธิบายบทบาทใน UI (มีแค่ toggle สิทธิ์) → ควรเพิ่มฟังก์ชันแก้ไข
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี `credentials` ใน fetch อาจใช้ไม่ได้เมื่อ auth cookie บังคับ
- ความเสี่ยง: การเลือก role ผ่านการพิมพ์ ID อาจผิดพลาดง่าย ควรใช้ dropdown

### 28) ผู้ดูแลระบบ (Admins) (`src/app/adminb2b/admins/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: กรองบทบาทแบบ hardcode (`seller/super admin/sales admin`) อาจตัด role อื่นที่ควรเห็น → ควรใช้เงื่อนไขจาก backend หรือ config
- จุดที่ควรเพิ่ม/ปรับ: `fetch` ไม่มี `credentials` และไม่มี error state ที่ชัดเจน
- จุดที่ควรเพิ่ม/ปรับ: ปุ่มลบ/ปิดใช้งานยังใช้ confirm/prompt → ควรใช้ modal ที่สม่ำเสมอ
- ความเสี่ยง: การ update ใช้ PUT กับ API ที่รองรับ PATCH อาจทำให้ข้อมูลบางส่วนทับ/สูญหาย

### 29) หมวดหมู่สินค้า (Categories) (`src/app/adminb2b/categories/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ไม่มีปุ่มแก้ไข/ลบหมวดหมู่ → การจัดการไม่ครบ
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `alert` แทน toast ทำให้ UX ไม่สม่ำเสมอ
- จุดที่ควรเพิ่ม/ปรับ: `fetch` ไม่มี `credentials` และไม่มีการจัดการ 401/403
- ความเสี่ยง: ไม่มีการตรวจ slug ซ้ำหรือแสดงผล slug อย่างเป็นระบบ

### 30) หน้าทดสอบ UI (`src/app/adminb2b/test-ui/page.tsx`)
- จุดที่ควรลบ/ซ่อน: เป็นหน้าทดสอบภายใน ไม่ควรเปิดใน production → ควรลบหรือปิด route

### 31) WMS Dashboard (`src/app/wms/page.tsx`, `src/app/wms/layout.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: มีลิงก์ไป `/wms/movements` แต่ไม่มีหน้า → ควรสร้างหน้าหรือเอาลิงก์ออกทั้งใน layout และ quick actions
- จุดที่ควรเพิ่ม/ปรับ: ไม่มีการแสดง empty state เมื่อ stats เป็น 0 (แยกจาก error) เพื่อชี้ว่า “ยังไม่มีข้อมูลคลัง”
- จุดที่ควรเพิ่ม/ปรับ: ไม่มีการตรวจสิทธิ์ผู้ใช้ก่อนเข้าหน้า WMS

### 32) WMS - Inventory (`src/app/wms/inventory/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: หมวดหมู่/ชื่อสินค้าอาจแสดงเป็น ID (จาก backend) → ควร map เป็นชื่อหมวดหมู่จริง
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี action สำหรับปรับสต็อก/รับเข้า/เบิกออกจากตาราง → ควรเพิ่มปุ่มเพื่อเชื่อม workflow WMS จริง
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี pagination เมื่อสินค้าเยอะ
- ความเสี่ยง: `fetch` ไม่มี `credentials` และไม่มีการจัดการ auth

### 33) WMS - Inbound (`src/app/wms/inbound/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “สร้าง PO/สร้าง ASN/ตรวจสอบสินค้า/พิมพ์บาร์โค้ด” ไม่มี action → ควรเชื่อมกับ modal/หน้าใหม่หรือซ่อนหากยังไม่พัฒนา
- จุดที่ควรเพิ่ม/ปรับ: ยังไม่มี empty state ที่ชัดเจนเมื่อ list ว่าง (PO/ASN)
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี `credentials` และไม่มีการจัดการ auth

### 34) WMS - Outbound (`src/app/wms/outbound/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่มสร้างใบสั่งขาย/สร้าง picking/แพ็ค/จัดส่ง เป็น UI เปล่า → ควรเชื่อม workflow จริงหรือซ่อน
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี empty state สำหรับ orders/picking หากไม่มีข้อมูล
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี `credentials` และไม่มีการจัดการ auth

### 35) WMS - Reports (`src/app/wms/reports/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี empty state เมื่อ `recentMovements` ว่าง หรือ stats เป็น 0
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี `credentials` และไม่มีการจัดการ auth
- จุดที่ควรเพิ่ม/ปรับ: ตัวกรองหมวดหมู่ (`selectedCategory`) ถูกประกาศแต่ไม่ใช้ใน UI → ควรลบหรือเชื่อมใช้งาน

### 36) Shop (B2B) (`src/app/shop/page.tsx` + `src/app/shop/components/*`)
- จุดที่ควรเพิ่ม/ปรับ: ฟอร์มสั่งซื้อรับแค่ชื่อ/เบอร์โทร ไม่มีข้อมูลบริษัท/ที่อยู่/เลขผู้เสียภาษี → ไม่ครบสำหรับ B2B จริง
- จุดที่ควรเพิ่ม/ปรับ: ช่องทางโอนเงินไม่มีรายละเอียดบัญชี/ขั้นตอนอัพโหลดสลิปใน UI (มีเฉพาะข้อความ) → ควรเพิ่มข้อมูลบริษัท/ลิงก์อัพโหลด
- จุดที่ควรเพิ่ม/ปรับ: หมวดหมู่สินค้า/สินค้าอาจแสดงเป็นค่า ID หาก backend ส่ง id → ควร map เป็นชื่อหมวดหมู่
- ความเสี่ยง: การกรองสินค้าใช้ `isAvailable=true` แต่ไม่ได้จัดการกรณีสินค้าที่ไม่มีราคา/หน่วย → อาจทำให้ตะกร้าคำนวณผิด

### 37) My Orders (`src/app/my-orders/page.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ใช้การค้นหาด้วยเบอร์โทรโดยตรง ไม่ผูกกับ customer login → เสี่ยงข้อมูลรั่วไหล ควรใช้ auth cookie จาก OTP login
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี empty state/ช่วยเหลือเมื่อไม่พบรายการ
- จุดที่ควรเพิ่ม/ปรับ: ข้อมูลสถานะ/เลขที่ควรเป็นรูปแบบที่อ่านง่าย (เช่น order number) แทน `_id`

### 38) หน้าทดสอบระบบชำระเงิน (`src/app/test-payment/page.tsx`)
- จุดที่ควรลบ/ซ่อน: เป็นหน้าทดสอบภายใน มีปุ่มยิง API และสร้างออเดอร์ทดสอบ → ไม่ควรเปิดบน production
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `alert` สำหรับผลทดสอบ ไม่สม่ำเสมอกับ toast

### 39) Jubili Dashboard (`src/features/jubili/pages/Dashboard.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: ตัวเลข badge ใน filter header เป็นค่าคงที่ (15/46) → ควรใช้ข้อมูลจริงจาก API
- จุดที่ควรเพิ่ม/ปรับ: ฟิลเตอร์ทีม/ผู้รับผิดชอบ/ค้นหาเพิ่มเติมยังไม่เชื่อมกับ API เหมือนหน้า dashboard ของ adminb2b
- จุดที่ควรเพิ่ม/ปรับ: ควรมี empty state สำหรับ chart/activities เมื่อไม่มีข้อมูล

### 40) Jubili ใบเสนอราคา (`src/features/jubili/pages/Quotations.jsx`)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “ค้นหาเพิ่มเติม” และแท็บ “ใบเสนอราคาเกินกำหนด” ยังไม่ทำงาน → ควรเชื่อมกับ filter จริง
- จุดที่ควรเพิ่ม/ปรับ: มีฟิลด์ filter ใน state (customerId/assignedTo/date) แต่ไม่มี UI ให้กรอก
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `prompt/alert` สำหรับ remark/error → ควรใช้ modal/toast
- ความเสี่ยง: ฟอร์ม Quotation ใช้ overlay ซ้อน (เหมือนในข้อ 12) → ควรแก้เหมือนกัน

### 41) Placeholder Page (`src/features/jubili/pages/PlaceholderPage.jsx`)
- จุดที่ควรปรับ: ใช้ placeholder สำหรับหน้าที่ยังไม่พร้อม ควรแสดงเฉพาะใน staging หรือซ่อนใน production

### 42) ฟอร์มลูกค้า (CustomerFormNew) (`src/components/CustomerFormNew.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ปุ่ม “เพิ่มข้อมูล” ไม่มี action → ควรลบหรือผูกกับฟังก์ชันจริง
- จุดที่ควรเพิ่ม/ปรับ: ทีมที่รับผิดชอบเป็นค่า hardcode ควรดึงจากระบบทีมจริงเพื่อไม่ซ้ำซ้อน
- จุดที่ควรเพิ่ม/ปรับ: Tag suggestions เป็น static list → ควรดึงจากฐานข้อมูล/ระบบ tag จริง
- จุดที่ควรเพิ่ม/ปรับ: `fetch` admin list ไม่มี `credentials`
- หมายเหตุ: AddressAutocomplete รองรับจังหวัด/อำเภอ/ตำบล + ค้นหาได้แล้ว ตรงตาม requirement แต่ควรใช้ให้ครบในทุกฟอร์มที่เกี่ยวข้อง

### 43) ฟอร์มโครงการ (ProjectForm) (`src/components/ProjectForm.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: รหัสลูกค้า/ชื่อลูกค้าเป็น input มือ → ควรเลือกจากลูกค้าจริงเพื่อป้องกันข้อมูลไม่ตรงกัน
- จุดที่ควรเพิ่ม/ปรับ: รายการทีมและประเภทโครงการเป็น static list → ควรดึงจาก config/backend
- หมายเหตุ: AddressAutocomplete รองรับจังหวัด/อำเภอ/ตำบล + ค้นหาได้แล้ว (ตรง requirement)

### 44) ฟอร์มโอกาส (OpportunityForm) (`src/components/OpportunityForm.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: รหัสลูกค้า/ชื่อลูกค้าเป็น input มือ → ควรเลือกจากลูกค้าเพื่อป้องกันข้อมูลไม่ตรงกัน
- จุดที่ควรเพิ่ม/ปรับ: ทีมเป็น static list ควรดึงจากระบบจริง
- จุดที่ควรเพิ่ม/ปรับ: ownerId ไม่มี dropdown รายชื่อผู้รับผิดชอบ

### 45) ฟอร์มกิจกรรม (ActivityForm) (`src/components/ActivityForm.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ผู้รับผิดชอบเป็น input id → ควรเปลี่ยนเป็น dropdown รายชื่อแอดมิน
- จุดที่ควรเพิ่ม/ปรับ: โหลดลูกค้า/โอกาส/ใบเสนอราคาทั้งหมด limit=100 อาจไม่พอเมื่อข้อมูลเยอะ → ควรเพิ่ม search หรือ pagination
- ความเสี่ยง: ไม่มี `credentials` ใน API layer (ต้องตรวจใน apiService) อาจส่งผลเมื่อเปิด auth

### 46) ฟอร์มสินค้า (ProductForm) (`src/components/ProductForm.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: บังคับกรอก imageUrl หากไม่มีระบบอัพโหลดที่พร้อมใช้งาน จะทำให้ผู้ใช้สร้างสินค้าไม่ได้ → ควรอนุญาตสร้างแบบไม่มีรูปหรือทำ default image
- จุดที่ควรเพิ่ม/ปรับ: Upload รูปพึ่ง Cloudinary (ต้องมี env) หากไม่ตั้งค่า ควรแสดงข้อความชัดเจน/ปิดปุ่มอัพโหลด
- จุดที่ควรเพิ่ม/ปรับ: มี `console.log` debug ใน production ควรถอดออก

### 47) ActivityTimeline (`src/components/ActivityTimeline.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `prompt` สำหรับเหตุผลเลื่อน/ยกเลิก → ควรใช้ modal
- จุดที่ควรเพิ่ม/ปรับ: แสดง type/status เป็นค่าอังกฤษดิบ (call/meeting/planned) → ควร map เป็นภาษาไทย
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี `credentials` ใน fetch

### 48) NotesPanel (`src/components/NotesPanel.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: input file ยังเป็น default ไม่มีการแสดง progress/ข้อจำกัดไฟล์ → ควรทำให้สอดคล้องกับ UI อื่น
- จุดที่ควรเพิ่ม/ปรับ: ไม่มี `credentials` ใน fetch และไม่มี error handling เมื่ออัปโหลดล้มเหลว
- จุดที่ควรเพิ่ม/ปรับ: ไม่มีการยืนยันก่อนลบไฟล์แนบ (ไม่มีฟังก์ชันลบเลย) → ควรเพิ่มการจัดการไฟล์แนบ

### 49) PaymentStatusTracker (`src/components/PaymentStatusTracker.tsx`)
- จุดที่ควรเพิ่ม/ปรับ: อัพโหลดสลิปเป็นการจำลอง (ใช้ `URL.createObjectURL`) ไม่ได้อัพโหลดจริง → หากใช้ production ต้องเชื่อมระบบอัพโหลดไฟล์จริง
- จุดที่ควรเพิ่ม/ปรับ: ใช้ `alert` สำหรับ error → ควรใช้ toast/modals ให้สม่ำเสมอ
- จุดที่ควรเพิ่ม/ปรับ: `verifiedBy: 'admin'` ถูก hardcode ควรดึงจากผู้ใช้ที่ล็อกอินจริง

### 50) คอมโพเนนต์ที่ไม่ถูกใช้งาน
- พบไฟล์ที่น่าจะไม่ได้ถูกเรียกใช้แล้ว เช่น `src/components/CustomerForm.tsx`, `src/components/CustomerList.tsx` → ถ้าไม่ใช้งานจริงควรลบเพื่อลดความสับสน/ซ้ำซ้อน

### 51) Mock/Legacy ที่ยังคงอยู่
- แก้ไขแล้ว: ลบ `DataContext` และ `mockData` ที่ไม่ใช้งานออกแล้ว

### 52) AdminSidebar (legacy) (`src/components/AdminSidebar.tsx`)
- แก้ไขแล้ว: ลบไฟล์ legacy ที่อ่าน role จาก localStorage ออกแล้ว

## รอบตรวจสอบใหม่ (หลังการแก้ไขล่าสุด)

### A1) MainLayout (`src/components/layout/MainLayout.tsx`)
- อัปเดตแล้ว: ถอด `DataProvider` ออกเรียบร้อย (ตามเป้าหมายเลิกใช้ mock/localStorage)
- ตรวจเพิ่ม: ไม่มีผลกระทบกับ layout หลัก แต่ควรยืนยันว่าไม่มีส่วนใดใน UI ที่ยังพึ่ง DataContext อยู่

### A2) แดชบอร์ด B2B (`src/app/adminb2b/dashboard/page.tsx`)
- อัปเดตแล้ว: ลบ mock data ของ payment/product group และผูกกับข้อมูลจริงจาก API
- ยังต้องติดตาม: ตัวกรองทีม/ผู้รับผิดชอบยังเป็น UI เปล่า (ยังไม่ผูก query)

### A3) สิทธิ์/ผู้ดูแล (Permissions) (`src/app/adminb2b/permissions/page.tsx`)
- อัปเดตแล้ว: ลบ baseRoles/basePermissions และ localStorage → ใช้ API จริงทั้งหมด และรองรับ `_id`/role object
- ยังต้องติดตาม: การสร้าง/ลบบทบาท/แอดมินยังใช้ `prompt` → ควรเปลี่ยนเป็น modal ฟอร์ม

### A4) สินค้า (Products) (`src/app/adminb2b/products/page.tsx`)
- อัปเดตแล้ว: เพิ่ม soft delete/restore + filter lifecycle และการแสดงจำนวน active/archived
- ยังต้องติดตาม: ปุ่ม “แก้ไข” ยังไม่เปิด modal (มีแค่ `setEditingProduct`) → UX แก้ไขยังใช้งานไม่ได้
- ยังต้องติดตาม: ยังใช้ Bearer token/`useTokenManager` ต่างจากหลายหน้าที่ใช้ cookie

### A5) ใบเสนอราคา (รายการ) (`src/app/adminb2b/quotations/page.tsx`)
- อัปเดตแล้ว: ส่ง `onClose` ให้ `QuotationForm` (ปิด modal ได้สม่ำเสมอขึ้น)
- ยังต้องติดตาม: การดึงโปรไฟล์แอดมินยังใช้ localStorage token ใน `handleSendViaLine` หากยังไม่แก้

### A6) ใบเสนอราคา View (`src/app/adminb2b/quotations/[id]/view/page.tsx`)
- อัปเดตแล้ว: แสดง “ที่อยู่จัดส่ง” เป็นที่อยู่ลูกค้าจริงเมื่อเลือก `shipToSameAsCustomer`
- ยังต้องติดตาม: ลายเซ็นผู้เสนอราคา/ผู้รับผิดชอบยังไม่ผูกกับข้อมูลแอดมิน

### A7) Customer Login (`src/app/login/customer/page.tsx`)
- อัปเดตแล้ว: placeholder/ความยาวรหัสลูกค้าให้ตรงกับรูปแบบใหม่ `CYYMMXXXX`

### A8) หน้าทดสอบระบบชำระเงิน (`src/app/test-payment/page.tsx`)
- อัปเดตแล้ว: เปลี่ยนจาก mock orders เป็นข้อมูลจริงจาก `/api/orders`
- ยังต้องติดตาม: หน้า test ควรถูกซ่อน/ลบใน production ตามเดิม

### A9) WMS Inbound (`src/app/wms/inbound/page.tsx`)
- อัปเดตแล้ว: เปลี่ยนจาก mock PO/ASN เป็นข้อมูลจริงจาก `/api/wms/inbound`
- ยังต้องติดตาม: `fetch` ยังไม่ส่ง `credentials` หากระบบ WMS ใช้ auth cookie อาจโหลดไม่ได้
- ยังต้องติดตาม: ปุ่ม Quick Actions/สร้าง PO/ASN ยังไม่มี action จริง (เป็น UI เปล่า)

### A10) WMS Inventory (`src/app/wms/inventory/page.tsx`)
- อัปเดตแล้ว: เพิ่มลิงก์ไปหน้าจัดการสินค้าเพื่อเชื่อม WMS กับ catalog จริง
- ยังต้องติดตาม: `fetch('/api/wms/products')` ไม่ส่ง `credentials` หาก backend บังคับ auth cookie อาจโหลดไม่สำเร็จ
- ยังต้องติดตาม: ปุ่ม “รีเฟรช” เรียก `fetchProducts` ได้ แต่ไม่มีสถานะ loading เฉพาะปุ่ม (ตอนนี้ทั้งหน้าโหลดครั้งแรกเท่านั้น)

### A11) WMS Outbound (`src/app/wms/outbound/page.tsx`)
- อัปเดตแล้ว: เปลี่ยนจาก mock orders/picking tasks เป็นข้อมูลจริงจาก `/api/wms/outbound`
- ยังต้องติดตาม: `fetch` ยังไม่ส่ง `credentials` หากระบบ WMS ใช้ auth cookie อาจโหลดไม่สำเร็จ
- ยังต้องติดตาม: ปุ่ม Quick Actions/สร้างใบสั่งขาย/สร้าง Picking Task ยังเป็น UI เปล่า

### A12) ฟอร์มลูกค้าใหม่ (`src/components/CustomerFormNew.tsx`)
- อัปเดตแล้ว: ใช้ `AddressAutocomplete` สำหรับจังหวัด/อำเภอ/แขวง/ไปรษณีย์ ทั้งที่อยู่หลักและที่อยู่จดทะเบียน
- อัปเดตแล้ว: รหัสลูกค้าใช้ `/api/customers/next-code` และเพิ่มตรวจเลขผู้เสียภาษีซ้ำผ่าน `/api/customers/check-tax-id`
- อัปเดตแล้ว: `assignedTo` ผูกกับ admin `_id` ผ่าน dropdown (ตรงตาม requirement adminId)
- ยังต้องติดตาม: โหลดรายชื่อ admin ผ่าน `/api/adminb2b/admins` ไม่มี `credentials` อาจล้มเหลวเมื่อใช้ auth cookie
- ยังต้องติดตาม: หากข้อมูลเดิมเก็บ `assignedTo` เป็นชื่อ (ไม่ใช่ id) จะไม่ match dropdown และต้อง migrate

### A13) ฟอร์มโอกาส (Opportunity) (`src/components/OpportunityForm.tsx`)
- อัปเดตแล้ว: ดึง pipeline stages จาก API (`apiService.pipelineStages`) แทน mock
- ยังต้องติดตาม: ถ้า API ส่งโครงสร้างไม่ใช่ `{ _id, name, probability }` จะทำให้ dropdown ว่าง/ไม่อัปเดต `stageName`
- ยังต้องติดตาม: ไม่มี empty state เมื่อโหลดสเตจล้มเหลว (เลือกไม่ได้แต่ UI ไม่บอกเหตุผล)

### A14) ฟอร์มโปรเจค (Project) (`src/components/ProjectForm.tsx`)
- อัปเดตแล้ว: เปลี่ยนเลือกจังหวัด/อำเภอแบบคงที่เป็น `AddressAutocomplete` ครบจังหวัด-เขต-แขวง-รหัสไปรษณีย์
- ยังต้องติดตาม: ถ้า `location` ในข้อมูลเดิมไม่มี `province/district/subdistrict/zipcode` จะทำให้ค่าที่แสดงว่าง ต้องยืนยัน migration

### A15) ฟอร์มใบเสนอราคา (Quotation) (`src/components/QuotationForm.tsx`)
- อัปเดตแล้ว: ตัด mockData ออกและบังคับใช้ `onSubmit` (หากไม่ส่งจะ throw error) → ลดการหลงใช้งาน mock
- อัปเดตแล้ว: เพิ่ม `ProductAutocomplete` ค้นหาสินค้าด้วยคำบางส่วน/รหัส และผูก `productId/sku/unit/price` จริง
- อัปเดตแล้ว: แสดงที่อยู่ลูกค้าในส่วนจัดส่ง + รองรับ `shipToSameAsCustomer` และบันทึก `shippingAddress`
- อัปเดตแล้ว: `assignedTo` ผูก admin `_id` ผ่าน dropdown
- ยังต้องติดตาม: โหลด admin ผ่าน `/api/adminb2b/admins` ไม่ส่ง `credentials` อาจล้มเหลวเมื่อใช้ auth cookie
- ยังต้องติดตาม: ช่อง “อำเภอ” ในที่อยู่จัดส่งยังเป็น dropdown เปล่า (ควรใช้ `AddressAutocomplete` ให้ครบเหมือนฟอร์มอื่น)

### A16) ฟอร์มใบสั่งขาย (Sales Order) (`src/components/SalesOrderForm.tsx`)
- อัปเดตแล้ว: ใช้ `useApiService` โหลดลูกค้า/ใบเสนอราคา และสร้าง/แก้ไขใบสั่งขายผ่าน API จริง
- อัปเดตแล้ว: map สถานะ UI ↔ API และ normalize ข้อมูลจาก order จริงก่อนแสดงฟอร์ม
- อัปเดตแล้ว: `owner` เปลี่ยนเป็น admin `_id` และส่ง `ownerId` ไป backend
- อัปเดตแล้ว: ที่อยู่จัดส่งใช้ `AddressAutocomplete` + `shipToSameAsCustomer` และบันทึกตำบล/ไปรษณีย์
- ยังต้องติดตาม: โหลด admin ผ่าน `/api/adminb2b/admins` ไม่ส่ง `credentials` อาจล้มเหลวเมื่อใช้ auth cookie
- ยังต้องติดตาม: dropdown ใบเสนอราคาไม่กรองสถานะ (ดึงทุกสถานะ) อาจทำให้สร้าง SO จากใบเสนอราคาที่ยังไม่อนุมัติ

### A17) ฟอร์มใบเสนอราคา (Sales Status) (`src/components/sales-status/QuotationForm.tsx`)
- อัปเดตแล้ว: เพิ่ม `ProductAutocomplete` สำหรับค้นหาสินค้า/รหัสสินค้าในฟอร์มสถานะการขาย
- ยังต้องติดตาม: payload ยังส่งทั้ง `productId/productName` ดิบตาม state → ต้องยืนยันว่า API ฝั่งนี้รองรับโครงสร้างใหม่

### A18) Activities (Jubili) (`src/features/jubili/pages/Activities.jsx`)
- อัปเดตแล้ว: เปลี่ยนสถิติด้านบนจาก mock เป็นข้อมูลจริงจาก `dashboardApi.getDashboardData()`
- ยังต้องติดตาม: ค่า `ordersValue` ใช้ `toLocaleString` หาก backend ส่งเป็น string จะ error → ควรแปลงเป็น number ก่อน
- ยังต้องติดตาม: หาก `kpis` ขาดบางส่วน UI ยังแสดง “0/0” ซึ่งอาจทำให้ผู้ใช้เข้าใจผิด ควรมี empty state ชัดเจน

### A19) Dashboard (Jubili) (`src/features/jubili/pages/Dashboard.jsx`)
- อัปเดตแล้ว: กราฟ/ตารางทีมขาย/วิธีชำระเงิน/กลุ่มสินค้าใช้ข้อมูลจริงจาก `dashboardData` พร้อม empty state
- อัปเดตแล้ว: “กิจกรรมล่าสุด” ใช้ข้อมูลจริงและแสดง fallback เมื่อไม่มีข้อมูล
- ยังต้องติดตาม: ค่าใน `salesTeamData`/`paymentMethods` หากเป็น string จะทำให้การ sum/กราฟผิด ควร cast เป็น number ใน formatter

### A20) Opportunities (Jubili) (`src/features/jubili/pages/Opportunities.jsx`)
- อัปเดตแล้ว: เปลี่ยน pipeline stages จาก mock เป็น `pipelineStagesApi.getPipelineStages()`
- อัปเดตแล้ว: code/importance ไม่สุ่มอีกต่อไป (derive จาก `createdAt` และ `probability`)
- ยังต้องติดตาม: `getOpportunities()` ใช้ `response.data` เป็นหลัก ต้องยืนยันว่า service ส่งรูปแบบนี้เสมอ (ถ้าเป็น array จะ error)
- ยังต้องติดตาม: contact/phone ยังเป็น placeholder “-” หาก API ยังไม่รองรับ

### A21) Quotations (Jubili) (`src/features/jubili/pages/Quotations.jsx`)
- อัปเดตแล้ว: ดึงลูกค้าจริงมาให้ `QuotationForm` และใช้ API จริงสำหรับ create/update
- อัปเดตแล้ว: แก้ไขใบเสนอราคาดึง detail ก่อนเปิดฟอร์ม ลดปัญหา data ไม่ครบ
- ยังต้องติดตาม: การขอ remark ใช้ `window.prompt` (UX ไม่สม่ำเสมอ/ไม่มี validation ขั้นสูง)

### A22) Reports (Jubili) (`src/features/jubili/pages/Reports.jsx`)
- อัปเดตแล้ว: เลิกใช้ `DataContext` และใช้ `fetchWithAuth` (tokenManager) สำหรับเรียกรายงานจริง
- อัปเดตแล้ว: รายงาน CSV สร้างจาก JSON response โดยตรง (ไม่พึ่ง endpoint mock)
- ยังต้องติดตาม: `fetchWithAuth` ส่ง Bearer token จาก cookie → ต้องยืนยันว่า backend รองรับทั้ง cookie และ header
- ยังต้องติดตาม: โหลดรายชื่อทีมจาก `/api/adminb2b/admins` ยังไม่ส่ง `credentials`

### A23) SalesOrders (Jubili) (`src/features/jubili/pages/SalesOrders.jsx`)
- อัปเดตแล้ว: ดึงข้อมูลผ่าน API ด้วย `orderType: 'sales_order'` และรองรับ response เป็น array หรือ object
- อัปเดตแล้ว: map สถานะ/ยอดชำระ/ผู้รับผิดชอบให้ตรงกับข้อมูลจริงมากขึ้น
- อัปเดตแล้ว: เพิ่มปุ่มดู/พิมพ์ และดาวน์โหลด PDF ใบสั่งขายจากหน้า list

### A64) ใบสั่งขาย View/Print (`src/app/adminb2b/sales-orders/[id]/view/page.tsx`)
- อัปเดตแล้ว: หน้า view ใบสั่งขายใช้ข้อมูลจริง พร้อมข้อมูลบริษัทจาก settings
- อัปเดตแล้ว: โหลดลายเซ็นผู้รับผิดชอบและรองรับดาวน์โหลด PDF
- ยังต้องติดตาม: ต้องยืนยันว่า backend รองรับ filter `orderType` ไม่เช่นนั้นจะได้ผลลัพธ์ว่าง

### A24) useApiService (Jubili) (`src/features/jubili/hooks/useApiService.ts`)
- อัปเดตแล้ว: เพิ่ม `pipelineStages` API ทำให้หน้า Opportunities/OpportunityForm ใช้ข้อมูลจริง
- ยังต้องติดตาม: ยังพึ่ง `useTokenManager` (Bearer token) ซึ่งอาจขัดกับนโยบายเลิก localStorage หาก token manager เก็บใน localStorage

### A25) apiService (Jubili) (`src/features/jubili/services/apiService.ts`)
- อัปเดตแล้ว: เพิ่ม `unwrapResponse()` รองรับทั้งรูปแบบ `{ data }` และ response ตรง → ลดปัญหา UI พังเมื่อ backend ส่งรูปแบบต่างกัน
- อัปเดตแล้ว: เพิ่ม `pipelineStagesApi` และขยาย model ของ SalesOrder/DashboardData ให้รองรับข้อมูลจริงมากขึ้น
- ยังต้องติดตาม: API ทั้งหมดยังรองรับ Bearer token เป็นหลัก (ผ่าน `apiRequest`) ต้องชัดเจนว่าระบบ auth ใช้ cookie หรือ token จริง

### A26) AddressAutocomplete (`src/components/ui/AddressAutocomplete.tsx`)
- อัปเดตแล้ว: รองรับจังหวัด/อำเภอ/แขวง + ค้นหาด้วยคีย์เวิร์ด ตาม requirement
- ยังต้องติดตาม: เป็นข้อมูล static จาก `thaiAddressData` (ไม่ใช่ API) → ต้องยืนยันว่า “ข้อมูลจริง” อนุญาตให้ใช้ dataset ภายในระบบ

### A27) ProductAutocomplete (`src/components/ui/ProductAutocomplete.tsx`)
- อัปเดตแล้ว: ค้นหาสินค้าด้วย keyword/รหัส SKU ผ่าน `/api/products/search` พร้อม debounce
- ยังต้องติดตาม: `fetch` ไม่ส่ง `credentials` หาก API บังคับ auth cookie อาจค้นหาไม่สำเร็จ

### A28) API ลูกค้า - รหัสถัดไป (`src/app/api/customers/next-code/route.ts`)
- อัปเดตแล้ว: สร้างรหัสลูกค้าถัดไปผ่าน `Customer.generateUniqueCustomerCode()`
- ยังต้องติดตาม: ไม่มีการตรวจ auth/role ใน API นี้ หากเป็น admin-only ควรเพิ่ม guard

### A29) API ลูกค้า - ตรวจเลขภาษี (`src/app/api/customers/check-tax-id/route.ts`)
- อัปเดตแล้ว: ตรวจเลขผู้เสียภาษีซ้ำและส่งชื่อ/รหัสลูกค้าที่ซ้ำกลับไปให้ UI
- ยังต้องติดตาม: ไม่มี auth guard อาจเปิดให้ตรวจสอบข้อมูลลูกค้าแบบ public ได้

### A30) API สินค้า - ค้นหา (`src/app/api/products/search/route.ts`)
- อัปเดตแล้ว: ค้นหาสินค้าด้วยชื่อ/SKU/คำอธิบาย และส่งกลับ `{ products }` ให้ ProductAutocomplete
- ยังต้องติดตาม: ไม่มี auth guard หากต้องการจำกัดเฉพาะผู้มีสิทธิ์ควรเพิ่มตรวจ token/cookie

### A31) API ลายเซ็นผู้ใช้ (`src/app/api/users/signature/route.ts`)
- อัปเดตแล้ว: รองรับ GET/POST/DELETE สำหรับดึง/บันทึก/ลบลายเซ็นของแอดมิน
- ยังต้องติดตาม: ไม่มี auth guard → หากต้องการจำกัดสิทธิ์ควรตรวจ role/token ก่อนใช้งาน

### A32) API WMS Inbound (`src/app/api/wms/inbound/route.ts`)
- อัปเดตแล้ว: ดึง PO/ASN จริงจาก DB และ map ฟิลด์ให้ UI ใช้งานได้
- ยังต้องติดตาม: ไม่มี auth guard → หากระบบ WMS ต้องจำกัดสิทธิ์ควรเพิ่มตรวจ token/cookie

### A33) API WMS Outbound (`src/app/api/wms/outbound/route.ts`)
- อัปเดตแล้ว: map Orders เป็น salesOrders/pickingTasks ให้ UI WMS ใช้ได้จริง
- ยังต้องติดตาม: ไม่มี auth guard และไม่มี filter เริ่มต้น (หากไม่มี `orderType` จะโหลดทุก order)

### A34) API WMS Products (`src/app/api/wms/products/route.ts`)
- อัปเดตแล้ว: map สินค้าให้ WMS Inventory ใช้งานได้ (stock/min/max/cost/units)
- ยังต้องติดตาม: ไม่มี auth guard และต้องยืนยันว่าฟิลด์ `stock/minStock/maxStock` มีอยู่จริงใน Product model

### A35) API WMS Stats (`src/app/api/wms/stats/route.ts`)
- อัปเดตแล้ว: สรุปสต็อกและ recent movements จากสินค้า/ออเดอร์จริง
- ยังต้องติดตาม: ไม่มี auth guard และใช้ order ล่าสุด 10 รายการแบบรวมทั้งหมด (อาจไม่ตรงกับ inbound/outbound แยก)

### A36) API Reports - Activity (`src/app/api/reports/activity-report/route.ts`)
- อัปเดตแล้ว: รองรับ filter ตาม role (seller/manager) และช่วงเวลา พร้อมสรุป byType/byStatus
- ยังต้องติดตาม: ใช้ `decodeJwt` โดยไม่ verify signature (เหมาะกับ filter แต่ไม่ใช่ auth ที่แท้จริง)

### A37) API Reports - Customer Analysis (`src/app/api/reports/customer-analysis/route.ts`)
- อัปเดตแล้ว: สรุปจำนวนลูกค้าแยกตามประเภท/จังหวัด พร้อม filter ตาม owner/role
- ยังต้องติดตาม: ใช้ `decodeJwt` โดยไม่ verify signature เหมือน API รายงานอื่น ๆ

### A38) API Reports - Product Sales (`src/app/api/reports/product-sales/route.ts`)
- อัปเดตแล้ว: สรุปยอดขายสินค้าโดยรวม/จำนวน พร้อม filter ตาม owner/team
- ยังต้องติดตาม: `$lookup` ใช้ `items.productId` เทียบ `_id` หากเก็บเป็น string อาจ join ไม่ติด ต้องยืนยันชนิดข้อมูล

### A39) API Reports - Sales Summary (`src/app/api/reports/sales-summary/route.ts`)
- อัปเดตแล้ว: สรุปยอดขายรวมตามวัน/เดือน/ปี พร้อม filter ตาม owner/team
- ยังต้องติดตาม: ใช้ `decodeJwt` (ไม่ verify) เหมือน report อื่น ๆ

### A40) Model ลูกค้า (`src/models/Customer.ts`)
- อัปเดตแล้ว: สร้างรหัสลูกค้าแบบรันต่อรายเดือนตามรูปแบบ `CYYMMXXXX` ผ่าน `generateUniqueCustomerCode()`
- ยังต้องติดตาม: การ generate ไม่เป็น atomic (มีโอกาสชนกันเมื่อสร้างพร้อมกันหลายครั้ง) → อาจต้องเสริม unique retry ที่ชั้น API

### A41) Model Admin (`src/models/Admin.ts`)
- อัปเดตแล้ว: เพิ่มฟิลด์ `position` และ `signatureUrl` รองรับลายเซ็นในเอกสาร

### A42) Model Order (`src/models/Order.ts`)
- อัปเดตแล้ว: เพิ่มฟิลด์ orderType/ownerId/paymentStatus/delivery* เพื่อรองรับ Sales Order + WMS จริง
- ยังต้องติดตาม: ค่า default `orderType` เป็น `online` ดังนั้น SalesOrders list ต้องส่ง filter `sales_order` (ทำแล้ว)

### A43) Model Product (`src/models/Product.ts`)
- อัปเดตแล้ว: เพิ่ม stock/min/max/cost/location รองรับ WMS และค้นหา SKU

### A44) Schema ลูกค้า (`src/schemas/customer.ts`)
- อัปเดตแล้ว: รองรับ `customerCode` รูปแบบ `CYYMMXXXX` และที่อยู่แบบ province/district/subdistrict/zipcode

### A45) Schema สินค้า (`src/schemas/product.ts`)
- ยังต้องติดตาม: schema ยังไม่มีฟิลด์ stock/minStock/maxStock → หาก API validate ผ่าน schema จะไม่สามารถอัปเดตสต็อกสำหรับ WMS ได้

### A46) API Customers (`src/app/api/customers/route.ts`)
- อัปเดตแล้ว: ตรวจสอบ `customerCode` ซ้ำก่อนสร้าง และตั้ง `assignedTo` เป็น adminId ตาม role

### A47) API Dashboard (`src/app/api/dashboard/route.ts`)
- อัปเดตแล้ว: เพิ่มข้อมูล paymentMethods/productGroups/salesTeam ให้หน้า Dashboard ใช้ข้อมูลจริง
- ยังต้องติดตาม: `$lookup` จาก `items.productId` ไป `products._id` อาจไม่ตรงชนิดข้อมูล (ถ้า productId เก็บเป็น string)

### A48) API Orders (`src/app/api/orders/route.ts`)
- อัปเดตแล้ว: รองรับ orderType `sales_order` และ map field ให้ตรงกับฟอร์มใบสั่งขาย (ownerId/paymentStatus/delivery*)
- อัปเดตแล้ว: GET รองรับ filter/pagination และคืน `{ data, total }` เมื่อมี query
- ยังต้องติดตาม: ไม่มี auth guard และมีรูปแบบ response 2 แบบ (array vs `{ data }`) → ต้องมั่นใจว่า client ทุกจุดรองรับ

### A49) API Order Status (`src/app/api/orders/[id]/status/route.ts`)
- อัปเดตแล้ว: ป้องกันการ auto-create sales order เมื่อ orderType เป็น `sales_order`

### A50) API Products (`src/app/api/products/route.ts`)
- อัปเดตแล้ว: รองรับ `includeDeleted` และบล็อกด้วย `verifyToken` เมื่อขอดูรายการที่ถูกลบ

### A51) API Product Detail (`src/app/api/products/[id]/route.ts`)
- อัปเดตแล้ว: soft delete + restore (PATCH) และกันแก้ไขสินค้าเมื่อถูกลบ
- อัปเดตแล้ว: GET รองรับ `includeDeleted=true` พร้อม auth guard

### A52) API Quotations (`src/app/api/quotations/route.ts`)
- อัปเดตแล้ว: ตั้ง `assignedTo` เป็น adminId ตาม role เมื่อสร้างใบเสนอราคา

### A53) API Quotation PDF (`src/app/api/quotations/[id]/pdf/route.ts`)
- อัปเดตแล้ว: แนบลายเซ็นผู้จัดทำ/ผู้อนุมัติตาม role และส่งไปยัง `generateQuotationHTML`

### A54) PDF Template (`src/utils/quotationPdf.ts`)
- อัปเดตแล้ว: รองรับลายเซ็น/ตำแหน่งผู้เสนอราคา-ผู้อนุมัติ-ผู้ยืนยัน ตาม role
- อัปเดตแล้ว: แสดงที่อยู่จัดส่งเป็นที่อยู่ลูกค้าเมื่อเลือก `shipToSameAsCustomer`

### A55) API Admins (`src/app/api/adminb2b/admins/route.ts`)
- อัปเดตแล้ว: รองรับ `position` และ `signatureUrl` ตอนสร้าง/อัปเดตแอดมิน

### A56) API Admin Detail (`src/app/api/adminb2b/admins/[id]/route.ts`)
- อัปเดตแล้ว: เปลี่ยนเป็น PATCH แบบ partial และตรวจสอบซ้ำของ phone/email/role
- ยังต้องติดตาม: ไม่มี GET แล้ว และลบการกันลบ Super Admin → ต้องยืนยันว่า UI ไม่พึ่ง GET และ policy การลบ

### A57) API Role Detail (`src/app/api/adminb2b/roles/[id]/route.ts`)
- อัปเดตแล้ว: เปลี่ยนจาก PUT เป็น PATCH (partial update) และป้องกันการลบ role ที่ถูกใช้งานโดย admin
- ยังต้องติดตาม: ไม่มี GET และลบการกันลบ system role เดิม → ต้องยืนยัน policy ใหม่

### A58) LINE Webhook (`src/app/api/line/webhook/route.ts`)
- อัปเดตแล้ว: รองรับรูปแบบรหัสลูกค้า `CYYMMXXXX` และกันสินค้า deleted ในคำสั่งสั่งซื้อผ่าน LINE

### A59) Models WMS (`src/models/ASN.ts`, `src/models/PurchaseOrder.ts`)
- อัปเดตแล้ว: เพิ่มโมเดล ASN/PO เพื่อให้ WMS inbound ใช้ข้อมูลจริง

### A60) Model User (`src/models/User.ts`)
- อัปเดตแล้ว: เพิ่ม `position` และ `signatureUrl` รองรับลายเซ็น/ตำแหน่งในบางหน้าที่ใช้ User model

### A61) Thai Address Dataset (`src/data/thaiAddressData.ts`)
- อัปเดตแล้ว: เก็บชุดข้อมูลจังหวัด/อำเภอ/แขวงแบบ static สำหรับ AddressAutocomplete
- ยังต้องติดตาม: ไฟล์ใหญ่ (~MB) ถูก bundle เข้า client → อาจกระทบ performance หากไม่ lazy-load

### A62) LocalStorage ที่ยังค้างอยู่
- อัปเดตแล้ว: `src/app/adminb2b/orders/page.tsx` เปลี่ยนไปใช้ `useTokenManager` (cookie-based)
- อัปเดตแล้ว: `src/app/adminb2b/quotations/page.tsx` เปลี่ยนไปใช้ `useTokenManager`
- อัปเดตแล้ว: `useSavedFilters` เลิกใช้ localStorage (เก็บในหน่วยความจำแทน)

### A63) Admins Page (B2B) (`src/app/adminb2b/admins/page.tsx`)
- อัปเดตแล้ว: เปลี่ยน `PUT` เป็น `PATCH` ให้สอดคล้องกับ API ใหม่
