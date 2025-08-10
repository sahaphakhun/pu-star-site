import { WMS_CONFIG, WMS_STATUS_CODES } from '@/config/wms';
import type {
  WMSPickingStatusResponse,
  WMSStockStatusResponse,
  WMSConfig,
  WMSStockResult,
  WMSPickingResult,
  WMSStockStatus,
  WMSPickingStatus,
  WMSVariantConfig
} from '@/types/wms';

export class WMSService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = WMS_CONFIG.baseUrl;
    this.timeout = WMS_CONFIG.timeout;
    this.retryAttempts = WMS_CONFIG.retryAttempts;
    this.retryDelay = WMS_CONFIG.retryDelay;
  }

  /**
   * ตรวจสอบสถานะการเก็บสินค้า (Picking Status)
   */
  async checkPickingStatus(orderNumber: string, adminUsername: string): Promise<WMSPickingResult> {
    try {
      const url = new URL(WMS_CONFIG.endpoints.pickingStatus, this.baseUrl);
      url.searchParams.append('order', orderNumber);
      url.searchParams.append('admin', adminUsername);

      const requestUrl = url.toString();
      const response = await this.fetchWithRetry(requestUrl);
      const data: WMSPickingStatusResponse = await response.json();

      return {
        status: this.mapPickingStatus(data.status),
        orderNumber,
        message: data.message || this.getPickingStatusMessage(data.status),
        rawStatus: data.status,
        rawResponse: data,
        requestUrl,
      };
    } catch (error) {
      console.error('WMS Picking Status Check Error:', error);
      return {
        status: 'error',
        orderNumber,
        message: `เกิดข้อผิดพลาดในการตรวจสอบสถานะการเก็บสินค้า: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * ตรวจสอบจำนวนสินค้าคงคลัง (Stock Quantity)
   */
  async checkStockQuantity(wmsConfig: WMSConfig): Promise<WMSStockResult> {
    try {
      const url = new URL(WMS_CONFIG.endpoints.stockStatus, this.baseUrl);
      url.searchParams.append('productcode', wmsConfig.productCode);
      url.searchParams.append('admin', wmsConfig.adminUsername);
      url.searchParams.append('lotgen', wmsConfig.lotGen);
      url.searchParams.append('locationbin', wmsConfig.locationBin);
      
      if (wmsConfig.lotMfg) {
        url.searchParams.append('lotmfg', wmsConfig.lotMfg);
      }

      const requestUrl = url.toString();
      const response = await this.fetchWithRetry(requestUrl);
      const data: WMSStockStatusResponse = await response.json();

      return {
        status: this.mapStockStatus(data.status, data.total_qty || 0),
        quantity: data.total_qty || 0,
        productCode: wmsConfig.productCode,
        message: data.message || this.getStockStatusMessage(data.status, data.total_qty || 0),
        rawStatus: data.status,
        rawResponse: data,
        requestUrl,
      };
    } catch (error) {
      console.error('WMS Stock Check Error:', error);
      return {
        status: 'error',
        quantity: 0,
        productCode: wmsConfig.productCode,
        message: `เกิดข้อผิดพลาดในการตรวจสอบสต็อกสินค้า: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * ตรวจสอบสต็อกสินค้าหลายรายการพร้อมกัน
   */
  async checkMultipleStocks(wmsConfigs: WMSConfig[]): Promise<WMSStockResult[]> {
    const promises = wmsConfigs.map(config => this.checkStockQuantity(config));
    return Promise.all(promises);
  }

  /**
   * ตรวจสอบสต็อกแบบผูกกับ variant-level config
   */
  async checkStockForVariant(config: WMSVariantConfig): Promise<WMSStockResult> {
    return this.checkStockQuantity({
      productCode: config.productCode,
      lotGen: config.lotGen,
      locationBin: config.locationBin,
      lotMfg: config.lotMfg,
      adminUsername: config.adminUsername,
    });
  }

  /**
   * Fetch with retry mechanism
   */
  private async fetchWithRetry(url: string, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WinRich-WMS-Integration/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.warn(`WMS API call failed (attempt ${attempt}/${this.retryAttempts}):`, error);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Map WMS picking status to internal status
   */
  private mapPickingStatus(status: string): WMSPickingStatus {
    switch (status) {
      case WMS_STATUS_CODES.SUCCESS:
        return 'completed';
      case WMS_STATUS_CODES.PARTIAL_SUCCESS:
        return 'incomplete';
      case WMS_STATUS_CODES.NOT_FOUND:
        return 'not_found';
      default:
        return 'error';
    }
  }

  /**
   * Map WMS stock status to internal status
   */
  private mapStockStatus(status: string, quantity: number): WMSStockStatus {
    switch (status) {
      case WMS_STATUS_CODES.SUCCESS:
        return quantity > 0 ? 'available' : 'out_of_stock';
      case WMS_STATUS_CODES.PARTIAL_SUCCESS:
        return 'out_of_stock';
      case WMS_STATUS_CODES.NOT_FOUND:
        return 'not_found';
      default:
        return 'error';
    }
  }

  /**
   * Get picking status message in Thai
   */
  private getPickingStatusMessage(status: string): string {
    switch (status) {
      case WMS_STATUS_CODES.SUCCESS:
        return 'เก็บสินค้าครบถ้วนแล้ว';
      case WMS_STATUS_CODES.PARTIAL_SUCCESS:
        return 'ยังเก็บสินค้าไม่ครบ';
      case WMS_STATUS_CODES.NOT_FOUND:
        return 'ไม่พบออเดอร์ในระบบ WMS';
      default:
        return 'เกิดข้อผิดพลาดในการตรวจสอบ';
    }
  }

  /**
   * Get stock status message in Thai
   */
  private getStockStatusMessage(status: string, quantity: number): string {
    switch (status) {
      case WMS_STATUS_CODES.SUCCESS:
        return quantity > 0 ? `มีสินค้าในสต็อก ${quantity} หน่วย` : 'สินค้าหมดสต็อก';
      case WMS_STATUS_CODES.PARTIAL_SUCCESS:
        return 'สินค้าหมดสต็อก';
      case WMS_STATUS_CODES.NOT_FOUND:
        return 'ไม่พบสินค้าในระบบ WMS';
      default:
        return 'เกิดข้อผิดพลาดในการตรวจสอบสต็อก';
    }
  }

  /**
   * Utility function for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate WMS configuration
   */
  static validateWMSConfig(config: Partial<WMSConfig>): string[] {
    const errors: string[] = [];

    if (!config.productCode?.trim()) {
      errors.push('รหัสสินค้า (Product Code) จำเป็นต้องระบุ');
    }

    if (!config.lotGen?.trim()) {
      errors.push('หมายเลข Lot Generate จำเป็นต้องระบุ');
    }

    if (!config.locationBin?.trim()) {
      errors.push('ตำแหน่งสินค้า (Location Bin) จำเป็นต้องระบุ');
    }

    if (!config.adminUsername?.trim()) {
      errors.push('ชื่อผู้ใช้แอดมิน จำเป็นต้องระบุ');
    }

    return errors;
  }
}

// Export singleton instance
export const wmsService = new WMSService();