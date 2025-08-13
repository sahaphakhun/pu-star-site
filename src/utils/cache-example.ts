// =============================
// ตัวอย่างการใช้งานระบบแคชข้อมูล Google
// =============================

import { 
  cacheManager,
  startCacheMonitoring,
  stopCacheMonitoring,
  forceRefreshCache,
  getCacheStatusInfo,
  getDetailedCacheStatus,
  getCacheHealth,
  shouldRefreshCacheNow
} from './cache-manager';

/**
 * ตัวอย่างการใช้งานระบบแคช
 */
export async function demonstrateCacheUsage() {
  console.log("🚀 เริ่มการสาธิตระบบแคชข้อมูล Google");
  console.log("=" .repeat(60));

  // 1. ดูสถานะแคชปัจจุบัน
  console.log("\n📊 1. สถานะแคชปัจจุบัน:");
  const status = getCacheStatusInfo();
  console.log("Google Docs:", status.googleDoc.hasData ? "✅ มีข้อมูล" : "❌ ไม่มีข้อมูล");
  console.log("Google Sheets:", status.sheets.hasData ? `✅ ${status.sheets.itemCount} ชีต` : "❌ ไม่มีข้อมูล");
  console.log("รีเฟรชครั้งถัดไป:", status.nextRefreshTime);

  // 2. ดูสถานะแคชแบบละเอียด
  console.log("\n🔍 2. สถานะแคชแบบละเอียด:");
  const detailedStatus = getDetailedCacheStatus();
  console.log("เวลาปัจจุบัน:", detailedStatus.currentTime);
  console.log("การตรวจสอบแคช:", detailedStatus.monitoringActive ? "✅ เปิดใช้งาน" : "❌ ปิดใช้งาน");
  console.log("อายุข้อมูล Google Docs:", detailedStatus.cacheAge.googleDoc);
  console.log("อายุข้อมูล Google Sheets:", detailedStatus.cacheAge.sheets);

  // 3. ตรวจสอบสุขภาพของแคช
  console.log("\n🏥 3. สุขภาพของแคช:");
  const health = getCacheHealth();
  console.log("สถานะ:", health.status);
  console.log("ข้อความ:", health.message);
  console.log("รายละเอียด:");
  health.details.forEach(detail => console.log(`  ${detail}`));

  // 4. ตรวจสอบว่าควรรีเฟรชแคชหรือไม่
  console.log("\n⏰ 4. ตรวจสอบเวลารีเฟรช:");
  const shouldRefresh = shouldRefreshCacheNow();
  console.log("ควรรีเฟรชแคชตอนนี้:", shouldRefresh ? "✅ ใช่" : "❌ ไม่");

  // 5. เริ่มการตรวจสอบแคชอัตโนมัติ
  console.log("\n🔄 5. เริ่มการตรวจสอบแคชอัตโนมัติ:");
  startCacheMonitoring();
  
  // รอสักครู่แล้วตรวจสอบสถานะ
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const updatedStatus = getDetailedCacheStatus();
  console.log("การตรวจสอบแคช:", updatedStatus.monitoringActive ? "✅ เปิดใช้งาน" : "❌ ปิดใช้งาน");

  // 6. รีเฟรชแคชทันที (ถ้าต้องการ)
  console.log("\n⚡ 6. รีเฟรชแคชทันที:");
  try {
    await forceRefreshCache();
    console.log("✅ รีเฟรชแคชสำเร็จ");
  } catch (error) {
    console.log("❌ รีเฟรชแคชล้มเหลว:", error);
  }

  console.log("\n🎉 การสาธิตระบบแคชเสร็จสิ้น!");
}

/**
 * ตัวอย่างการใช้งานในระบบจริง
 */
export async function realWorldCacheExample() {
  console.log("🌍 ตัวอย่างการใช้งานในระบบจริง");
  console.log("=" .repeat(50));

  // เริ่มการตรวจสอบแคชอัตโนมัติ
  console.log("🔄 เริ่มการตรวจสอบแคชอัตโนมัติ...");
  startCacheMonitoring();

  // จำลองการใช้งานระบบ
  console.log("📝 จำลองการใช้งานระบบ...");
  
  // ตรวจสอบสถานะแคชทุก 5 วินาที
  const interval = setInterval(() => {
    const health = getCacheHealth();
    const now = new Date();
    
    console.log(`\n[${now.toLocaleTimeString('th-TH')}] สถานะแคช:`);
    console.log(`  สถานะ: ${health.status}`);
    console.log(`  ข้อความ: ${health.message}`);
    
    // หยุดการตรวจสอบหลังจาก 30 วินาที
    if (now.getTime() - Date.now() > 30000) {
      clearInterval(interval);
      console.log("⏹️ หยุดการตรวจสอบแคช");
    }
  }, 5000);

  // หยุดการตรวจสอบหลังจาก 30 วินาที
  setTimeout(() => {
    clearInterval(interval);
    console.log("⏹️ หยุดการตรวจสอบแคช (timeout)");
  }, 30000);
}

