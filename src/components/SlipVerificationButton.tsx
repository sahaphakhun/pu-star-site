import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface SlipVerificationButtonProps {
  orderId: string;
  slipUrl: string;
  onVerificationComplete?: (verification: any) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

const SlipVerificationButton: React.FC<SlipVerificationButtonProps> = ({
  orderId,
  slipUrl,
  onVerificationComplete,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border border-gray-600',
    outline: 'bg-white hover:bg-gray-50 text-blue-600 border border-blue-600'
  };

  const handleVerifySlip = async () => {
    if (!slipUrl) {
      toast.error('ไม่พบ URL ของสลิป');
      return;
    }

    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/admin/slip-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          slipUrl,
          verificationType: 'manual'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ตรวจสอบสลิปสำเร็จ');
        onVerificationComplete?.(data.verification);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป');
      }
    } catch (error) {
      console.error('Slip verification error:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleVerifySlip}
      disabled={isVerifying}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center space-x-2
        ${className}
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
          <span>ตรวจสอบสลิป</span>
        </>
      )}
    </motion.button>
  );
};

export default SlipVerificationButton;
