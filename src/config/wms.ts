// WMS Thailand API Configuration
export const WMS_CONFIG = {
  baseUrl: 'https://www.wmsthailand.com/substock/php',
  endpoints: {
    pickingStatus: '/check_pick_status.php',
    stockStatus: '/check_stock_status.php'
  },
  // ค่าเริ่มต้นสำหรับ admin username (สามารถ override ได้ใน product config)
  defaultAdminUsername: process.env.WMS_DEFAULT_ADMIN || 'Admin',
  // Timeout สำหรับ API calls (milliseconds)
  timeout: 10000,
  // จำนวนครั้งที่จะลองใหม่เมื่อ API call ล้มเหลว
  retryAttempts: 3,
  // เวลารอระหว่างการลองใหม่ (milliseconds)
  retryDelay: 1000
} as const;

// Status code mappings
export const WMS_STATUS_CODES = {
  SUCCESS: '400',
  PARTIAL_SUCCESS: '401', 
  NOT_FOUND: '405',
  ERROR: 'error'
} as const;

// สำหรับ validation
export const WMS_VALIDATION = {
  productCode: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[A-Za-z0-9\-_]+$/
  },
  lotGen: {
    minLength: 1,
    maxLength: 50
  },
  locationBin: {
    minLength: 1,
    maxLength: 50
  },
  adminUsername: {
    minLength: 1,
    maxLength: 100
  }
} as const;