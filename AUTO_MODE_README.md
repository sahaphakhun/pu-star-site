# ระบบโหมดอัตโนมัติสำหรับแชทบอท

## ภาพรวม

ระบบโหมดอัตโนมัติถูกออกแบบมาเพื่อจัดการกรณีที่ลูกค้าไม่กดเมนูและส่งข้อความมาเฉย ๆ โดยจะเปลี่ยนเป็นโหมดอัตโนมัติเมื่อลูกค้าส่งข้อความโดยไม่กดเมนู 2 ครั้งขึ้นไป

## คุณสมบัติหลัก

### 1. การติดตามการใช้งาน
- **nonMenuMessageCount**: จำนวนครั้งที่ผู้ใช้ส่งข้อความโดยไม่กดเมนู
- **lastMessageTime**: เวลาที่ส่งข้อความล่าสุด
- **autoModeEnabled**: สถานะโหมดอัตโนมัติ

### 2. การเปลี่ยนโหมดอัตโนมัติ
- เมื่อ `nonMenuMessageCount >= 2` ระบบจะเปิดโหมดอัตโนมัติ
- เอไอจะได้รับประวัติการสนทนาก่อนหน้าเพื่อตอบได้ครบถ้วน
- ยังคงแสดงเมนูให้ลูกค้ากดได้เหมือนเดิม

### 3. การจัดการประวัติการสนทนา
- เก็บประวัติการสนทนาล่าสุด 20 ข้อความ
- เอไอจะได้รับประวัติการสนทนาทั้งหมดเพื่อตอบได้ครบถ้วน
- ประวัติถูกเก็บทั้งใน memory และฐานข้อมูล

## การทำงาน

### ขั้นตอนที่ 1: การติดตาม
```typescript
// เพิ่มจำนวนข้อความที่ไม่ใช่เมนู
await incrementNonMenuMessageCount(psid);
```

### ขั้นตอนที่ 2: การตรวจสอบ
```typescript
// ตรวจสอบว่าควรเปิดโหมดอัตโนมัติหรือไม่
if (!autoModeEnabled && session.nonMenuMessageCount >= 2) {
  await enableAutoModeForUser(psid);
}
```

### ขั้นตอนที่ 3: การตอบกลับ
```typescript
// ถ้าโหมดอัตโนมัติเปิดอยู่
if (autoModeEnabled) {
  const conversationHistory = await getConversationHistory(psid);
  const answer = await getAssistantResponse(
    buildSystemInstructions('Basic'), 
    conversationHistory, 
    question
  );
}
```

### ขั้นตอนที่ 4: การรีเซ็ต
```typescript
// รีเซ็ตเมื่อกดเมนู
await resetNonMenuMessageCount(psid);
```

## โครงสร้างฐานข้อมูล

### Session Collection
```typescript
{
  psid: string,
  step: string,
  cart: CartItem[],
  tempData: Record<string, unknown>,
  nonMenuMessageCount: number, // ใหม่
  lastMessageTime: Date,       // ใหม่
  updatedAt: Date
}
```

### MessengerUser Collection
```typescript
{
  psid: string,
  phoneNumber?: string,
  userId?: ObjectId,
  otpToken?: string,
  otpExpire?: Date,
  aiEnabled: boolean,          // ใหม่
  autoModeEnabled: boolean,    // ใหม่
  conversationHistory: Array<{ // ใหม่
    role: string,
    content: string,
    timestamp: Date
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

## การติดตั้ง

### 1. รัน Migration Script
```bash
node scripts/migrate-auto-mode.js
```

### 2. ตรวจสอบ Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/your-database
OPENAI_API_KEY=your-openai-api-key
```

## การใช้งาน

### เปิดโหมดอัตโนมัติ
```typescript
await enableAutoModeForUser(psid);
```

### ปิดโหมดอัตโนมัติ
```typescript
await disableAutoModeForUser(psid);
```

### ตรวจสอบสถานะ
```typescript
const isEnabled = await isAutoModeEnabled(psid);
```

### เพิ่มประวัติการสนทนา
```typescript
await addToConversationHistory(psid, 'user', 'ข้อความจากผู้ใช้');
await addToConversationHistory(psid, 'assistant', 'ข้อความจากเอไอ');
```

### ดึงประวัติการสนทนา
```typescript
const history = await getConversationHistory(psid);
```

## ข้อควรระวัง

1. **การจัดข้อความ**: ระบบจะส่งประวัติการสนทนาทั้งหมดให้เอไอในครั้งแรก เพื่อให้ตอบได้ครบถ้วน
2. **การแสดงเมนู**: แม้จะอยู่ในโหมดอัตโนมัติ ระบบยังคงแสดงเมนูให้ลูกค้ากดได้
3. **การรีเซ็ต**: จำนวนข้อความที่ไม่ใช่เมนูจะถูกรีเซ็ตเมื่อลูกค้ากดเมนูใด ๆ
4. **การเก็บประวัติ**: ประวัติการสนทนาถูกเก็บเฉพาะ 20 ข้อความล่าสุดเพื่อประหยัดพื้นที่

## การทดสอบ

### ทดสอบการเปลี่ยนโหมดอัตโนมัติ
1. ส่งข้อความโดยไม่กดเมนู 2 ครั้ง
2. ตรวจสอบว่าโหมดอัตโนมัติเปิดขึ้น
3. ตรวจสอบว่าเอไอตอบกลับพร้อมประวัติการสนทนา

### ทดสอบการรีเซ็ต
1. เปิดโหมดอัตโนมัติ
2. กดเมนูใด ๆ
3. ตรวจสอบว่า `nonMenuMessageCount` ถูกรีเซ็ตเป็น 0

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **Migration ไม่สำเร็จ**: ตรวจสอบ MONGODB_URI และสิทธิ์การเข้าถึง
2. **เอไอไม่ตอบ**: ตรวจสอบ OPENAI_API_KEY และการเชื่อมต่อ
3. **ประวัติไม่ถูกเก็บ**: ตรวจสอบการเชื่อมต่อฐานข้อมูล

### Log ที่สำคัญ
```typescript
console.log(`[AutoMode] Enabling auto mode for ${psid} after ${session.nonMenuMessageCount} non-menu messages`);
```
