# 🚨 DEVELOPMENT RULES - กฎการพัฒนาที่ต้องปฏิบัติตาม

## ⚠️ กฎข้อที่ 1: ห้ามแก้ไขโปรเจ็กหลัก

**ห้ามแก้ไขไฟล์ใดๆ ใน `pu-star-site-1/` โดยเด็ดขาด!**

### โปรเจ็กที่ห้ามแก้ไข:
- `pu-star-site-1/src/` ← ห้ามแก้ไข
- `pu-star-site-1/package.json` ← ห้ามแก้ไข
- `pu-star-site-1/next.config.js` ← ห้ามแก้ไข
- `pu-star-site-1/tailwind.config.js` ← ห้ามแก้ไข
- `pu-star-site-1/tsconfig.json` ← ห้ามแก้ไข

### โปรเจ็กที่แก้ได้:
- `pu-star-site-1/winrichdynamic-service/` ← แก้ได้

---

## ⚠️ กฎข้อที่ 2: ตรวจสอบ Path เสมอ

### ก่อนแก้ไฟล์ใดๆ ให้ตรวจสอบ:

```bash
# ✅ ถูกต้อง - แก้ไขได้
winrichdynamic-service/src/models/Customer.ts
winrichdynamic-service/src/app/api/customers/route.ts
winrichdynamic-service/package.json

# ❌ ผิด - ห้ามแก้ไข
src/models/Customer.ts
src/app/api/customers/route.ts
package.json
```

---

## ⚠️ กฎข้อที่ 3: ใช้ Absolute Path

### ในการอ้างอิงไฟล์ ให้ใช้:

```typescript
// ✅ ถูกต้อง
import { Customer } from '@/models/Customer'
import { QuotationForm } from '@/components/QuotationForm'

// ❌ ผิด - อย่าใช้ relative path ที่อาจสับสน
import { Customer } from '../../../models/Customer'
```

---

## ⚠️ กฎข้อที่ 4: สร้างไฟล์ใหม่ในที่ที่ถูกต้อง

### โครงสร้างที่ถูกต้อง:

```
winrichdynamic-service/
├── src/
│   ├── models/           ← สร้าง Models ใหม่
│   ├── app/
│   │   ├── api/         ← สร้าง API Routes ใหม่
│   │   └── admin/       ← สร้าง Admin Pages ใหม่
│   ├── components/       ← สร้าง Components ใหม่
│   ├── lib/             ← สร้าง Libraries ใหม่
│   ├── types/           ← สร้าง Types ใหม่
│   └── utils/           ← สร้าง Utilities ใหม่
├── public/               ← สร้าง Static Files ใหม่
└── package.json          ← อัพเดท Dependencies
```

---

## ⚠️ กฎข้อที่ 5: ตรวจสอบก่อน Commit

### ก่อน Push Code ให้ตรวจสอบ:

1. **ไม่มีไฟล์ที่แก้ไขในโปรเจ็กหลัก**
2. **ไฟล์ทั้งหมดอยู่ใน `winrichdynamic-service/`**
3. **ไม่มีการเปลี่ยนแปลงใน `pu-star-site-1/`**

---

## 🚨 สัญญาณเตือน - หยุดทันที!

### หากเห็นสิ่งเหล่านี้ ให้หยุดและถามผู้ใช้:

- ไฟล์ใน `pu-star-site-1/src/`
- ไฟล์ `package.json` ที่ไม่ใช่ใน `winrichdynamic-service/`
- โฟลเดอร์ `src/` ที่ไม่ใช่ใน `winrichdynamic-service/`
- Path ที่ไม่ขึ้นต้นด้วย `winrichdynamic-service/`

---

## 📋 Checklist การตรวจสอบ

### ก่อนเริ่มพัฒนา:
- [ ] ตรวจสอบว่าแก้ไขใน `winrichdynamic-service/` เท่านั้น
- [ ] ไม่ได้แก้ไขไฟล์ในโปรเจ็กหลัก
- [ ] สร้างไฟล์ใหม่ในโฟลเดอร์ที่ถูกต้อง

### หลังพัฒนาเสร็จ:
- [ ] ตรวจสอบว่าไฟล์ทั้งหมดอยู่ใน `winrichdynamic-service/`
- [ ] ไม่มีไฟล์ที่แก้ไขผิดที่
- [ ] โปรเจ็กสามารถรันได้ปกติ

---

## 🎯 สรุปกฎสำคัญ

1. **แก้ไขเฉพาะใน `winrichdynamic-service/`**
2. **ห้ามแตะต้องโปรเจ็กหลัก `pu-star-site-1/`**
3. **ตรวจสอบ Path เสมอก่อนแก้ไข**
4. **หากไม่แน่ใจ ให้ถามผู้ใช้ก่อน**
5. **ความปลอดภัยของโปรเจ็กหลักสำคัญที่สุด**

---

## 📞 การขอความช่วยเหลือ

หากไม่แน่ใจ ให้ถามผู้ใช้เสมอ:

**"ฉันต้องการความยืนยันว่าไฟล์นี้อยู่ใน winrichdynamic-service หรือไม่ ก่อนที่จะแก้ไข"**

---

**จำให้ขึ้นใจ: ปลอดภัยไว้ก่อน แก้ไขผิดที่ไม่ได้!**