/**
 * ตัวอย่างการจัดการแคชแบบ manual
 */
export async function manualCacheManagement() {
  console.log("🛠️ การจัดการแคชแบบ manual");
  console.log("=" .repeat(40));

  // 1. หยุดการตรวจสอบแคชอัตโนมัติ
  console.log("1. หยุดการตรวจสอบแคชอัตโนมัติ");
  stopCacheMonitoring();

  // 2. ตรวจสอบสถานะ
  const status = getDetailedCacheStatus();
  console.log("2. สถานะปัจจุบัน:", status.monitoringActive ? "เปิดใช้งาน" : "ปิดใช้งาน");

  // 3. รีเฟรชแคชด้วยตัวเอง
  console.log("3. รีเฟรชแคชด้วยตัวเอง");
  try {
    await forceRefreshCache();
    console.log("✅ รีเฟรชแคชสำเร็จ");
  } catch (error) {
    console.log("❌ รีเฟรชแคชล้มเหลว:", error);
  }

  // 4. เริ่มการตรวจสอบแคชอัตโนมัติอีกครั้ง
  console.log("4. เริ่มการตรวจสอบแคชอัตโนมัติอีกครั้ง");
  startCacheMonitoring();

  // 5. ตรวจสอบสถานะสุดท้าย
  const finalStatus = getDetailedCacheStatus();
  console.log("5. สถานะสุดท้าย:", finalStatus.monitoringActive ? "เปิดใช้งาน" : "ปิดใช้งาน");
}

/**
 * ตัวอย่างการตรวจสอบประสิทธิภาพแคช
 */
export function cachePerformanceExample() {
  console.log("⚡ ตัวอย่างการตรวจสอบประสิทธิภาพแคช");
  console.log("=" .repeat(50));

  // ตรวจสอบสถานะแคชหลายครั้งเพื่อดูประสิทธิภาพ
  const iterations = 1000;
  console.log(`🔄 ตรวจสอบสถานะแคช ${iterations} ครั้ง...`);

  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    getCacheStatusInfo();
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`✅ เสร็จสิ้นใน ${duration.toFixed(2)} มิลลิวินาที`);
  console.log(`📊 เฉลี่ย ${(duration / iterations).toFixed(4)} มิลลิวินาทีต่อครั้ง`);
  
  if (duration < 100) {
    console.log("🚀 ประสิทธิภาพดีมาก!");
  } else if (duration < 500) {
    console.log("✅ ประสิทธิภาพดี");
  } else {
    console.log("⚠️ ประสิทธิภาพควรปรับปรุง");
  }
}

/**
 * ตัวอย่างการใช้งานใน production
 */
export function productionCacheSetup() {
  console.log("🏭 การตั้งค่าแคชสำหรับ production");
  console.log("=" .repeat(50));

  // 1. เริ่มการตรวจสอบแคชอัตโนมัติ
  console.log("1. เริ่มการตรวจสอบแคชอัตโนมัติ...");
  startCacheMonitoring();

  // 2. ตั้งค่า error handling
  console.log("2. ตั้งค่า error handling...");
  process.on('SIGINT', () => {
    console.log("\n🛑 รับสัญญาณ SIGINT, หยุดการตรวจสอบแคช...");
    stopCacheMonitoring();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log("\n🛑 รับสัญญาณ SIGTERM, หยุดการตรวจสอบแคช...");
    stopCacheMonitoring();
    process.exit(0);
  });

  // 3. แสดงสถานะเริ่มต้น
  console.log("3. สถานะเริ่มต้น:");
  const health = getCacheHealth();
  console.log(`   สถานะ: ${health.status}`);
  console.log(`   ข้อความ: ${health.message}`);

  console.log("\n✅ การตั้งค่าแคชสำหรับ production เสร็จสิ้น!");
  console.log("🔄 ระบบจะรีเฟรชแคชที่ x:44 ทุกชั่วโมง");
}

// Export ฟังก์ชันทั้งหมด
export default {
  demonstrateCacheUsage,
  realWorldCacheExample,
  manualCacheManagement,
  cachePerformanceExample,
  productionCacheSetup
};
