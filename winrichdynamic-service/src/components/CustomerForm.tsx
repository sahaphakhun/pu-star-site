'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface CustomerFormData {
  name: string;
  phoneNumber: string;
  email: string;
  taxId: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  customerType: 'new' | 'regular' | 'target' | 'inactive';
  assignedTo: string;
  creditLimit: string;
  paymentTerms: string;
  notes: string;
  isActive: boolean;
}

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phoneNumber: '',
    email: '',
    taxId: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    customerType: 'new',
    assignedTo: '',
    creditLimit: '',
    paymentTerms: 'ชำระเงินทันที',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [showCompanyFields, setShowCompanyFields] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        creditLimit: initialData.creditLimit?.toString() || '',
      }));
      setShowCompanyFields(!!(initialData.companyName || initialData.companyAddress || initialData.companyPhone || initialData.companyEmail));
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อลูกค้า';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'กรุณาระบุเบอร์โทรศัพท์';
    } else if (!/^\+?66\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (formData.taxId && !/^\d{13}$/.test(formData.taxId)) {
      newErrors.taxId = 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
    }

    if (formData.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'รูปแบบอีเมลบริษัทไม่ถูกต้อง';
    }

    if (formData.companyPhone && !/^\+?66\d{9}$/.test(formData.companyPhone)) {
      newErrors.companyPhone = 'รูปแบบเบอร์โทรศัพท์บริษัทไม่ถูกต้อง';
    }

    if (formData.creditLimit && parseFloat(formData.creditLimit) < 0) {
      newErrors.creditLimit = 'วงเงินเครดิตต้องไม่ต่ำกว่า 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('กรุณาตรวจสอบข้อมูลให้ถูกต้อง');
      return;
    }

    try {
      const submitData = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      };
      
      await onSubmit(submitData);
      toast.success(isEditing ? 'อัพเดทข้อมูลลูกค้าเรียบร้อยแล้ว' : 'สร้างลูกค้าใหม่เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
        </h2>
        <p className="text-gray-600">
          กรอกข้อมูลลูกค้าให้ครบถ้วนเพื่อการจัดการที่มีประสิทธิภาพ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ข้อมูลพื้นฐาน */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ชื่อลูกค้า"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+66xxxxxxxxx หรือ 0xxxxxxxxx"
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลขประจำตัวผู้เสียภาษี
            </label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.taxId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1234567890123"
              maxLength={13}
            />
            {errors.taxId && <p className="text-red-500 text-sm mt-1">{errors.taxId}</p>}
          </div>
        </div>

        {/* ประเภทลูกค้าและผู้รับผิดชอบ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทลูกค้า
            </label>
            <select
              value={formData.customerType}
              onChange={(e) => handleInputChange('customerType', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">ลูกค้าใหม่</option>
              <option value="regular">ลูกค้าปกติ</option>
              <option value="target">ลูกค้าเป้าหมาย</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ผู้รับผิดชอบ
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ชื่อผู้รับผิดชอบ"
            />
          </div>
        </div>

        {/* ข้อมูลบริษัท */}
        <div className="border-t pt-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="showCompanyFields"
              checked={showCompanyFields}
              onChange={(e) => setShowCompanyFields(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="showCompanyFields" className="text-sm font-medium text-gray-700">
              เพิ่มข้อมูลบริษัท
            </label>
          </div>

          {showCompanyFields && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อบริษัท
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อบริษัท"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์บริษัท
                </label>
                <input
                  type="text"
                  value={formData.companyPhone}
                  onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.companyPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+66xxxxxxxxx หรือ 0xxxxxxxxx"
                />
                {errors.companyPhone && <p className="text-red-500 text-sm mt-1">{errors.companyPhone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่บริษัท
                </label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ที่อยู่บริษัท"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมลบริษัท
                </label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.companyEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="company@example.com"
                />
                {errors.companyEmail && <p className="text-red-500 text-sm mt-1">{errors.companyEmail}</p>}
              </div>
            </motion.div>
          )}
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วงเงินเครดิต
            </label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => handleInputChange('creditLimit', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.creditLimit ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              min="0"
              step="0.01"
            />
            {errors.creditLimit && <p className="text-red-500 text-sm mt-1">{errors.creditLimit}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เงื่อนไขการชำระเงิน
            </label>
            <input
              type="text"
              value={formData.paymentTerms}
              onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ชำระเงินทันที"
            />
          </div>
        </div>

        {/* หมายเหตุ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            หมายเหตุ
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="หมายเหตุเพิ่มเติม"
          />
        </div>

        {/* สถานะการใช้งาน */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            ลูกค้าที่ใช้งานอยู่
          </label>
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'กำลังดำเนินการ...' : (isEditing ? 'อัพเดท' : 'สร้าง')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CustomerForm;
