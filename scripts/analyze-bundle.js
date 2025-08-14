#!/usr/bin/env node

/**
 * Bundle Analyzer Script สำหรับ Next.js
 * ใช้สำหรับวิเคราะห์และ optimize bundle size
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 เริ่มต้น Bundle Analysis...\n');

// ตรวจสอบว่ามี .next folder หรือไม่
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.log('❌ ไม่พบ .next folder กรุณา build โปรเจคก่อน');
  console.log('   รันคำสั่ง: npm run build');
  process.exit(1);
}

// ตรวจสอบ bundle size
console.log('📊 วิเคราะห์ Bundle Size...');

try {
  // ใช้ webpack-bundle-analyzer
  const analyzeCommand = 'ANALYZE=true npm run build';
  console.log(`   รันคำสั่ง: ${analyzeCommand}`);
  
  execSync(analyzeCommand, { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
  
  console.log('\n✅ Bundle Analysis เสร็จสิ้น');
  console.log('   เปิดเบราว์เซอร์เพื่อดูรายละเอียด');
  
} catch (error) {
  console.error('\n❌ เกิดข้อผิดพลาดในการวิเคราะห์ bundle:', error.message);
  
  // Fallback: ใช้ next-bundle-analyzer
  console.log('\n🔄 ลองใช้ next-bundle-analyzer...');
  
  try {
    const nextAnalyzeCommand = 'npx @next/bundle-analyzer .next/static';
    execSync(nextAnalyzeCommand, { stdio: 'inherit' });
  } catch (fallbackError) {
    console.error('\n❌ ไม่สามารถวิเคราะห์ bundle ได้');
    console.log('\n💡 แนะนำให้ติดตั้ง dependencies:');
    console.log('   npm install --save-dev webpack-bundle-analyzer');
    console.log('   หรือ');
    console.log('   npm install --save-dev @next/bundle-analyzer');
  }
}

console.log('\n📋 คำแนะนำในการลด Bundle Size:');
console.log('   1. ใช้ Dynamic Imports สำหรับ components ที่ไม่จำเป็น');
console.log('   2. ใช้ Tree Shaking สำหรับ libraries');
console.log('   3. ใช้ Code Splitting สำหรับ routes ต่างๆ');
console.log('   4. ใช้ Image Optimization สำหรับรูปภาพ');
console.log('   5. ใช้ Font Optimization สำหรับฟอนต์');
