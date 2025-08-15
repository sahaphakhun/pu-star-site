# การแก้ไขปัญหาการเพิ่มสินค้าลงตะกร้าบนมือถือ

## ปัญหาที่พบ
ผู้ใช้บนมือถือกดเพิ่มสินค้าในฟอร์มสั่งซื้อหน้า shop แล้วมันขึ้นว่า "เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า"

## สาเหตุของปัญหา
1. **การจัดการตะกร้าสินค้าไม่สอดคล้องกัน**: มีการจัดการตะกร้าสินค้าสองแบบที่แตกต่างกัน
   - หน้า product detail ใช้ localStorage แบบ array
   - หน้า shop ใช้ localStorage แบบ object
2. **การจัดการ localStorage ไม่ปลอดภัย**: ไม่มีการตรวจสอบการเข้าถึง localStorage บนมือถือ
3. **การจัดการ error ไม่ครอบคลุม**: ไม่มีการจัดการ error ที่เหมาะสมสำหรับปัญหาบนมือถือ

## การแก้ไขที่ทำ

### 1. สร้าง Utility Functions สำหรับการจัดการตะกร้าสินค้า
- สร้างไฟล์ `src/utils/cartUtils.ts`
- เพิ่มการตรวจสอบการเข้าถึง localStorage อย่างปลอดภัย
- รองรับทั้งรูปแบบ array เก่าและ object ใหม่
- เพิ่มการตรวจสอบการเชื่อมต่ออินเทอร์เน็ต

### 2. แก้ไขการจัดการตะกร้าสินค้าในหน้า Product Detail
- อัปเดต `src/app/products/[id]/page.tsx`
- ใช้ utility function ใหม่แทนการจัดการ localStorage โดยตรง
- เพิ่มการตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ปรับปรุงการแสดง toast ให้เหมาะสมกับมือถือ

### 3. แก้ไขการจัดการตะกร้าสินค้าในหน้า Cart
- อัปเดต `src/app/cart/page.tsx`
- ใช้ utility function ใหม่
- รองรับการแปลงข้อมูลระหว่างรูปแบบ array และ object

### 4. แก้ไขการจัดการตะกร้าสินค้าในหน้า Shop
- อัปเดต `src/app/(shop)/shop/page.tsx`
- ใช้ utility function ใหม่
- เพิ่มการจัดการ error ที่ดีขึ้น

## ฟีเจอร์ที่เพิ่มเข้ามา

### 1. การตรวจสอบการเข้าถึง localStorage
```typescript
export const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    if (!isOnline()) {
      console.warn('ไม่มีการเชื่อมต่ออินเทอร์เน็ต');
      return false;
    }
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};
```

### 2. การตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
```typescript
export const isOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};
```

### 3. การจัดการตะกร้าสินค้าที่ปลอดภัย
```typescript
export const addToCart = (
  product: any,
  quantity: number,
  selectedOptions?: {[key: string]: string},
  unitLabel?: string,
  unitPrice?: number
): boolean => {
  try {
    const cart = getCartFromStorage();
    const cartKey = generateCartKey(product._id, selectedOptions, unitLabel);
    
    if (cart[cartKey]) {
      cart[cartKey] = {
        ...cart[cartKey],
        quantity: cart[cartKey].quantity + quantity
      };
    } else {
      cart[cartKey] = {
        product: product,
        quantity: quantity,
        selectedOptions: selectedOptions || {},
        unitLabel: unitLabel,
        unitPrice: unitPrice,
      };
    }
    
    return saveCartToStorage(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};
```

## การปรับปรุงการแสดงผล

### 1. Toast Messages ที่เหมาะสมกับมือถือ
- ปรับขนาดและ layout ให้เหมาะสมกับหน้าจอมือถือ
- เพิ่มการ truncate ข้อความยาว
- ปรับ padding และ maxWidth

### 2. Error Messages ที่ชัดเจน
- แยกประเภท error ตามสาเหตุ
- แสดงข้อความที่เข้าใจง่าย
- เพิ่มคำแนะนำในการแก้ไข

## การทดสอบ
1. ทดสอบการเพิ่มสินค้าลงตะกร้าบนมือถือ
2. ทดสอบการเพิ่มสินค้าที่มีตัวเลือกและหน่วย
3. ทดสอบการเพิ่มสินค้าเมื่อไม่มีอินเทอร์เน็ต
4. ทดสอบการเพิ่มสินค้าเมื่อ localStorage ไม่สามารถใช้งานได้

## ผลลัพธ์ที่คาดหวัง
- การเพิ่มสินค้าลงตะกร้าบนมือถือทำงานได้ปกติ
- ไม่มีข้อผิดพลาด "เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า"
- การแสดงผลเหมาะสมกับหน้าจอมือถือ
- การจัดการ error ชัดเจนและเป็นประโยชน์
