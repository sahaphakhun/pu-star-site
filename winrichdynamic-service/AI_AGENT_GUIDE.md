# 🤖 AI Agent Development Guide

## ⚠️ สิ่งสำคัญที่ต้องรู้ก่อนเริ่มพัฒนา

**ห้ามแก้ไขไฟล์ในโปรเจ็กหลัก `pu-star-site-1` โดยเด็ดขาด!**

### 🎯 โปรเจ็กที่ต้องพัฒนา:
- **โฟลเดอร์เป้าหมาย**: `winrichdynamic-service/` เท่านั้น
- **ห้ามแก้ไข**: โปรเจ็กหลัก `pu-star-site-1/` (ยกเว้นโฟลเดอร์ `winrichdynamic-service/`)

---

## 📁 โครงสร้างโปรเจ็กที่ถูกต้อง

```
pu-star-site-1/                    ← โปรเจ็กหลัก (ห้ามแก้ไข)
├── winrichdynamic-service/        ← โปรเจ็กที่ต้องพัฒนา (แก้ไขได้)
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── ...
├── src/                          ← โปรเจ็กหลัก (ห้ามแก้ไข)
├── package.json                  ← โปรเจ็กหลัก (ห้ามแก้ไข)
└── ...
```

---

## 🔒 กฎการพัฒนา

### ✅ สิ่งที่ทำได้:
1. **แก้ไขไฟล์ใน `winrichdynamic-service/`** เท่านั้น
2. **สร้างไฟล์ใหม่ใน `winrichdynamic-service/`**
3. **อัพเดท dependencies ใน `winrichdynamic-service/package.json`**

### ❌ สิ่งที่ห้ามทำ:
1. **แก้ไขไฟล์ในโปรเจ็กหลัก** (นอกเหนือจาก `winrichdynamic-service/`)
2. **แก้ไข `pu-star-site-1/package.json`**
3. **แก้ไข `pu-star-site-1/src/`**
4. **แก้ไขไฟล์ configuration ของโปรเจ็กหลัก**

---

## 🛠️ การพัฒนา Phase 1: Billing & Quotation

### 1. สร้าง Models ใน `winrichdynamic-service/src/models/`:
- `Customer.ts` - ข้อมูลลูกค้า
- `Quotation.ts` - ใบเสนอราคา
- `Product.ts` - สินค้า

### 2. สร้าง API Routes ใน `winrichdynamic-service/src/app/api/`:
- `/api/customers` - จัดการลูกค้า
- `/api/quotations` - จัดการใบเสนอราคา
- `/api/products` - จัดการสินค้า

### 3. สร้าง Components ใน `winrichdynamic-service/src/components/`:
- `CustomerForm.tsx` - ฟอร์มลูกค้า
- `QuotationForm.tsx` - ฟอร์มใบเสนอราคา
- `ProductSelector.tsx` - เลือกสินค้า

### 4. สร้าง Pages ใน `winrichdynamic-service/src/app/`:
- `/admin/customers` - จัดการลูกค้า
- `/admin/quotations` - จัดการใบเสนอราคา
- `/admin/products` - จัดการสินค้า

---

## 📝 ตัวอย่างการสร้างไฟล์

### ✅ ถูกต้อง - สร้างใน winrichdynamic-service:
```typescript
// winrichdynamic-service/src/models/Customer.ts
import mongoose from 'mongoose';

export interface ICustomer {
  name: string;
  taxId: string;
  // ... properties
}

const customerSchema = new mongoose.Schema<ICustomer>({
  // ... schema definition
});

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);
```

### ❌ ผิด - ห้ามสร้างในโปรเจ็กหลัก:
```typescript
// pu-star-site-1/src/models/Customer.ts ← ห้ามทำ!
```

---

## 🔍 การตรวจสอบก่อนแก้ไข

### ก่อนแก้ไฟล์ใดๆ ให้ตรวจสอบ:

1. **Path ที่ถูกต้อง**: ไฟล์ต้องอยู่ใน `winrichdynamic-service/`
2. **ไม่ใช่ไฟล์ของโปรเจ็กหลัก**: ตรวจสอบว่าไม่ใช่ไฟล์ใน `pu-star-site-1/src/`
3. **โฟลเดอร์ที่ถูกต้อง**: ตรวจสอบว่าแก้ไขในโฟลเดอร์ที่ถูกต้อง

---

## 📋 Checklist การพัฒนา

### ก่อนเริ่มพัฒนา:
- [ ] ตรวจสอบว่าแก้ไขใน `winrichdynamic-service/` เท่านั้น
- [ ] ไม่ได้แก้ไฟล์ในโปรเจ็กหลัก
- [ ] สร้างไฟล์ใหม่ในโฟลเดอร์ที่ถูกต้อง

### หลังพัฒนาเสร็จ:
- [ ] ตรวจสอบว่าไฟล์ทั้งหมดอยู่ใน `winrichdynamic-service/`
- [ ] ไม่มีไฟล์ที่แก้ไขผิดที่
- [ ] โปรเจ็กสามารถรันได้ปกติ

---

## 🚨 สัญญาณเตือน

### หากเห็นสิ่งเหล่านี้ ให้หยุดทันที:
- Path ที่ขึ้นต้นด้วย `pu-star-site-1/src/` (นอกเหนือจาก `winrichdynamic-service/`)
- ไฟล์ `package.json` ที่ไม่ใช่ใน `winrichdynamic-service/`
- โฟลเดอร์ `src/` ที่ไม่ใช่ใน `winrichdynamic-service/`

---

## 📞 การขอความช่วยเหลือ

หากไม่แน่ใจว่าไฟล์ไหนแก้ได้ ให้ถามผู้ใช้ก่อนเสมอ:

**"ไฟล์นี้อยู่ใน winrichdynamic-service หรือไม่? ฉันต้องการความยืนยันก่อนแก้ไข"**

---

## 🎯 สรุป

**จำให้ขึ้นใจ: แก้ไขเฉพาะใน `winrichdynamic-service/` เท่านั้น!**

- ✅ `winrichdynamic-service/src/models/` - แก้ไขได้
- ✅ `winrichdynamic-service/src/app/` - แก้ไขได้
- ❌ `pu-star-site-1/src/` - ห้ามแก้ไข
- ❌ `pu-star-site-1/package.json` - ห้ามแก้ไข

**ความปลอดภัยของโปรเจ็กหลักสำคัญกว่าการพัฒนา!**
