import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ISKU } from '@/models/SKU';
import { IProduct } from '@/models/Product';
import SKUCard from './SKUCard';

interface SKUManagerProps {
  product: IProduct & { _id: string };
  onClose: () => void;
}

const SKUManager: React.FC<SKUManagerProps> = ({ product, onClose }) => {
  const [skus, setSkus] = useState<ISKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSkuId, setCurrentSkuId] = useState<string | null>(null);
  
  // Form states
  const [skuPrefix, setSkuPrefix] = useState('');
  const [unitLabel, setUnitLabel] = useState('');
  const [price, setPrice] = useState('');
  const [shippingFee, setShippingFee] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [maxStockLevel, setMaxStockLevel] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Options states
  const [options, setOptions] = useState<{ name: string; value: string }[]>([]);
  const [optionName, setOptionName] = useState('');
  const [optionValue, setOptionValue] = useState('');

  useEffect(() => {
    fetchSKUs();
  }, [product._id]);

  const fetchSKUs = async () => {
    try {
      const response = await fetch(`/api/admin/sku-configs?productId=${product._id}`);
      const data = await response.json();
      if (data.success) {
        setSkus(data.data);
      }
    } catch (error) {
      console.error('Error fetching SKUs:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล SKU');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSkuPrefix('');
    setUnitLabel('');
    setPrice('');
    setShippingFee('');
    setStockQuantity('');
    setMinStockLevel('');
    setMaxStockLevel('');
    setIsActive(true);
    setOptions([]);
    setOptionName('');
    setOptionValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!skuPrefix || !price) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    try {
      const skuData = {
        productId: product._id,
        skuPrefix,
        unitLabel: unitLabel || undefined,
        options: options.length > 0 ? options.reduce((acc, opt) => ({ ...acc, [opt.name]: opt.value }), {}) : undefined,
        price: parseFloat(price),
        shippingFee: shippingFee ? parseFloat(shippingFee) : undefined,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : undefined,
        minStockLevel: minStockLevel ? parseInt(minStockLevel) : undefined,
        maxStockLevel: maxStockLevel ? parseInt(maxStockLevel) : undefined,
        isActive,
      };

      const url = editMode && currentSkuId 
        ? `/api/admin/sku-configs/${currentSkuId}`
        : '/api/admin/sku-configs';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skuData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'ดำเนินการสำเร็จ');
        fetchSKUs();
        setShowForm(false);
        resetForm();
        setEditMode(false);
        setCurrentSkuId(null);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving SKU:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (sku: ISKU) => {
    setEditMode(true);
    setCurrentSkuId(sku._id);
    setSkuPrefix(sku.skuPrefix);
    setUnitLabel(sku.unitLabel || '');
    setPrice(sku.price.toString());
    setShippingFee(sku.shippingFee?.toString() || '');
    setStockQuantity(sku.stockQuantity?.toString() || '');
    setMinStockLevel(sku.minStockLevel?.toString() || '');
    setMaxStockLevel(sku.maxStockLevel?.toString() || '');
    setIsActive(sku.isActive);
    
    // Convert options back to array format
    if (sku.options && Object.keys(sku.options).length > 0) {
      const optionsArray = Object.entries(sku.options).map(([name, value]) => ({
        name,
        value: value as string,
      }));
      setOptions(optionsArray);
    } else {
      setOptions([]);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (skuId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ SKU นี้?')) return;
    
    try {
      const response = await fetch(`/api/admin/sku-configs/${skuId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'ลบ SKU สำเร็จ');
        fetchSKUs();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting SKU:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ SKU');
    }
  };

  const handleToggleStatus = async (skuId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/sku-configs/${skuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('อัปเดตสถานะสำเร็จ');
        fetchSKUs();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating SKU status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const addOption = () => {
    if (optionName && optionValue) {
      setOptions([...options, { name: optionName, value: optionValue }]);
      setOptionName('');
      setOptionValue('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">จัดการ SKU - {product.name}</h2>
              <p className="text-sm text-gray-600">จัดการ Stock Keeping Units สำหรับสินค้านี้</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - SKU List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">รายการ SKU</h3>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditMode(false);
                    resetForm();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  เพิ่ม SKU ใหม่
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              ) : skus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>ไม่พบข้อมูล SKU สำหรับสินค้านี้</p>
                  <p className="text-sm mt-1">คลิก "เพิ่ม SKU ใหม่" เพื่อเริ่มต้น</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {skus.map((sku) => (
                    <SKUCard
                      key={sku._id}
                      sku={sku}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-1/2 overflow-y-auto">
            {showForm ? (
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">
                  {editMode ? 'แก้ไข SKU' : 'เพิ่ม SKU ใหม่'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ตัวอักษรนำหน้า SKU *
                      </label>
                      <input
                        type="text"
                        value={skuPrefix}
                        onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น PRD, CAT"
                        maxLength={10}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หน่วย
                      </label>
                      <input
                        type="text"
                        value={unitLabel}
                        onChange={(e) => setUnitLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น ชิ้น, กล่อง, เมตร"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ราคา *
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ค่าส่ง
                      </label>
                      <input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        จำนวนสินค้าคงเหลือ
                      </label>
                      <input
                        type="number"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระดับสินค้าขั้นต่ำ
                      </label>
                      <input
                        type="number"
                        value={minStockLevel}
                        onChange={(e) => setMinStockLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระดับสินค้าสูงสุด
                      </label>
                      <input
                        type="number"
                        value={maxStockLevel}
                        onChange={(e) => setMaxStockLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ไม่จำกัด"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        ใช้งาน
                      </label>
                    </div>
                  </div>

                  {/* Options Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium mb-3">ตัวเลือกสินค้า</h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <input
                        type="text"
                        value={optionName}
                        onChange={(e) => setOptionName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ชื่อตัวเลือก เช่น สี, ขนาด"
                      />
                      <input
                        type="text"
                        value={optionValue}
                        onChange={(e) => setOptionValue(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ค่าตัวเลือก เช่น แดง, L"
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
                      >
                        เพิ่มตัวเลือก
                      </button>
                    </div>

                    {options.length > 0 && (
                      <div className="space-y-2">
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded border">
                            <span className="text-sm text-gray-600">
                              {option.name}: {option.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              ลบ
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {editMode ? 'อัปเดต' : 'สร้าง'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditMode(false);
                        resetForm();
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>เลือก SKU จากรายการด้านซ้ายเพื่อแก้ไข</p>
                <p className="text-sm mt-1">หรือคลิก "เพิ่ม SKU ใหม่" เพื่อสร้าง SKU ใหม่</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SKUManager;
