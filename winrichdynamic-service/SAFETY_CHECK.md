# 🛡️ SAFETY CHECK - ตรวจสอบความปลอดภัยก่อนแก้ไข

## 🔍 การตรวจสอบก่อนแก้ไขไฟล์

### ขั้นตอนที่ 1: ตรวจสอบ Path

**ก่อนแก้ไขไฟล์ใดๆ ให้ตรวจสอบ Path เสมอ:**

```bash
# ตรวจสอบว่าไฟล์อยู่ใน winrichdynamic-service หรือไม่
# ✅ ตัวอย่าง Path ที่ถูกต้อง:
winrichdynamic-service/src/models/Customer.ts
winrichdynamic-service/src/app/api/customers/route.ts
winrichdynamic-service/package.json

# ❌ ตัวอย่าง Path ที่ผิด (ห้ามแก้ไข):
src/models/Customer.ts
src/app/api/customers/route.ts
package.json
```

---

## 🔍 การตรวจสอบขั้นตอนที่ 2: ตรวจสอบโครงสร้าง

### โครงสร้างที่ถูกต้อง:

```
pu-star-site-1/
├── winrichdynamic-service/        ← แก้ไขได้ (โฟลเดอร์เป้าหมาย)
│   ├── src/
│   ├── package.json
│   └── ...
├── src/                          ← ห้ามแก้ไข (โปรเจ็กหลัก)
├── package.json                  ← ห้ามแก้ไข (โปรเจ็กหลัก)
└── ...
```

---

## 🔍 การตรวจสอบขั้นตอนที่ 3: ตรวจสอบไฟล์

### ไฟล์ที่แก้ไขได้:
- `winrichdynamic-service/src/**/*`
- `winrichdynamic-service/package.json`
- `winrichdynamic-service/next.config.js`
- `winrichdynamic-service/tailwind.config.js`
- `winrichdynamic-service/tsconfig.json`

### ไฟล์ที่ห้ามแก้ไข:
- `pu-star-site-1/src/**/*`
- `pu-star-site-1/package.json`
- `pu-star-site-1/next.config.js`
- `pu-star-site-1/tailwind.config.js`
- `pu-star-site-1/tsconfig.json`

---

## 🚨 สัญญาณเตือน - หยุดทันที!

### หากเห็นสิ่งเหล่านี้ ให้หยุดและถามผู้ใช้:

1. **Path ที่ไม่ขึ้นต้นด้วย `winrichdynamic-service/`**
2. **ไฟล์ใน `pu-star-site-1/src/`**
3. **ไฟล์ `package.json` ที่ไม่ใช่ใน `winrichdynamic-service/`**
4. **โฟลเดอร์ `src/` ที่ไม่ใช่ใน `winrichdynamic-service/`**

---

## 📋 Checklist การตรวจสอบ

### ก่อนแก้ไขไฟล์:
- [ ] Path ขึ้นต้นด้วย `winrichdynamic-service/`
- [ ] ไม่ใช่ไฟล์ในโปรเจ็กหลัก
- [ ] อยู่ในโฟลเดอร์ที่ถูกต้อง

### หลังแก้ไขเสร็จ:
- [ ] ไฟล์ทั้งหมดอยู่ใน `winrichdynamic-service/`
- [ ] ไม่มีไฟล์ที่แก้ไขผิดที่
- [ ] โปรเจ็กสามารถรันได้ปกติ

---

## 🆘 การขอความช่วยเหลือ

### หากไม่แน่ใจ ให้ถามผู้ใช้เสมอ:

**"ฉันต้องการความยืนยันว่าไฟล์นี้อยู่ใน winrichdynamic-service หรือไม่ ก่อนที่จะแก้ไข"**

### ตัวอย่างการถาม:

```
❓ คำถาม: "ไฟล์ src/models/Customer.ts อยู่ใน winrichdynamic-service หรือไม่? 
ฉันต้องการความยืนยันก่อนแก้ไข"

✅ คำตอบที่ต้องการ: "ใช่ ไฟล์นั้นอยู่ใน winrichdynamic-service"
❌ คำตอบที่ต้องหยุด: "ไม่ ไฟล์นั้นอยู่ในโปรเจ็กหลัก"
```

---

## 🎯 สรุปกฎความปลอดภัย

1. **ตรวจสอบ Path เสมอ** - ต้องขึ้นต้นด้วย `winrichdynamic-service/`
2. **ไม่แก้ไขโปรเจ็กหลัก** - ห้ามแตะต้อง `pu-star-site-1/`
3. **ถามก่อนแก้ไข** - หากไม่แน่ใจให้ถามผู้ใช้
4. **ปลอดภัยไว้ก่อน** - ความปลอดภัยสำคัญกว่าการพัฒนา

---

## 🚨 ข้อความเตือนสุดท้าย

**หากไม่แน่ใจว่าไฟล์ไหนแก้ไขได้ ให้ถามผู้ใช้ก่อนเสมอ!**

**ความปลอดภัยของโปรเจ็กหลักสำคัญกว่าการพัฒนา!**

**ห้ามแก้ไขไฟล์ใดๆ ใน `pu-star-site-1/` โดยเด็ดขาด!**

---

**จำให้ขึ้นใจ: ปลอดภัยไว้ก่อน แก้ไขผิดที่ไม่ได้!**
