'use client';

import React from 'react';
import { PermissionGate } from '@/components/PermissionGate';
import { PERMISSIONS } from '@/constants/permissions';
import OrderMappingManager from '@/components/OrderMappingManager';


const AdminOrderMappingPage = () => {
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

export default AdminOrderMappingPage;
