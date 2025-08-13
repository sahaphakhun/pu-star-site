import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Order {
  _id: string;
  customerName: string;
  slipUrl?: string;
  slipVerification?: {
    verified: boolean;
    verifiedAt: Date;
  };
}

interface BatchSlipVerificationProps {
  orders: Order[];
  onVerificationComplete?: (results: any[]) => void;
  className?: string;
}

const BatchSlipVerification: React.FC<BatchSlipVerificationProps> = ({
  orders,
  onVerificationComplete,
  className = ''
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOrder, setCurrentOrder] = useState<string>('');

  // กรองออเดอร์ที่มีสลิปแต่ยังไม่เคยตรวจสอบ
  const ordersToVerify = orders.filter(order => 
    order.slipUrl && (!order.slipVerification || !order.slipVerification.verified)
  );

  const handleBatchVerify = async () => {
    if (ordersToVerify.length === 0) {
      toast.error('ไม่มีออเดอร์ที่ต้องตรวจสอบสลิป');
      return;
    }

    setIsVerifying(true);
    setProgress(0);
    
    const results = [];
    const orderIds = ordersToVerify.map(order => order._id);

    try {
      const response = await fetch('/api/admin/slip-verification', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds
        }),
      });

      const data = await response.json();

      if (data.success) {
        const successCount = data.results.filter((r: any) => r.success).length;
        const failCount = data.results.length - successCount;
        
        toast.success(`ตรวจสอบสลิปเสร็จสิ้น: สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
        onVerificationComplete?.(data.results);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการตรวจสอบสลิปแบบกลุ่ม');
      }
    } catch (error) {
      console.error('Batch slip verification error:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsVerifying(false);
      setProgress(0);
      setCurrentOrder('');
    }
  };

  const getVerificationStatus = (order: Order) => {
    if (!order.slipUrl) return { status: 'no-slip', label: 'ไม่มีสลิป', color: 'text-gray-500' };
    if (!order.slipVerification) return { status: 'not-verified', label: 'ยังไม่ตรวจสอบ', color: 'text-yellow-600' };
    if (order.slipVerification.verified) return { status: 'verified', label: 'ตรวจสอบแล้ว', color: 'text-green-600' };
    return { status: 'failed', label: 'ตรวจสอบไม่สำเร็จ', color: 'text-red-600' };
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">ตรวจสอบสลิปแบบกลุ่ม</h3>
        <div className="text-sm text-gray-500">
          {ordersToVerify.length} รายการที่ต้องตรวจสอบ
        </div>
      </div>

      {/* สถิติ */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          <div className="text-xs text-gray-500">ทั้งหมด</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{ordersToVerify.length}</div>
          <div className="text-xs text-gray-500">รอตรวจสอบ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.slipVerification?.verified).length}
          </div>
          <div className="text-xs text-gray-500">ตรวจสอบแล้ว</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {orders.filter(o => !o.slipUrl).length}
          </div>
          <div className="text-xs text-gray-500">ไม่มีสลิป</div>
        </div>
      </div>

      {/* Progress Bar */}
      {isVerifying && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>กำลังตรวจสอบ...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {currentOrder && (
            <div className="text-xs text-gray-500 mt-1">
              กำลังตรวจสอบ: {currentOrder}
            </div>
          )}
        </div>
      )}

      {/* รายการออเดอร์ */}
      <div className="max-h-64 overflow-y-auto">
        <div className="space-y-2">
          {orders.slice(0, 10).map((order) => {
            const status = getVerificationStatus(order);
            return (
              <div key={order._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium">{order.customerName}</div>
                  <div className="text-xs text-gray-500">ID: {order._id}</div>
                </div>
                <div className={`text-xs font-medium ${status.color}`}>
                  {status.label}
                </div>
              </div>
            );
          })}
          {orders.length > 10 && (
            <div className="text-center text-sm text-gray-500 py-2">
              และอีก {orders.length - 10} รายการ...
            </div>
          )}
        </div>
      </div>

      {/* ปุ่มดำเนินการ */}
      <div className="mt-4 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBatchVerify}
          disabled={isVerifying || ordersToVerify.length === 0}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center space-x-2
            ${ordersToVerify.length > 0 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isVerifying ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>กำลังตรวจสอบ...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ตรวจสอบทั้งหมด ({ordersToVerify.length})</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default BatchSlipVerification;
