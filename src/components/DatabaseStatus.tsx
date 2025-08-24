'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface DatabaseStatusData {
  database: string;
  models: {
    Order: string;
    User: string;
  };
  counts: {
    orders: number;
    users: number;
  };
}

const DatabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
        toast.success('การเชื่อมต่อฐานข้อมูลสำเร็จ');
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">สถานะฐานข้อมูล</h3>
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'กำลังทดสอบ...' : 'ทดสอบใหม่'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">กำลังทดสอบการเชื่อมต่อ...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {status && !loading && (
        <div className="space-y-4">
          {/* สถานะฐานข้อมูล */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">ฐานข้อมูล:</span>
            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
              status.database === 'Connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status.database === 'Connected' ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อล้มเหลว'}
            </span>
          </div>

          {/* สถานะ Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Order Model:</span>
              <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                status.models.Order === 'Accessible' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status.models.Order === 'Accessible' ? 'เข้าถึงได้' : 'เข้าถึงไม่ได้'}
              </span>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">User Model:</span>
              <span className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                status.models.User === 'Accessible' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status.models.User === 'Accessible' ? 'เข้าถึงได้' : 'เข้าถึงไม่ได้'}
              </span>
            </div>
          </div>

          {/* จำนวนข้อมูล */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">จำนวนออเดอร์:</span>
              <span className="ml-2 text-lg font-bold text-blue-800">{status.counts.orders.toLocaleString()}</span>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-700">จำนวนผู้ใช้:</span>
              <span className="ml-2 text-lg font-bold text-purple-800">{status.counts.users.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseStatus;
