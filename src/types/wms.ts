// WMS Thailand API Types
export interface WMSPickingStatusResponse {
  status: '400' | '401' | '405' | 'error';
  order?: string;
  message?: string;
}

export interface WMSStockStatusResponse {
  status: '400' | '401' | '405' | 'error';
  total_qty?: number;
  productcode?: string;
  lotgenerate?: string;
  lotmfg?: string | null;
  locationbin?: string;
  message?: string;
}

export interface WMSConfig {
  productCode: string;
  lotGen: string;
  locationBin: string;
  lotMfg?: string;
  adminUsername: string;
}

export interface WMSPickingStatusRequest {
  order: string;
  admin: string;
}

export interface WMSStockCheckRequest {
  productcode: string;
  admin: string;
  lotgen: string;
  locationbin: string;
  lotmfg?: string;
}

// Internal status mapping
export type WMSPickingStatus = 'completed' | 'incomplete' | 'not_found' | 'error';
export type WMSStockStatus = 'available' | 'out_of_stock' | 'not_found' | 'error';

export interface WMSStockResult {
  status: WMSStockStatus;
  quantity: number;
  productCode: string;
  message?: string;
  // Debug (optional)
  rawStatus?: string;
  rawResponse?: unknown;
  requestUrl?: string;
}

export interface WMSPickingResult {
  status: WMSPickingStatus;
  orderNumber: string;
  message?: string;
  // Debug (optional)
  rawStatus?: string;
  rawResponse?: unknown;
  requestUrl?: string;
}

// Variant-level WMS configuration
export type WMSVariantOptions = Record<string, string>;

export interface WMSVariantConfig {
  key: string; // unique key for variant (unit + sorted options)
  unitLabel?: string;
  options?: WMSVariantOptions;
  productCode: string;
  lotGen: string;
  locationBin: string;
  lotMfg?: string;
  adminUsername: string;
  isEnabled?: boolean;
}