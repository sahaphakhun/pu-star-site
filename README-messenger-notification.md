# ระบบแจ้งเตือนแบบคู่ (SMS + Messenger)

## ภาพรวม

ระบบนี้เชื่อมต่อการแจ้งเตือนระหว่าง SMS และ Facebook Messenger เพื่อให้ลูกค้าสามารถรับการแจ้งเตือนผ่านทั้งสองช่องทางพร้อมกัน

## คุณสมบัติหลัก

### 1. การยืนยันตัวตน
- ลูกค้าสามารถยืนยันตัวตนผ่านเบอร์โทรศัพท์และ OTP ใน Messenger Bot
- ระบบจะเชื่อมโยง PSID (Page-Scoped ID) กับเบอร์โทรศัพท์
- ข้อมูลจะถูกเก็บใน `MessengerUser` model

### 2. การแจ้งเตือนแบบคู่
- **Order Confirmation**: แจ้งเตือนเมื่อมีการสั่งซื้อสำเร็จ
- **Shipping Notification**: แจ้งเตือนเมื่อสินค้าถูกจัดส่งพร้อมเลขพัสดุ
- **Custom Messages**: ส่งข้อความแจ้งเตือนทั่วไป

### 3. ฟีเจอร์ใน Messenger Bot
- **My Orders**: ดูประวัติคำสั่งซื้อย้อนหลัง 10 รายการล่าสุด
- **Quick Replies**: ปุ่มลัดสำหรับการนำทางที่สะดวก
- **Real-time Notifications**: รับการแจ้งเตือนทันทีใน Messenger

## API Endpoints

### 1. Messenger Notifications
```
POST /api/notification/messenger
```
ส่งการแจ้งเตือนผ่าน Messenger เท่านั้น

### 2. Dual Notifications
```
POST /api/notification/dual
```
ส่งการแจ้งเตือนผ่านทั้ง SMS และ Messenger พร้อมกัน

### 3. SMS Notifications (เดิม)
```
POST /api/notification/sms
```
ส่งการแจ้งเตือนผ่าน SMS เท่านั้น

## การใช้งานในโค้ด

### 1. ส่งการแจ้งเตือนแบบคู่
```typescript
import { sendDualOrderConfirmation, sendDualShippingNotification } from '@/app/notification';

// Order confirmation
await sendDualOrderConfirmation(phoneNumber, orderNumber, totalAmount);

// Shipping notification
await sendDualShippingNotification(phoneNumber, orderNumber, trackingNumber, courier);
```

### 2. ส่งการแจ้งเตือนผ่าน Messenger เท่านั้น
```typescript
import { sendMessengerNotification } from '@/app/notification';

await sendMessengerNotification(phoneNumber, message);
```

## ข้อดีของระบบ

### 1. ความน่าเชื่อถือ
- หากการส่งผ่านช่องทางหนึ่งล้มเหลว อีกช่องทางยังสามารถส่งได้
- มี fallback mechanism กลับไปใช้ SMS เมื่อระบบ dual notification มีปัญหา

### 2. ประสบการณ์ผู้ใช้ที่ดีขึ้น
- ลูกค้าได้รับการแจ้งเตือนผ่านช่องทางที่พวกเขาชอบใช้
- สามารถโต้ตอบได้ในทันทีผ่าน Messenger Bot
- ดูประวัติคำสั่งซื้อได้ง่าย

### 3. การบริหารจัดการ
- Admin สามารถส่งการแจ้งเตือนผ่าน API endpoints
- สถิติการส่งแยกตามช่องทาง
- ลดการพลาดการแจ้งเตือนสำคัญ

## การติดตั้งและกำหนดค่า

### 1. Environment Variables
ตรวจสอบให้แน่ใจว่ามี environment variables ต่อไปนี้:
```env
FB_PAGE_ACCESS_TOKEN=your_page_access_token
FB_APP_SECRET=your_app_secret
FB_PAGE_ID=your_page_id
```

### 2. Database Models
ระบบใช้ MongoDB models ต่อไปนี้:
- `MessengerUser`: เชื่อมโยง PSID กับ phone number
- `User`: ข้อมูลผู้ใช้หลัก
- `Order`: ข้อมูลคำสั่งซื้อ

### 3. Webhook Configuration
Facebook Messenger webhook ต้องได้รับการกำหนดค่าให้ชื้ไปที่:
```
POST /api/messenger/webhook
```

## การทดสอบ

### 1. ทดสอบการยืนยันตัวตน
1. เริ่มแชทกับ Messenger Bot
2. กด "Get Started" หรือส่งข้อความใดๆ
3. เลือก "ยืนยันตัวตน" หรือพิมพ์เบอร์โทร
4. กรอก OTP ที่ได้รับ

### 2. ทดสอบการแจ้งเตือน
1. สร้างคำสั่งซื้อผ่านเว็บไซต์
2. ตรวจสอบการแจ้งเตือนใน SMS และ Messenger
3. อัปเดตเลขพัสดุในระบบ Admin
4. ตรวจสอบการแจ้งเตือนการจัดส่ง

### 3. ทดสอบประวัติคำสั่งซื้อ
1. ใน Messenger Bot เลือก "ดูออเดอร์ของฉัน"
2. ตรวจสอบว่าแสดงประวัติคำสั่งซื้อถูกต้อง

## การแก้ไขปัญหา

### 1. ไม่ได้รับการแจ้งเตือนใน Messenger
- ตรวจสอบว่าผู้ใช้ได้ยืนยันตัวตนแล้ว
- ตรวจสอบ environment variables ของ Facebook
- ดู logs ในฟังก์ชัน `sendMessengerNotification`

### 2. ข้อมูล MessengerUser ไม่ถูกต้อง
- ตรวจสอบการเชื่อมต่อ database
- ตรวจสอบรูปแบบเบอร์โทรศัพท์ (66xxxxxxxxx)

### 3. Bot ไม่ตอบสนอง
- ตรวจสอบ webhook configuration
- ตรวจสอบ access token และ app secret
- ดู logs ในฟังก์ชัน `handleEvent`

## ข้อจำกัด

1. ผู้ใช้ต้องยืนยันตัวตนก่อนจึงจะได้รับการแจ้งเตือนใน Messenger
2. การแจ้งเตือนใน Messenger จะส่งได้เฉพาะผู้ที่เคยโต้ตอบกับ Bot แล้ว
3. Facebook มีข้อจำกัดเรื่อง rate limiting สำหรับการส่งข้อความ

## การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มในอนาคต:
1. Rich Messages ใน Messenger (รูปภาพ, การ์ด)
2. Webhook สำหรับ delivery status
3. การตั้งค่าการแจ้งเตือนส่วนบุคคล
4. การแจ้งเตือนแบบ scheduled
5. การรายงานสถิติการแจ้งเตือน 