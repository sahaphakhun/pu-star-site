# ระบบการชำระเงินและการแจ้งเตือน (Payment System & Notifications)

## ภาพรวม

ระบบนี้พัฒนาขึ้นเพื่อเพิ่มประสิทธิภาพในการจัดการการชำระเงินและการแจ้งเตือนสำหรับออเดอร์ต่างๆ โดยรองรับการชำระเงินหลายรูปแบบและมีระบบแจ้งเตือนอัตโนมัติ

## ฟีเจอร์หลัก

### 1. การชำระเงินแบบเก็บปลายทาง (COD)
- ติดตามสถานะการชำระเงิน COD
- กำหนดวันครบกำหนดชำระเงิน (3 วันหลังจัดส่ง)
- ส่งการแจ้งเตือนอัตโนมัติเมื่อครบกำหนด
- บันทึกประวัติการส่งการแจ้งเตือน

### 2. การชำระเงินแบบโอนเงินผ่านธนาคาร
- อัพโหลดสลิปการโอนเงิน
- ตรวจสอบและยืนยันสลิป (Manual/Automatic)
- แจ้งสถานะการตรวจสอบกลับให้ลูกค้า
- ส่งการแจ้งเตือนเมื่อต้องการอัพโหลดสลิป

### 3. การชำระเงินแบบเครดิต
- กำหนดวันครบกำหนดชำระเงิน
- ส่งการแจ้งเตือนก่อนครบกำหนด
- บันทึกประวัติการแจ้งเตือน

## โครงสร้างไฟล์

### Models
- `src/models/Order.ts` - อัพเดทโมเดล Order ด้วยฟิลด์การติดตามการชำระเงิน

### API Endpoints
- `src/app/api/orders/route.ts` - API สำหรับสร้างออเดอร์
- `src/app/api/orders/[id]/route.ts` - API สำหรับจัดการออเดอร์รายการ
- `src/app/api/payments/notifications/route.ts` - API สำหรับการแจ้งเตือน

### Components
- `src/components/PaymentStatusTracker.tsx` - Component สำหรับแสดงสถานะการชำระเงิน
- `src/app/shop/components/OrderForm.tsx` - อัพเดทฟอร์มการสั่งซื้อ

### Services
- `src/app/notification/paymentNotifications.ts` - บริการแจ้งเตือนการชำระเงิน

## ฟิลด์ใหม่ใน Order Model

### COD Fields
- `codPaymentStatus`: 'pending' | 'collected' | 'failed'
- `codPaymentDueDate`: Date
- `codReminderSent`: boolean
- `paymentConfirmationRequired`: boolean

### Credit Fields
- `creditPaymentDueDate`: Date
- `creditReminderSent`: boolean

### Slip Verification Fields
- `slipVerification.slipUrl`: string
- `slipVerification.slipUploadedAt`: Date

## API Actions

### Order Actions
- `confirm_cod_payment` - ยืนยันการชำระเงิน COD
- `fail_cod_payment` - บันทึกการชำระเงิน COD ล้มเหลว
- `upload_slip` - อัพโหลดสลิปการโอนเงิน
- `verify_slip` - ตรวจสอบและยืนยันสลิป
- `set_cod_due_date` - กำหนดวันครบกำหนดชำระเงิน COD

### Notification Actions
- `cod_reminders` - ส่งการแจ้งเตือน COD ค้างชำระ
- `credit_due_notifications` - ส่งการแจ้งเตือนเครดิตครบกำหนด
- `all` - ส่งการแจ้งเตือนทั้งหมด

## การตั้งค่า Environment Variables

```env
LINE_GROUP_ID=your_line_group_id
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
```

## การใช้งาน

