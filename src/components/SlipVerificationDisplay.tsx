import React from 'react';
import { motion } from 'framer-motion';

interface SlipVerificationData {
  verified: boolean;
  verifiedAt: Date;
  verificationType: 'manual' | 'automatic' | 'batch';
  verifiedBy: string;
  slip2GoData?: {
    bank: string;
    amount: number;
    date: string;
    time: string;
    transaction_id: string;
    sender_name: string;
    sender_account: string;
    receiver_name: string;
    receiver_account: string;
    slip_type: string;
    confidence: number;
  };
  error?: string;
  confidence: number;
}

interface SlipVerificationDisplayProps {
  verification: SlipVerificationData;
  className?: string;
}

const SlipVerificationDisplay: React.FC<SlipVerificationDisplayProps> = ({ 
  verification, 
  className = '' 
}) => {
  const getVerificationTypeLabel = (type: string) => {
    switch (type) {
      case 'manual': return 'ตรวจสอบด้วยตนเอง';
      case 'automatic': return 'ตรวจสอบอัตโนมัติ';
      case 'batch': return 'ตรวจสอบแบบกลุ่ม';
      default: return type;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'สูง';
    if (confidence >= 60) return 'ปานกลาง';
    return 'ต่ำ';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">สถานะการตรวจสอบสลิป</h4>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          verification.verified 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {verification.verified ? 'ตรวจสอบแล้ว' : 'ตรวจสอบไม่สำเร็จ'}
        </div>
      </div>

      {verification.verified && verification.slip2GoData ? (
        <div className="space-y-3">
          {/* ข้อมูลธนาคาร */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">ธนาคาร:</span>
              <p className="font-medium">{verification.slip2GoData.bank}</p>
            </div>
            <div>
              <span className="text-gray-500">จำนวนเงิน:</span>
              <p className="font-medium">฿{verification.slip2GoData.amount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">วันที่:</span>
              <p className="font-medium">{verification.slip2GoData.date}</p>
            </div>
            <div>
              <span className="text-gray-500">เวลา:</span>
              <p className="font-medium">{verification.slip2GoData.time}</p>
            </div>
          </div>

          {/* ข้อมูลผู้ส่ง */}
          <div className="border-t pt-3">
            <h5 className="text-xs font-medium text-gray-600 mb-2">ข้อมูลผู้ส่ง</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">ชื่อ:</span>
                <p className="font-medium">{verification.slip2GoData.sender_name}</p>
              </div>
              <div>
                <span className="text-gray-500">เลขบัญชี:</span>
                <p className="font-medium">{verification.slip2GoData.sender_account}</p>
              </div>
            </div>
          </div>

          {/* ข้อมูลผู้รับ */}
          <div className="border-t pt-3">
            <h5 className="text-xs font-medium text-gray-600 mb-2">ข้อมูลผู้รับ</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">ชื่อ:</span>
                <p className="font-medium">{verification.slip2GoData.receiver_name}</p>
              </div>
              <div>
                <span className="text-gray-500">เลขบัญชี:</span>
                <p className="font-medium">{verification.slip2GoData.receiver_account}</p>
              </div>
            </div>
          </div>

          {/* ข้อมูลเพิ่มเติม */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Transaction ID:</span>
                <p className="font-medium text-xs">{verification.slip2GoData.transaction_id}</p>
              </div>
              <div>
                <span className="text-gray-500">ประเภทสลิป:</span>
                <p className="font-medium">{verification.slip2GoData.slip_type}</p>
              </div>
            </div>
          </div>

          {/* ความแม่นยำ */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">ความแม่นยำ:</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getConfidenceColor(verification.confidence)}`}>
                  {getConfidenceLabel(verification.confidence)}
                </span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      verification.confidence >= 80 ? 'bg-green-500' :
                      verification.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${verification.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{verification.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          <p>ไม่สามารถตรวจสอบสลิปได้</p>
          {verification.error && (
            <p className="text-red-600 mt-1">ข้อผิดพลาด: {verification.error}</p>
          )}
        </div>
      )}

      {/* ข้อมูลการตรวจสอบ */}
      <div className="border-t mt-4 pt-3">
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div>
            <span>ตรวจสอบโดย:</span>
            <p className="font-medium">{verification.verifiedBy}</p>
          </div>
          <div>
            <span>ประเภท:</span>
            <p className="font-medium">{getVerificationTypeLabel(verification.verificationType)}</p>
          </div>
          <div className="col-span-2">
            <span>วันที่ตรวจสอบ:</span>
            <p className="font-medium">
              {new Date(verification.verifiedAt).toLocaleString('th-TH')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SlipVerificationDisplay;
