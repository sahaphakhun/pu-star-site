# การตั้งค่า Facebook App เพื่อแก้ปัญหาการส่งรูปภาพ

## ปัญหาที่เกิดขึ้น
```
(#100) เซิร์ฟเวอร์ไม่สามารถเข้าถึงได้จาก robots.txt ให้คุณเป็นผู้ครอบครองเว็บไซต์ 
ลองเพิ่มไฟล์ robots.txt ให้กับ Meta ในการตั้งค่าที่อนุญาตให้เซิร์ฟเวอร์เข้าถึงได้
```

## ไฟล์ที่สร้างขึ้นแล้ว
1. **`public/robots.txt`** - อนุญาตให้ Facebook crawlers เข้าถึงได้
2. **`public/sitemap.xml`** - ช่วยให้ Facebook เข้าใจโครงสร้างเว็บไซต์
3. **`public/verification.txt`** - สำหรับ Facebook App verification

## ขั้นตอนการตั้งค่า Facebook App

### 1. ไปที่ Facebook Developers
- เข้าไปที่ [developers.facebook.com](https://developers.facebook.com)
- เลือก App ของคุณ (ID: 1150008753538160)

### 2. ตั้งค่า App Domains
- ไปที่ **App Settings** > **Basic**
- ในส่วน **App Domains** ให้ใส่ domain ของคุณ (เช่น: `yourdomain.com`)
- **ไม่ต้องใส่** `http://` หรือ `https://`

### 3. เพิ่ม Platform
- ไปที่ **App Settings** > **Basic**
- คลิก **Add Platform**
- เลือก **Website**
- ใส่ **Site URL** (เช่น: `https://yourdomain.com`)

### 4. ตั้งค่า Messenger
- ไปที่ **Messenger** > **Settings**
- ในส่วน **Webhooks** ให้ตรวจสอบว่า URL ถูกต้อง
- ตรวจสอบว่า **Verify Token** ตรงกับที่ตั้งไว้ในโค้ด

### 5. ตรวจสอบ App Review Status
- ไปที่ **App Review** > **App Review**
- ตรวจสอบว่า App ได้รับการอนุมัติแล้ว
- ถ้ายังไม่ได้รับอนุมัติ ให้ส่งคำขอ

### 6. ตรวจสอบ Permissions
- ไปที่ **App Review** > **Permissions and Features**
- ตรวจสอบว่าได้รับ permissions ที่จำเป็นแล้ว:
  - `pages_messaging`
  - `pages_messaging_subscriptions`
  - `pages_show_list`

## การแก้ไขปัญหาเพิ่มเติม

### 1. ตรวจสอบ Domain Verification
- ไปที่ **App Settings** > **Basic**
- ในส่วน **App Domains** ต้องมี domain ที่ถูกต้อง
- ตรวจสอบว่า domain ได้รับการยืนยันแล้ว

### 2. ตรวจสอบ SSL Certificate
- เว็บไซต์ต้องมี SSL certificate ที่ถูกต้อง
- URL ต้องเริ่มต้นด้วย `https://`

### 3. ตรวจสอบ Robots.txt
- ไฟล์ `robots.txt` ต้องสามารถเข้าถึงได้ที่ `https://yourdomain.com/robots.txt`
- ต้องอนุญาตให้ Facebook crawlers เข้าถึงได้

### 4. ตรวจสอบ Image URLs
- รูปภาพต้องมาจาก domain ที่มี robots.txt ที่เหมาะสม
- หลีกเลี่ยงการใช้รูปภาพจาก `i.ibb.co` หรือบริการที่คล้ายกัน
- ใช้รูปภาพจากเว็บไซต์ของคุณเองหรือ CDN ที่เชื่อถือได้

## การทดสอบ

### 1. ทดสอบ Webhook
```bash
curl -X POST "https://yourdomain.com/api/messenger/webhook" \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[{"id":"test","time":1234567890}]}'
```

### 2. ทดสอบ Robots.txt
```bash
curl "https://yourdomain.com/robots.txt"
```

### 3. ทดสอบ Sitemap
```bash
curl "https://yourdomain.com/sitemap.xml"
```

## หมายเหตุสำคัญ
- การเปลี่ยนแปลงการตั้งค่าอาจใช้เวลาหลายนาทีถึงหลายชั่วโมง
- ตรวจสอบ Facebook App Dashboard เป็นประจำ
- ถ้ายังมีปัญหา ให้ตรวจสอบ Facebook App Review status
- ใช้รูปภาพจาก domain ของคุณเองจะดีที่สุด

## ติดต่อ Support
- Facebook Developer Support: [developers.facebook.com/support](https://developers.facebook.com/support)
- Facebook Business Support: [business.facebook.com/support](https://business.facebook.com/support)