### 1. สร้างออเดอร์ใหม่
```javascript
const orderData = {
  customerName: 'ชื่อลูกค้า',
  customerPhone: '0812345678',
  items: [...],
  paymentMethod: 'cod', // 'cod' | 'transfer' | 'credit'
  creditPaymentDueDate: '2024-01-31' // สำหรับ paymentMethod = 'credit'
};

const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

### 2. อัพเดทสถานะการชำระเงิน
```javascript
const response = await fetch(`/api/orders/${orderId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'confirm_cod_payment',
    verifiedBy: 'admin'
  })
});
```

### 3. ส่งการแจ้งเตือน
```javascript
const response = await fetch('/api/payments/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'cod_reminders' })
});
```

## Component Usage

### PaymentStatusTracker
```tsx
<PaymentStatusTracker
  order={order}
  onUpdate={handleOrderUpdate}
  isAdmin={true} // แสดงปุ่มสำหรับ admin
/>
```

### OrderForm (Updated)
```tsx
<OrderForm
  paymentMethod={paymentMethod}
  setPaymentMethod={setPaymentMethod}
  creditPaymentDueDate={creditPaymentDueDate}
  setCreditPaymentDueDate={setCreditPaymentDueDate}
  // ... other props
/>
```

## การทดสอบ

สามารถทดสอบระบบได้ที่ `/test-payment` ซึ่งมีฟีเจอร์:

1. เลือกออเดอร์ทดสอบ (COD, Transfer, Credit)
2. ทดสอบ PaymentStatusTracker Component
3. สลับโหมด Admin/User
4. ทดสอบ API การแจ้งเตือน
5. สร้างออเดอร์ทดสอบใหม่

## Cron Job Setup

สำหรับการส่งการแจ้งเตือนอัตโนมัติ สามารถตั้งค่า cron job ได้ดังนี้:

```bash
# ทุกวันเวลา 09:00 น.
0 9 * * * curl -X GET https://your-domain.com/api/payments/notifications
```

## Flow การทำงาน

### COD Flow
1. สร้างออเดอร์ COD → กำหนดสถานะ pending
2. จัดส่งสินค้า → อัพเดทสถานะเป็น delivered
3. รอ 3 วัน → ส่งการแจ้งเตือนอัตโนมัติ
4. ลูกค้าชำระเงิน → Admin ยืนยันการชำระเงิน
5. อัพเดทสถานะเป็น collected

### Transfer Flow
1. สร้างออเดอร์ Transfer → ส่งการแจ้งเตือนขออัพโหลดสลิป
2. ลูกค้าอัพโหลดสลิป → อัพเดทสถานะเป็น pending_verification
3. Admin ตรวจสอบสลิป → อัพเดทสถานะเป็น verified/rejected
4. ส่งการแจ้งเตือนผลการตรวจสอบให้ลูกค้า

### Credit Flow
1. สร้างออเดอร์ Credit → กำหนดวันครบกำหนด
2. 3 วันก่อนครบกำหนด → ส่งการแจ้งเตือนอัตโนมัติ
3. ลูกค้าชำระเงินตามกำหนด

## ข้อควรพิจารณา

1. **Security**: ควรมีการตรวจสอบสิทธิ์ในการเข้าถึง API ต่างๆ
2. **File Upload**: ควรใช้บริการอัพโหลดไฟล์ที่ปลอดภัย (Cloudinary, S3)
3. **Error Handling**: ควรมีการจัดการ error ที่ครบถ้วน
4. **Logging**: ควรมีการบันทึก log สำหรับการตรวจสอบและแก้ไขปัญหา
5. **Rate Limiting**: ควรมีการจำกัดการส่งการแจ้งเตือนเพื่อป้องกัน spam

## การพัฒนาต่อ

1. เพิ่มการชำระเงินผ่าน e-wallet
2. ระบบ recurring payment สำหรับลูกค้าประจำ
3. Dashboard สำหรับดูสถิติการชำระเงิน
4. ระบบ auto-retry สำหรับการชำระเงินที่ล้มเหลว
5. การแจ้งเตือนผ่านช่องทางอื่น (Email, Push Notification)