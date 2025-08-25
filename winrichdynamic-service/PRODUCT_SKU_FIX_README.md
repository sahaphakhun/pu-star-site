# การแก้ไขปัญหา Product SKU Duplicate Key Error

## 🚨 ปัญหาที่เกิดขึ้น

```
[MongoServerError: E11000 duplicate key error collection: test.products index: sku_1 dup key: { sku: null }]
```

**สาเหตุของปัญหา:**
- MongoDB collection มี unique index บน field `sku` 
- แต่ Product model ไม่ได้กำหนด field `sku` หลัก
- เมื่อสร้าง product ใหม่ MongoDB พยายามใส่ `null` ใน field `sku` ซึ่งขัดกับ unique constraint

## 🔧 การแก้ไข

### 1. อัปเดต Product Model

**ไฟล์:** `src/models/Product.ts`

**การเปลี่ยนแปลง:**
- เพิ่ม field `sku: string` ใน interface `IProduct`
- เพิ่ม field `sku` ใน Schema พร้อม unique constraint
- เพิ่ม pre-save middleware สำหรับ auto-generate SKU
- แก้ไข index ให้ถูกต้อง

**รายละเอียด:**
```typescript
// เพิ่ม field sku หลัก
sku: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  index: true
}

// เพิ่ม unique index
ProductSchema.index({ sku: 1 }, { unique: true });

// เพิ่ม pre-save middleware
ProductSchema.pre('save', async function(next) {
  // Auto-generate SKU ถ้าไม่มี
  if (!this.sku) {
    this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  }
  next();
});
```

### 2. อัปเดต Product Schema

**ไฟล์:** `src/schemas/product.ts`

**การเปลี่ยนแปลง:**
- เพิ่ม field `sku` เป็น optional ใน validation schema

```typescript
export const productSchema = z.object({
  // ... existing fields
  sku: z.string().min(1, 'SKU ไม่สามารถว่างได้').optional(),
  // ... existing fields
});
```

### 3. อัปเดต ProductForm Component

**ไฟล์:** `src/components/ProductForm.tsx`

**การเปลี่ยนแปลง:**
- เพิ่ม state สำหรับ field `sku`
- เพิ่ม UI input field สำหรับ SKU
- อัปเดต form submission logic

```typescript
// เพิ่ม state
const [sku, setSku] = useState(initialData?.sku || '');

// เพิ่ม UI field
<div>
  <label>SKU (รหัสสินค้า)</label>
  <input
    type="text"
    value={sku}
    onChange={(e) => setSku(e.target.value)}
    placeholder="เช่น PRD-001 หรือปล่อยว่างเพื่อ auto-generate"
  />
  <p>ปล่อยว่างเพื่อให้ระบบสร้าง SKU อัตโนมัติ</p>
</div>

// อัปเดต form data
const productData: CreateProduct = {
  // ... existing fields
  sku: sku.trim() || undefined,
  // ... existing fields
};
```

## 🚀 การ Deploy และ Migration

### 1. Deploy โค้ดใหม่

```bash
# Build และ deploy
npm run build
npm start
```

### 2. รัน Migration Script

**สร้างไฟล์:** `src/scripts/fix-product-sku.js`

**รัน script:**
```bash
# ติดตั้ง mongodb driver ถ้ายังไม่มี
npm install mongodb

# รัน migration script
node src/scripts/fix-product-sku.js
```

**สิ่งที่ script ทำ:**
- ตรวจสอบ products ที่ไม่มี SKU
- สร้าง SKU ใหม่สำหรับ products ที่ไม่มี
- แก้ไข SKU ที่ซ้ำ
- สร้าง unique index บน field `sku`

### 3. ตรวจสอบผลลัพธ์

```bash
# ตรวจสอบ logs
tail -f logs/app.log

# ตรวจสอบฐานข้อมูล
mongo
use winrichdynamic
db.products.find({}, {sku: 1, name: 1}).limit(10)
```

## ✅ การตรวจสอบ

### 1. ตรวจสอบ Model

```typescript
// ตรวจสอบว่า field sku มีอยู่
const product = new Product({
  name: 'Test Product',
  description: 'Test Description',
  imageUrl: 'test.jpg',
  category: 'test'
});

console.log(product.sku); // ควรมีค่า SKU ที่ auto-generate
```

### 2. ตรวจสอบ Database

```javascript
// ตรวจสอบ index
db.products.getIndexes()

// ตรวจสอบ unique constraint
db.products.createIndex({ sku: 1 }, { unique: true })
```

### 3. ทดสอบการสร้าง Product

```bash
# ทดสอบสร้าง product ใหม่ผ่าน API
curl -X POST /api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Test Description",
    "imageUrl": "test.jpg",
    "category": "test"
  }'
```

## 🐛 การแก้ไขปัญหาเพิ่มเติม

### 1. ถ้ายังเกิด Duplicate Key Error

```bash
# ตรวจสอบ products ที่มี SKU ซ้ำ
db.products.aggregate([
  { $group: { _id: '$sku', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

# ลบ index ที่มีปัญหา
db.products.dropIndex('sku_1')

# สร้าง index ใหม่
db.products.createIndex({ sku: 1 }, { unique: true })
```

### 2. ถ้า Auto-generate SKU ไม่ทำงาน

```typescript
// ตรวจสอบ pre-save middleware
ProductSchema.pre('save', async function(next) {
  console.log('Pre-save middleware triggered');
  console.log('Current SKU:', this.sku);
  
  if (!this.sku) {
    this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    console.log('Generated SKU:', this.sku);
  }
  
  next();
});
```

## 📋 Checklist

- [ ] อัปเดต Product Model
- [ ] อัปเดต Product Schema  
- [ ] อัปเดต ProductForm Component
- [ ] Deploy โค้ดใหม่
- [ ] รัน Migration Script
- [ ] ตรวจสอบ unique index
- [ ] ทดสอบการสร้าง product ใหม่
- [ ] ตรวจสอบ logs และ error

## 🔗 ไฟล์ที่เกี่ยวข้อง

- `src/models/Product.ts` - Product Model
- `src/schemas/product.ts` - Product Schema
- `src/components/ProductForm.tsx` - Product Form Component
- `src/scripts/fix-product-sku.js` - Migration Script
- `src/app/api/products/route.ts` - Products API

## 📞 การติดต่อ

หากพบปัญหาหรือต้องการความช่วยเหลือเพิ่มเติม กรุณาติดต่อทีมพัฒนา

---

**หมายเหตุ:** การแก้ไขนี้จะทำให้ระบบสามารถสร้าง product ใหม่ได้โดยไม่มี duplicate key error และจะ auto-generate SKU สำหรับ products ที่ไม่มี SKU
