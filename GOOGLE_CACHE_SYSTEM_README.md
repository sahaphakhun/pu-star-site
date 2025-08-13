# ระบบแคชข้อมูล Google สำหรับ Facebook Messenger Bot

## 📋 ภาพรวม

ระบบแคชข้อมูล Google ช่วยให้ Facebook Messenger Bot สามารถเข้าถึงข้อมูลจาก Google Docs และ Google Sheets ได้อย่างรวดเร็ว โดยไม่ต้องดึงข้อมูลใหม่ทุกครั้งที่ใช้งาน

## 🚀 คุณสมบัติหลัก

### 1. ระบบแคชอัตโนมัติ
- รีเฟรชข้อมูลที่ x:44 ทุกชั่วโมง
- ตรวจสอบทุก 1 นาที
- ใช้ข้อมูลแคชเมื่อไม่ถึงเวลารีเฟรช

### 2. การจัดการแคชแบบ Smart
- ตรวจสอบอายุข้อมูลอัตโนมัติ
- รีเฟรชเฉพาะเมื่อจำเป็น
- ใช้ข้อมูลเดิมเมื่อ Google API ไม่พร้อม

### 3. การตรวจสอบสุขภาพแคช
- แสดงสถานะแคชแบบ real-time
- ตรวจสอบอายุข้อมูล
- แจ้งเตือนเมื่อข้อมูลเก่าเกินไป

## ⏰ เวลารีเฟรชแคช

### รูปแบบเวลา
```
x:44 ทุกชั่วโมง
```

### ตัวอย่าง
- 00:44, 01:44, 02:44, ..., 23:44
- ระบบจะรีเฟรชข้อมูลทุกชั่วโมงที่นาทีที่ 44

### การตั้งค่า
```typescript
// ตั้งค่าใน openai-utils.ts
const CACHE_REFRESH_MINUTE = 44; // นาทีที่ 44
const CACHE_REFRESH_INTERVAL_MS = 60 * 1000; // ตรวจสอบทุก 1 นาที
```

## 🔧 การติดตั้ง

### 1. Import ฟังก์ชันที่จำเป็น
```typescript
import { 
  startCacheMonitoring,
  getCacheStatusInfo,
  forceRefreshCache,
  getCacheHealth
} from '@/utils/cache-manager';
```

### 2. เริ่มการตรวจสอบแคชอัตโนมัติ
```typescript
// เริ่มการตรวจสอบแคชอัตโนมัติ
startCacheMonitoring();

// หรือใช้ cacheManager โดยตรง
import { cacheManager } from '@/utils/cache-manager';
cacheManager.startMonitoring();
```

## 📊 ฟังก์ชันที่ใช้ได้

### การจัดการแคช
```typescript
// เริ่มการตรวจสอบแคชอัตโนมัติ
startCacheMonitoring();

// หยุดการตรวจสอบแคช
stopCacheMonitoring();

// รีเฟรชแคชทันที
await forceRefreshCache();

// ตรวจสอบว่าควรรีเฟรชแคชหรือไม่
const shouldRefresh = shouldRefreshCacheNow();
```

### การดูสถานะแคช
```typescript
// สถานะแคชพื้นฐาน
const status = getCacheStatusInfo();
console.log("Google Docs:", status.googleDoc.hasData);
console.log("Google Sheets:", status.sheets.itemCount);
console.log("รีเฟรชครั้งถัดไป:", status.nextRefreshTime);

// สถานะแคชแบบละเอียด
const detailedStatus = getDetailedCacheStatus();
console.log("เวลาปัจจุบัน:", detailedStatus.currentTime);
console.log("การตรวจสอบแคช:", detailedStatus.monitoringActive);
console.log("อายุข้อมูล Google Docs:", detailedStatus.cacheAge.googleDoc);
console.log("อายุข้อมูล Google Sheets:", detailedStatus.cacheAge.sheets);
```

### การตรวจสอบสุขภาพแคช
```typescript
// ตรวจสอบสุขภาพของแคช
const health = getCacheHealth();
console.log("สถานะ:", health.status); // 'healthy' | 'warning' | 'error'
console.log("ข้อความ:", health.message);
console.log("รายละเอียด:");
health.details.forEach(detail => console.log(`  ${detail}`));
```

## 🏗️ การใช้งานในระบบ

### 1. การตั้งค่าเริ่มต้น
```typescript
// ในไฟล์หลักของแอปพลิเคชัน
import { startCacheMonitoring } from '@/utils/cache-manager';

// เริ่มการตรวจสอบแคชเมื่อเริ่มแอปพลิเคชัน
startCacheMonitoring();
```

### 2. การใช้งานใน production
```typescript
import { productionCacheSetup } from '@/utils/cache-example';

// ตั้งค่าแคชสำหรับ production
productionCacheSetup();
```

