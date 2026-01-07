# รายงานปัญหา UI ที่ต้องแก้ไข

> อัปเดตล่าสุด: 8 มกราคม 2569

---

## สารบัญ

1. [ปุ่ม Filter ที่ไม่ทำงาน](#1-ปุ่ม-filter-ที่ไม่ทำงาน)
2. [ใช้ window.prompt() แทน Modal](#2-ใช้-windowprompt-แทน-modal)
3. [ตารางลูกค้ามีสีสันมากเกินไป](#3-ตารางลูกค้ามีสีสันมากเกินไป)
4. [ปุ่มในหน้า Products อยู่ผิดที่](#4-ปุ่มในหน้า-products-อยู่ผิดที่)
5. [Loading State ไม่สม่ำเสมอ](#5-loading-state-ไม่สม่ำเสมอ)
6. [Modal ซ้อน Modal](#6-modal-ซ้อน-modal)
7. [เลือก Team/Owner เป็น Hardcode](#7-เลือก-teamowner-เป็น-hardcode)
8. [ใช้ TypeScript และ JavaScript ปนกัน](#8-ใช้-typescript-และ-javascript-ปนกัน)
9. [ตารางใน Opportunities ใช้สี hardcode](#9-ตารางใน-opportunities-ใช้สี-hardcode)
10. [ProductList ใช้ Framer Motion แต่หน้าอื่นไม่ใช้](#10-productlist-ใช้-framer-motion-แต่หน้าอื่นไม่ใช้)
11. [Product Image ใช้ placeholder ที่อาจไม่มีอยู่จริง](#11-product-image-ใช้-placeholder-ที่อาจไม่มีอยู่จริง)

---

## 1. ปุ่ม Filter ที่ไม่ทำงาน

### ตำแหน่งที่พบ
- `src/features/jubili/pages/Customers.tsx` (บรรทัด 407-444)

### ปัญหา
หน้ารายการลูกค้ามีปุ่มกรองข้อมูล 4 ปุ่ม ได้แก่:
- **"ทีม - กำหนดเอง"** - ไม่มี onClick handler
- **"ผู้รับผิดชอบ - กำหนดเอง"** - ไม่มี onClick handler
- **"คำลูกค้า - กำหนดเอง"** - ไม่มี onClick handler
- **"ค้นหาเพิ่มเติม"** - ไม่มี onClick handler

ปุ่มเหล่านี้แสดงบนหน้าจอพร้อมสีสันสวยงาม แต่เมื่อผู้ใช้กดแล้วไม่เกิดอะไรขึ้น ทำให้ผู้ใช้สับสนและคิดว่าระบบมีปัญหา

### ผลกระทบ
- ผู้ใช้คาดหวังว่าปุ่มจะทำงานตามชื่อ
- สร้างความเข้าใจผิดว่าระบบยังทำงานไม่สมบูรณ์
- ลดความน่าเชื่อถือของแอปพลิเคชัน

### แนวทางแก้ไข
**ทางเลือก A:** ลบปุ่มเหล่านี้ออกไปก่อน หากยังไม่พร้อมใช้งาน  
**ทางเลือก B:** เพิ่ม logic การกรองให้ทำงานจริง โดยเชื่อมต่อกับ API หรือ state filter

---

## 2. ใช้ window.prompt() แทน Modal

### ตำแหน่งที่พบ
- `src/app/adminb2b/quotations/page.tsx` (บรรทัด 173, 212, 268)

### ปัญหา
ระบบใช้ `window.prompt()` ของเบราว์เซอร์สำหรับ:
- การขอหมายเหตุก่อนแก้ไขใบเสนอราคา
- การขอเหตุผลเมื่อเปลี่ยนสถานะเป็น "ยอมรับ" หรือ "ปฏิเสธ"
- การยืนยันการออกใบสั่งขาย

### ผลกระทบ
- หน้าตา `prompt()` ขึ้นอยู่กับเบราว์เซอร์ ไม่สามารถกำหนดสไตล์ได้
- ดูไม่เป็น professional
- ไม่สามารถ validate ข้อมูลก่อนส่งได้
- ผู้ใช้กด Cancel แล้วอาจได้ค่าว่าง หรือ null ที่ไม่ถูกจัดการ
- ไม่รองรับการใส่ข้อมูลหลายบรรทัด

### แนวทางแก้ไข
สร้าง Modal component สำหรับรับข้อมูลจากผู้ใช้ โดยมี:
- หัวข้อที่ชัดเจน
- ช่อง textarea สำหรับหมายเหตุ
- ปุ่มยืนยันและยกเลิก
- Validation ก่อนส่งข้อมูล

---

## 3. ตารางลูกค้ามีสีสันมากเกินไป

### ตำแหน่งที่พบ
- `src/features/jubili/pages/Customers.tsx` (บรรทัด 307-329)

### ปัญหา
ตารางลูกค้าใช้ระบบสลับสี 6 สี สำหรับพื้นหลังแถว และสีเส้นซ้าย 6 สี:
- bg-blue-50, bg-purple-50, bg-green-50, bg-orange-50, bg-pink-50, bg-cyan-50
- border-l-blue-500, border-l-purple-500, border-l-green-500, border-l-orange-500, border-l-pink-500, border-l-cyan-500

### ผลกระทบ
- ตารางดูรกและวุ่นวาย
- สีไม่ได้สื่อความหมาย (ไม่ใช่สีตามสถานะหรือประเภทลูกค้า)
- ยากต่อการอ่านและหาข้อมูล
- ไม่ตรงกับหลัก UI/UX ที่ดี

### แนวทางแก้ไข
**ทางเลือก A (แนะนำ):** ใช้ zebra striping แบบเรียบง่าย (สีขาว/เทาอ่อนสลับกัน)  
**ทางเลือก B:** ใช้สีที่มีความหมาย เช่น สีตามประเภทลูกค้า (ลูกค้าใหม่=สีเขียว, ลูกค้าประจำ=สีน้ำเงิน)  
**ทางเลือก C:** ไม่ใช้สีพื้นหลังเลย ใช้เฉพาะขอบล่างแบ่งแถว

---

## 4. ปุ่มในหน้า Products อยู่ผิดที่

### ตำแหน่งที่พบ
- `src/app/adminb2b/products/page.tsx` (บรรทัด 356-369)

### ปัญหา
ปุ่ม "ออกจากระบบ" (Logout) อยู่ในหน้าจัดการสินค้า ข้างๆ ปุ่ม "สร้างสินค้าใหม่"

### ผลกระทบ
- ผิดหลัก UX - ปุ่ม Logout ควรอยู่ที่ Header หรือ Sidebar
- ผู้ใช้อาจกดผิดโดยไม่ตั้งใจ
- ไม่ consistent กับหน้าอื่นๆ ที่ไม่มีปุ่มนี้

### แนวทางแก้ไข
- ย้ายปุ่ม Logout ไปอยู่ที่ Header หรือ Sidebar
- ลบปุ่มนี้ออกจากหน้า Products
- ตรวจสอบว่าหน้าอื่นๆ มีปุ่ม Logout อยู่ผิดที่หรือไม่

---

## 5. Loading State ไม่สม่ำเสมอ

### ตำแหน่งที่พบ
หลายหน้าใช้รูปแบบ Loading ต่างกัน:

| หน้า | รูปแบบ Loading |
|------|----------------|
| Dashboard | Lucide RefreshCw icon หมุน + ข้อความ |
| Products | Border spinner + ข้อความ |
| WMS | Border spinner ใหญ่ |
| Shop | Border spinner กลาง |
| Opportunities | Lucide RefreshCw + ข้อความ |

### ปัญหา
- ขนาด spinner ไม่เท่ากัน (h-8 บ้าง, h-12 บ้าง, h-32 บ้าง)
- บางหน้าใช้ Lucide icon หมุน บางหน้าใช้ CSS border spinner
- ข้อความบางหน้ามีบ้างไม่มีบ้าง
- สีไม่เหมือนกัน

### ผลกระทบ
- แอปดูไม่เป็นมืออาชีพ
- ผู้ใช้ไม่มั่นใจว่ากำลังโหลดข้อมูลจริงหรือไม่
- ขาดความสม่ำเสมอในการใช้งาน

### แนวทางแก้ไข
สร้าง Loading component กลางที่ใช้ร่วมกันทั้งแอป โดยมี:
- รูปแบบเดียว (แนะนำใช้ Lucide RefreshCw)
- ขนาดที่ปรับได้ (sm, md, lg)
- ข้อความที่ระบุได้
- สีที่ตรงกับ design system

---

## 6. Modal ซ้อน Modal

### ตำแหน่งที่พบ
- `src/app/adminb2b/quotations/page.tsx` (บรรทัด 436-452)
- `src/components/QuotationForm.tsx` (บรรทัด 1-40)

### ปัญหา
เมื่อเปิดแบบฟอร์มใบเสนอราคา:
1. หน้า Quotations ใช้ `AdminModal` เพื่อแสดง `QuotationForm`
2. `QuotationForm` เองก็สร้าง overlay พื้นหลังสีดำของตัวเอง

ทำให้เกิด overlay 2 ชั้นซ้อนกัน

### ผลกระทบ
- พื้นหลังดำเข้มเกินไป
- การกด backdrop อาจปิดผิด modal
- ปัญหา z-index ทำให้ dropdown/datepicker อาจถูกบัง
- Performance ลดลงเพราะ render ซ้ำซ้อน

### แนวทางแก้ไข
**ทางเลือก A (แนะนำ):** เพิ่ม prop `embedded` ให้ QuotationForm เพื่อปิด overlay ของตัวเอง เมื่อถูกใช้งานใน AdminModal  
**ทางเลือก B:** ใช้ QuotationForm แบบ standalone โดยไม่ต้องห่อด้วย AdminModal

---

## 7. เลือก Team/Owner เป็น Hardcode

### ตำแหน่งที่พบ
- `src/components/ProjectForm.tsx` (บรรทัด 96-103)
- `src/components/QuotationForm.tsx` (บรรทัด 85-92)
- `src/components/CustomerFormNew.tsx` (บรรทัด 94-98)

### ปัญหา
ตัวเลือก "ทีม" และ "ผู้รับผิดชอบ" เป็นข้อมูลคงที่ในโค้ด เช่น:
- ทีมขาย 1, ทีมขาย 2, ทีมขาย 3
- ทีมโปรเจคพิเศษ, ทีมลูกค้าองค์กร
- PU STAR Office, Trade Sales Team

บางหน้าดึงข้อมูล Admin จาก API แต่บางหน้าใช้ค่าคงที่

### ผลกระทบ
- เมื่อต้องการเพิ่ม/ลบ/แก้ไขทีม ต้องแก้โค้ดและ deploy ใหม่
- ข้อมูลไม่ตรงกันระหว่างหน้า
- ไม่สามารถจัดการผ่านหน้า Admin ได้

### แนวทางแก้ไข
- สร้าง API สำหรับดึงรายชื่อ Team และ Owner
- สร้างหน้า Settings สำหรับจัดการข้อมูล Team
- ใช้ข้อมูลจาก API แทนค่าคงที่ในทุกหน้า

---

## 8. ใช้ TypeScript และ JavaScript ปนกัน

### ตำแหน่งที่พบ
- `src/features/jubili/pages/Opportunities.jsx` (ไฟล์ JavaScript)
- `src/app/adminb2b/opportunities/page.tsx` มี `// @ts-nocheck`

### ปัญหา
โปรเจคส่วนใหญ่ใช้ TypeScript แต่มีไฟล์ JavaScript หลงเหลืออยู่:
- `Opportunities.jsx` เป็น JSX ไม่มี type safety
- หน้าที่เรียกใช้ต้องปิด TypeScript checking

### ผลกระทบ
- ไม่มี type safety ทำให้อาจเกิด runtime error
- IDE ไม่สามารถช่วย autocomplete ได้
- ยากต่อการ refactor
- ไม่ consistent กับส่วนอื่นของโปรเจค

### แนวทางแก้ไข
- แปลงไฟล์ `.jsx` เป็น `.tsx`
- เพิ่ม interface/type definitions
- ลบ `// @ts-nocheck` ออก
- ตรวจสอบว่ามีไฟล์ `.jsx` อื่นๆ หลงเหลืออีกหรือไม่

---

## 9. ตารางใน Opportunities ใช้สี hardcode

### ตำแหน่งที่พบ
- `src/features/jubili/pages/Opportunities.jsx` (บรรทัด 37-44)

### ปัญหา
ตาราง Opportunities ใช้สีหลายชุดที่กำหนดไว้ตายตัว:
- สีไอคอน 8 สี
- สีเส้นซ้าย 6 สี  
- สีพื้นหลัง column 13 สี

แต่ละ column ในแต่ละแถวมีสีพื้นหลังต่างกัน ทำให้ตารางดูเหมือนสเปรดชีต Excel ที่มีการไฮไลต์หลายสี

### ผลกระทบ
- ดูไม่เป็นมืออาชีพ
- สีไม่ได้สื่อความหมาย
- ยากต่อการอ่านข้อมูล
- ใช้ inline style แทน Tailwind classes

### แนวทางแก้ไข
- ลบสีพื้นหลังของ column ออก
- ใช้สีสำหรับเฉพาะสถานะ (เช่น ชนะ=เขียว, แพ้=แดง)
- ปรับให้ใช้ Tailwind classes แทน inline style
- ใช้ design ที่ clean และ minimal

---

## 10. ProductList ใช้ Framer Motion แต่หน้าอื่นไม่ใช้

### ตำแหน่งที่พบ
- `src/app/shop/components/ProductList.tsx` (ใช้ Framer Motion)
- หน้าอื่นๆ เช่น Dashboard, Customers, Products (ไม่ใช้)

### ปัญหา
เฉพาะหน้า Shop ใช้ Framer Motion สำหรับ animation:
- การ fade in ของ product cards
- hover scale effect
- tap effect

หน้าอื่นๆ ใช้ CSS transition ปกติ หรือไม่มี animation เลย

### ผลกระทบ
- Animation style ไม่สม่ำเสมอทั้งแอป
- bundle size ใหญ่ขึ้นเพราะ Framer Motion ถูก import
- บางหน้าดูมีชีวิตชีวา บางหน้าดูนิ่ง
- ประสบการณ์ผู้ใช้ไม่ consistent

### แนวทางแก้ไข
**ทางเลือก A:** ลบ Framer Motion ออก ใช้ CSS transition ทั้งหมด  
**ทางเลือก B:** ใช้ Framer Motion ทั้งแอปให้ consistent  
**ทางเลือก C:** สร้าง animation utility classes ที่ใช้ร่วมกัน

---

## 11. Product Image ใช้ placeholder ที่อาจไม่มีอยู่จริง

### ตำแหน่งที่พบ
- `src/app/shop/components/ProductList.tsx` (บรรทัด 88)

### ปัญหา
เมื่อสินค้าไม่มีรูปภาพ ระบบจะใช้รูป `/placeholder-image.jpg` แต่ไม่แน่ใจว่าไฟล์นี้มีอยู่จริงใน public folder หรือไม่

### ผลกระทบ
- ถ้าไม่มีไฟล์ จะแสดง broken image
- หน้าเว็บดูไม่สมบูรณ์
- ผู้ใช้อาจคิดว่าระบบมีปัญหา

### แนวทางแก้ไข
**ทางเลือก A:** ตรวจสอบและเพิ่มไฟล์ `/public/placeholder-image.jpg`  
**ทางเลือก B:** สร้าง Placeholder component แสดงไอคอนรูปภาพหรือข้อความ "ไม่มีรูป"  
**ทางเลือก C:** ใช้ Next.js Image placeholder blur feature  
**ทางเลือก D:** ใช้รูปจาก CDN เช่น placeholder.com หรือ placehold.co

---
