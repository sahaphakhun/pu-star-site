# การ Debug ปัญหา JWT Token - B2B Service

## 🐛 ปัญหาที่พบ

**อาการ:** หลังจากล็อกอินสำเร็จ ไปสร้างสินค้าแล้วเด้งกลับไปหน้า login

**สาเหตุที่อาจเป็นไปได้:**
1. JWT token ไม่ถูกส่งไปกับ API request
2. API products ไม่ได้ตรวจสอบ token
3. Token verification ล้มเหลว
4. Build ใหม่แล้วแต่ยังไม่ได้ deploy

## 🔧 สิ่งที่แก้ไขแล้ว

### 1. **สร้างไฟล์ auth.ts**
- ✅ ฟังก์ชัน `verifyToken()` สำหรับตรวจสอบ JWT token
- ✅ ใช้ `jose` library เดียวกับที่สร้าง token
- ✅ ตรวจสอบ token expiration และ payload

### 2. **แก้ไข API products**
- ✅ เพิ่ม `verifyToken()` ใน POST method
- ✅ เพิ่ม debug logging
- ✅ ส่งข้อมูล admin กลับไป

### 3. **เพิ่ม Debug Logging**
- ✅ หน้า products - log token และ request
- ✅ API products - log headers และ auth result
- ✅ auth.ts - log token verification process

## 🚀 วิธีทดสอบ

### **1. ล็อกอินใหม่**
```bash
# ไปที่หน้า login
https://www.b2b.winrichdynamic.com/adminb2b/login

# กรอกเบอร์: 0995429353
# รอรับ OTP และกรอก
# ตรวจสอบ console log
```

### **2. ตรวจสอบ Token**
```javascript
// ใน browser console
console.log('Token:', localStorage.getItem('b2b_auth_token'));
// ควรเห็น token ยาวๆ
```

### **3. ไปหน้า Products**
```bash
# ไปที่หน้า products
https://www.b2b.winrichdynamic.com/adminb2b/products

# ตรวจสอบ console log
# ควรเห็น: [B2B] Token from localStorage: exists
```

### **4. ลองสร้างสินค้า**
```javascript
// กรอกข้อมูลสินค้า
// กดสร้างสินค้า
// ตรวจสอบ console log
```

## 📋 Debug Logs ที่ควรเห็น

### **หน้า Products (Frontend)**
```
[B2B] Token from localStorage: exists
[B2B] Sending request to /api/products with token
[B2B] Form data: {...}
[B2B] Response status: 201
[B2B] Response result: {...}
```

### **API Products (Backend)**
```
[B2B] POST /api/products - Starting request
[B2B] Request headers: {...}
[B2B] Auth result: { valid: true, adminId: "...", ... }
[B2B] Auth successful for admin: ...
[B2B] Product created successfully: ...
```

### **Auth.ts (Token Verification)**
```
[B2B] verifyToken - Starting verification
[B2B] Authorization header: Bearer eyJ...
[B2B] Token extracted: eyJhbGciOiJIUzI1NiI...
```

## 🔍 หากยังมีปัญหา

### **1. ตรวจสอบ Token ใน localStorage**
```javascript
// ใน browser console
localStorage.getItem('b2b_auth_token')
// ควรเห็น token ยาวๆ ไม่ใช่ null
```

### **2. ตรวจสอบ Network Tab**
- เปิด Developer Tools > Network
- ลองสร้างสินค้า
- ดู request ไป `/api/products`
- ตรวจสอบ Authorization header

### **3. ตรวจสอบ Console Logs**
- ดู error messages
- ดู debug logs ที่เพิ่มเข้าไป
- ตรวจสอบ response status

### **4. ตรวจสอบ Railway Logs**
- ไปที่ Railway dashboard
- ดู logs ของ B2B service
- ตรวจสอบ error messages

## 🛠️ การแก้ไขเพิ่มเติม

### **หาก Token ไม่มีใน localStorage**
- ตรวจสอบหน้า login ว่าส่ง token กลับมาหรือไม่
- ตรวจสอบ response จาก `/api/auth/verify-otp`

### **หาก API ยังไม่ทำงาน**
- ตรวจสอบว่า build ใหม่แล้วหรือยัง
- ตรวจสอบ Railway deployment
- ตรวจสอบ environment variables

### **หาก Token Verification ล้มเหลว**
- ตรวจสอบ JWT_SECRET
- ตรวจสอบ token format
- ตรวจสอบ token expiration

## 📝 หมายเหตุ

- **JWT Token Expiration:** 24 ชั่วโมง
- **Token Storage:** localStorage (`b2b_auth_token`)
- **API Headers:** `Authorization: Bearer <token>`
- **Debug Logs:** เพิ่มแล้วในทุกส่วน

---

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากแก้ไขแล้ว ระบบควร:
1. ✅ ล็อกอินสำเร็จและได้ JWT token
2. ✅ เก็บ token ใน localStorage
3. ✅ ส่ง token ไปกับ API request
4. ✅ API products ตรวจสอบ token สำเร็จ
5. ✅ สร้างสินค้าได้โดยไม่เด้งกลับหน้า login

**หากยังมีปัญหา กรุณาแจ้ง console logs และ error messages ที่เห็น**
