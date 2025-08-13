// =============================
// Cache Manager สำหรับข้อมูล Google
// =============================

import { 
  getCacheStatus, 
  setupCacheMonitoring, 
  refreshCacheIfNeeded,
  refreshGoogleDataCache 
} from './openai-utils';

/**
 * ตัวจัดการแคชข้อมูล Google
 */
export class GoogleCacheManager {
  private static instance: GoogleCacheManager;
  private isMonitoring = false;

  private constructor() {}

  /**
   * สร้าง instance เดียว (Singleton)
   */
  public static getInstance(): GoogleCacheManager {
    if (!GoogleCacheManager.instance) {
      GoogleCacheManager.instance = new GoogleCacheManager();
    }
    return GoogleCacheManager.instance;
  }

  /**
   * เริ่มการตรวจสอบแคชอัตโนมัติ
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log("[Cache Manager] Monitoring already started");
      return;
    }

    console.log("[Cache Manager] Starting cache monitoring...");
    setupCacheMonitoring();
    this.isMonitoring = true;
    console.log("[Cache Manager] Cache monitoring started successfully");
  }

  /**
   * หยุดการตรวจสอบแคช
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log("[Cache Manager] Monitoring not started");
      return;
    }

    console.log("[Cache Manager] Stopping cache monitoring...");
    // Note: ใน Node.js ไม่สามารถหยุด setInterval ได้โดยตรง
    // แต่เราสามารถตั้งค่า flag เพื่อไม่ให้ทำงาน
    this.isMonitoring = false;
    console.log("[Cache Manager] Cache monitoring stopped");
  }

  /**
   * รีเฟรชแคชทันที
   */
  public async forceRefresh(): Promise<void> {
    console.log("[Cache Manager] Force refreshing cache...");
    try {
      await refreshGoogleDataCache();
      console.log("[Cache Manager] Cache refreshed successfully");
    } catch (error) {
      console.error("[Cache Manager] Failed to refresh cache:", error);
      throw error;
    }
  }

  /**
   * รีเฟรชแคชตามเวลาที่กำหนด
   */
  public async refreshIfNeeded(): Promise<void> {
    try {
      await refreshCacheIfNeeded();
    } catch (error) {
      console.error("[Cache Manager] Failed to refresh cache if needed:", error);
    }
  }

  /**
   * ดูสถานะแคช
   */
  public getStatus() {
    return getCacheStatus();
  }

  /**
   * ดูสถานะแคชแบบละเอียด
   */
  public getDetailedStatus() {
    const status = getCacheStatus();
    const now = new Date();
    
    return {
      ...status,
      currentTime: now.toLocaleString('th-TH'),
      monitoringActive: this.isMonitoring,
      cacheAge: {
        googleDoc: status.googleDoc.lastFetch 
          ? Math.floor((now.getTime() - status.googleDoc.lastFetch.getTime()) / 1000 / 60) + ' นาที'
          : 'ไม่เคยดึงข้อมูล',
        sheets: status.sheets.lastFetch
          ? Math.floor((now.getTime() - status.sheets.lastFetch.getTime()) / 1000 / 60) + ' นาที'
          : 'ไม่เคยดึงข้อมูล'
      }
    };
  }

  /**
   * ตรวจสอบสุขภาพของแคช
   */
  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details: string[];
  } {
    const status = getCacheStatus();
    const now = new Date();
    const details: string[] = [];
    let hasWarning = false;
    let hasError = false;

    // ตรวจสอบ Google Docs
    if (!status.googleDoc.hasData) {
      details.push('❌ Google Docs: ไม่มีข้อมูล');
      hasError = true;
    } else if (status.googleDoc.lastFetch) {
      const ageMinutes = Math.floor((now.getTime() - status.googleDoc.lastFetch.getTime()) / 1000 / 60);
      if (ageMinutes > 120) { // มากกว่า 2 ชั่วโมง
        details.push(`⚠️ Google Docs: ข้อมูลเก่า ${ageMinutes} นาที`);
        hasWarning = true;
      } else {
        details.push(`✅ Google Docs: ข้อมูลใหม่ ${ageMinutes} นาที`);
      }
    }

    // ตรวจสอบ Google Sheets
    if (!status.sheets.hasData) {
      details.push('❌ Google Sheets: ไม่มีข้อมูล');
      hasError = true;
    } else if (status.sheets.lastFetch) {
      const ageMinutes = Math.floor((now.getTime() - status.sheets.lastFetch.getTime()) / 1000 / 60);
      if (ageMinutes > 120) { // มากกว่า 2 ชั่วโมง
        details.push(`⚠️ Google Sheets: ข้อมูลเก่า ${ageMinutes} นาที`);
        hasWarning = true;
      } else {
        details.push(`✅ Google Sheets: ข้อมูลใหม่ ${ageMinutes} นาที`);
      }
    }

    // ตรวจสอบจำนวนข้อมูล
    if (status.sheets.itemCount === 0) {
      details.push('⚠️ Google Sheets: ไม่มีข้อมูลในชีต');
      hasWarning = true;
    } else {
      details.push(`✅ Google Sheets: ${status.sheets.itemCount} ชีต`);
    }

    // ตรวจสอบเวลารีเฟรชครั้งถัดไป
    details.push(`🕐 รีเฟรชครั้งถัดไป: ${status.nextRefreshTime}`);

    // กำหนดสถานะ
    let statusType: 'healthy' | 'warning' | 'error' = 'healthy';
    let message = 'แคชทำงานปกติ';

    if (hasError) {
      statusType = 'error';
      message = 'แคชมีปัญหา';
    } else if (hasWarning) {
      statusType = 'warning';
      message = 'แคชทำงานได้แต่มีข้อควรระวัง';
    }

    return {
      status: statusType,
      message,
      details
    };
  }
}

/**
 * ฟังก์ชัน helper สำหรับการใช้งาน
 */

/**
 * เริ่มการตรวจสอบแคชอัตโนมัติ
 */
export function startCacheMonitoring(): void {
  GoogleCacheManager.getInstance().startMonitoring();
}

/**
 * หยุดการตรวจสอบแคช
 */
export function stopCacheMonitoring(): void {
  GoogleCacheManager.getInstance().stopMonitoring();
}

/**
 * รีเฟรชแคชทันที
 */
export async function forceRefreshCache(): Promise<void> {
  return GoogleCacheManager.getInstance().forceRefresh();
}

/**
 * ดูสถานะแคช
 */
export function getCacheStatusInfo() {
  return GoogleCacheManager.getInstance().getStatus();
}

/**
 * ดูสถานะแคชแบบละเอียด
 */
export function getDetailedCacheStatus() {
  return GoogleCacheManager.getInstance().getDetailedStatus();
}

/**
 * ตรวจสอบสุขภาพของแคช
 */
export function getCacheHealth() {
  return GoogleCacheManager.getInstance().getHealthStatus();
}

/**
 * ตรวจสอบว่าควรรีเฟรชแคชหรือไม่
 */
export function shouldRefreshCacheNow(): boolean {
  const status = getCacheStatus();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // ตรวจสอบว่าเป็นนาทีที่ 44 และยังไม่อัปเดตในชั่วโมงนี้
  return currentMinute === 44 && status.googleDoc.lastRefreshHour !== currentHour;
}

// Export instance หลัก
export const cacheManager = GoogleCacheManager.getInstance();
