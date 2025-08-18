import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ISKU } from '@/models/SKU';

interface SKUCardProps {
  sku: ISKU;
  onEdit: (sku: ISKU) => void;
  onDelete: (skuId: string) => void;
  onToggleStatus: (skuId: string, currentStatus: boolean) => void;
}

const SKUCard: React.FC<SKUCardProps> = ({ sku, onEdit, onDelete, onToggleStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatOptions = (options: Record<string, string> | undefined) => {
    if (!options || Object.keys(options).length === 0) return null;
    
    return Object.entries(options).map(([key, value]) => (
      <span key={key} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">
        {key}: {value}
      </span>
    ));
  };

  const getStockStatusColor = (quantity: number | undefined, minLevel: number | undefined) => {
    if (quantity === undefined || minLevel === undefined) return 'text-gray-600';
    if (quantity <= minLevel) return 'text-red-600';
    if (quantity <= minLevel * 1.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg font-semibold text-gray-900">{sku.skuCode}</span>
              <span className="text-sm text-gray-500">({sku.skuPrefix})</span>
            </div>
            
            {sku.unitLabel && (
              <div className="text-sm text-gray-600 mb-1">
                หน่วย: {sku.unitLabel}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleStatus(sku._id, sku.isActive)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                sku.isActive
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {sku.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-sm font-medium text-gray-700">ราคา</div>
            <div className="text-lg font-semibold text-gray-900">฿{sku.price.toLocaleString()}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700">ค่าส่ง</div>
            <div className="text-sm text-gray-900">
              {sku.shippingFee ? `฿${sku.shippingFee.toLocaleString()}` : 'ไม่ระบุ'}
            </div>
          </div>
        </div>

        {/* Stock Info */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-sm font-medium text-gray-700">สินค้าคงเหลือ</div>
            <div className={`text-lg font-semibold ${getStockStatusColor(sku.stockQuantity, sku.minStockLevel)}`}>
              {sku.stockQuantity || 0}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700">ระดับสต็อก</div>
            <div className="text-sm text-gray-900">
              {sku.minStockLevel !== undefined && (
                <span className="block">Min: {sku.minStockLevel}</span>
              )}
              {sku.maxStockLevel !== undefined && (
                <span className="block">Max: {sku.maxStockLevel}</span>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        {sku.options && Object.keys(sku.options).length > 0 && (
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-700 mb-2">ตัวเลือกสินค้า</div>
            <div className="flex flex-wrap">
              {formatOptions(sku.options)}
            </div>
          </div>
        )}

        {/* Expanded Content */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-gray-700">วันที่สร้าง</div>
                <div className="text-sm text-gray-900">
                  {new Date(sku.createdAt).toLocaleDateString('th-TH')}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">อัปเดตล่าสุด</div>
                <div className="text-sm text-gray-900">
                  {new Date(sku.updatedAt).toLocaleDateString('th-TH')}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
          <button
            onClick={() => onEdit(sku)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            แก้ไข
          </button>
          <button
            onClick={() => onDelete(sku._id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            ลบ
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SKUCard;
