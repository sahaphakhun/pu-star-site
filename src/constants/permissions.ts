// ประเภทสิทธิ์ที่มีในระบบ
export const PERMISSIONS = {
  // การจัดการออเดอร์
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_EXPORT: 'orders.export',
  ORDERS_CLAIMS_VIEW: 'orders.claims.view',
  ORDERS_CLAIMS_MANAGE: 'orders.claims.manage',

  // การจัดการลูกค้า
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_ASSIGN: 'customers.assign',
  CUSTOMERS_STATS_UPDATE: 'customers.stats.update',
  CUSTOMERS_EXPORT: 'customers.export',

  // การจัดการสินค้า
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_EXPORT: 'products.export',

  // การตั้งค่าระบบ
  SETTINGS_GENERAL: 'settings.general',
  SETTINGS_PAYMENT: 'settings.payment',
  SETTINGS_SHIPPING: 'settings.shipping',
  SETTINGS_NOTIFICATION: 'settings.notification',
  SETTINGS_SMS: 'settings.sms',
  SETTINGS_THEME: 'settings.theme',
  SETTINGS_BACKUP: 'settings.backup',
  SETTINGS_SCHEDULER: 'settings.scheduler',

  // การจัดการผู้ใช้
  USERS_VIEW: 'users.view',
  USERS_PERMISSIONS_MANAGE: 'users.permissions.manage',

  // การแจ้งเตือน
  NOTIFICATIONS_SEND: 'notifications.send',
  NOTIFICATIONS_VIEW: 'notifications.view',

  // รายงานและข้อมูล
  DASHBOARD_VIEW: 'dashboard.view',
  REPORTS_VIEW: 'reports.view',
  DATA_EXPORT: 'data.export',
} as const;

// สร้าง array ของสิทธิ์ทั้งหมด
export const ALL_PERMISSIONS = Object.values(PERMISSIONS); 