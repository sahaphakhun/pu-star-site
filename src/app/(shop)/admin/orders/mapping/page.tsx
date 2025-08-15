'use client';

import React from 'react';
import OrderMappingManager from '@/components/OrderMappingManager';

const AdminOrderMappingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการการเชื่อมโยงออเดอร์</h1>
          <p className="text-gray-600">เชื่อมโยงออเดอร์กับผู้ใช้โดยอัตโนมัติหรือด้วยตนเอง</p>
        </div>

        <OrderMappingManager />
      </div>
    </div>
  );
};

export default AdminOrderMappingPage;

'use client';

import React from 'react';
import { PermissionGate } from '@/components/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions';
import OrderMappingManager from '@/components/OrderMappingManager';
import DatabaseStatus from '@/components/DatabaseStatus';

const OrderMappingPage = () => {
  return (
    <PermissionGate permission={PERMISSIONS.ORDERS_VIEW}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">จัดการการเชื่อมโยงออเดอร์</h1>
            <p className="mt-2 text-gray-600">
              จัดการการเชื่อมโยงระหว่างออเดอร์กับผู้ใช้ในระบบ
            </p>
          </div>

          {/* Database Status */}
          <div className="mb-8">
            <DatabaseStatus />
          </div>

          {/* Order Mapping Manager */}
          <OrderMappingManager />
        </div>
      </div>
    </PermissionGate>
  );
};

export default OrderMappingPage;