### 3. การจัดการ error handling
```typescript
import { cacheManager } from '@/utils/cache-manager';

// ตั้งค่า error handling
process.on('SIGINT', () => {
  console.log('หยุดการตรวจสอบแคช...');
  cacheManager.stopMonitoring();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('หยุดการตรวจสอบแคช...');
  cacheManager.stopMonitoring();
  process.exit(0);
});
```

## 🔍 การ Debug และ Monitoring

### Log ที่แสดง
```
[DEBUG] Cache refresh time reached: 14:44
[DEBUG] Cache refresh time reached, refreshing Google Docs...
[DEBUG] Fetched Google Doc instructions OK at 14/1/2025, 14:44:45
[DEBUG] Cache refresh time reached, refreshing Google Sheets...
[DEBUG] Fetched 5 sheets data OK at 14/1/2025, 14:44:47
[DEBUG] Scheduled cache refresh triggered
[DEBUG] Google data cache refreshed successfully
```

### การตรวจสอบสถานะ
```typescript
// ตรวจสอบสถานะแคช
const status = getCacheStatusInfo();
console.log("สถานะแคช:", status);

// ตรวจสอบสุขภาพแคช
const health = getCacheHealth();
console.log("สุขภาพแคช:", health);

// ตรวจสอบว่าควรรีเฟรชแคชหรือไม่
const shouldRefresh = shouldRefreshCacheNow();
console.log("ควรรีเฟรชแคช:", shouldRefresh);
```

## ⚙️ การตั้งค่า

### การเปลี่ยนเวลารีเฟรช
```typescript
// ใน openai-utils.ts
const CACHE_REFRESH_MINUTE = 30; // เปลี่ยนเป็น x:30
const CACHE_REFRESH_INTERVAL_MS = 30 * 1000; // ตรวจสอบทุก 30 วินาที
```

### การเปลี่ยน TTL ของแคช
```typescript
// ใน openai-utils.ts
const ONE_HOUR_MS = 2 * 3_600_000; // เปลี่ยนเป็น 2 ชั่วโมง
```

## 📈 ประสิทธิภาพ

### ข้อดีของระบบแคช
- **ความเร็ว**: เข้าถึงข้อมูลได้ทันที
- **ประหยัด API**: ลดการเรียก Google API
- **เสถียรภาพ**: ทำงานได้แม้ Google API ไม่พร้อม
- **ประสิทธิภาพ**: ลดเวลาในการตอบสนอง

### การวัดประสิทธิภาพ
```typescript
import { cachePerformanceExample } from '@/utils/cache-example';

// ทดสอบประสิทธิภาพแคช
cachePerformanceExample();
```

## 🚨 ข้อควรระวัง

### 1. ข้อมูลเก่า
- ข้อมูลอาจเก่าได้สูงสุด 1 ชั่วโมง
- ควรตรวจสอบอายุข้อมูลก่อนใช้งาน
- รีเฟรชแคชทันทีหากต้องการข้อมูลใหม่

### 2. Memory Usage
- ข้อมูลแคชจะเก็บไว้ใน memory
- ควรจำกัดขนาดข้อมูลที่แคช
- ล้างแคชเป็นระยะหากจำเป็น

### 3. Rate Limiting
- Google API มีข้อจำกัดการเรียก
- ระบบแคชช่วยลดการเรียก API
- ควรตั้งค่าเวลารีเฟรชที่เหมาะสม

## 🔄 การอัปเดต

### เวอร์ชันปัจจุบัน
- รีเฟรชที่ x:44 ทุกชั่วโมง
- ตรวจสอบทุก 1 นาที
- ระบบ health check แบบ real-time
- การจัดการ error ที่ดี

### แผนการพัฒนาต่อ
- ระบบแคชแบบ persistent (Redis, MongoDB)
- การแคชรูปภาพและไฟล์
- การแคชแบบ distributed
- การตั้งค่าแบบ dynamic

## 📞 การสนับสนุน

### การแก้ไขปัญหา
```typescript
// ตรวจสอบสถานะแคช
const health = getCacheHealth();
if (health.status === 'error') {
  console.log('แคชมีปัญหา:', health.message);
  // รีเฟรชแคชทันที
  await forceRefreshCache();
}

// ตรวจสอบสถานะ Google API
import { checkGoogleAPIStatus } from '@/utils/openai-utils';
const apiStatus = await checkGoogleAPIStatus();
console.log('สถานะ Google API:', apiStatus);
```

### การติดต่อ
หากมีปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา

---

**หมายเหตุ**: ระบบแคชนี้ถูกออกแบบมาเพื่อทำงานร่วมกับ Facebook Messenger Bot และต้องการการตั้งค่า Google API ที่ถูกต้อง
