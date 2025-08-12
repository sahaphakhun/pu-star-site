'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface QuotationItem {
  productId: string;
  productName: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
  totalPrice: string;
}

interface QuotationFormData {
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerAddress: string;
  customerPhone: string;
  subject: string;
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  items: QuotationItem[];
  vatRate: string;
  assignedTo: string;
  notes: string;
}

interface Customer {
  _id: string;
  name: string;
  taxId?: string;
  companyAddress?: string;
  companyPhone?: string;
}

interface QuotationFormProps {
  initialData?: Partial<QuotationFormData>;
  customers: Customer[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const QuotationForm: React.FC<QuotationFormProps> = ({
  initialData,
  customers,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState<QuotationFormData>({
    customerId: '',
    customerName: '',
    customerTaxId: '',
    customerAddress: '',
    customerPhone: '',
    subject: '',
    validUntil: '',
    paymentTerms: 'ชำระเงินทันที',
    deliveryTerms: '',
    items: [
      {
        productId: '',
        productName: '',
        description: '',
        quantity: '',
        unit: '',
        unitPrice: '',
        discount: '0',
        totalPrice: '',
      }
    ],
    vatRate: '7',
    assignedTo: '',
    notes: '',
  });

  type QuotationFormErrors = Partial<Record<keyof QuotationFormData, string>>;
  const [errors, setErrors] = useState<QuotationFormErrors>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
      
      // หาลูกค้าที่เลือก
      if (initialData.customerId) {
        const customer = customers.find(c => c._id === initialData.customerId);
        if (customer) {
          setSelectedCustomer(customer);
        }
      }
    }
  }, [initialData, customers]);

  // คำนวณราคารวมของแต่ละรายการ
  const calculateItemTotal = (item: QuotationItem): number => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discount) || 0;
    return quantity * unitPrice * (1 - discount / 100);
  };

  // คำนวณราคารวมทั้งหมด
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    }, 0);
    
    const totalDiscount = formData.items.reduce((sum, item) => {
      return sum + calculateItemTotal(item) * (parseFloat(item.discount) || 0) / 100;
    }, 0);
    
    const totalAmount = subtotal - totalDiscount;
    const vatAmount = totalAmount * (parseFloat(formData.vatRate) / 100);
    const grandTotal = totalAmount + vatAmount;
    
    return { subtotal, totalDiscount, totalAmount, vatAmount, grandTotal };
  };

  const validateForm = (): boolean => {
    const newErrors: QuotationFormErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = 'กรุณาเลือกลูกค้า';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'กรุณาระบุหัวข้อใบเสนอราคา';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'กรุณาระบุวันหมดอายุ';
    }

    if (!formData.paymentTerms.trim()) {
      newErrors.paymentTerms = 'กรุณาระบุเงื่อนไขการชำระเงิน';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ';
    }

    // ตรวจสอบรายการสินค้า
    formData.items.forEach((item, index) => {
      if (!item.productName.trim()) {
        newErrors.items = 'กรุณาระบุชื่อสินค้าทุกรายการ';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors.items = 'กรุณาระบุจำนวนสินค้าทุกรายการ';
      }
      if (!item.unit.trim()) {
        newErrors.items = 'กรุณาระบุหน่วยสินค้าทุกรายการ';
      }
      if (!item.unitPrice || parseFloat(item.unitPrice) < 0) {
        newErrors.items = 'กรุณาระบุราคาต่อหน่วยสินค้าทุกรายการ';
      }
    });

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
        items: formData.items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount),
          totalPrice: calculateItemTotal(item),
        })),
        vatRate: parseFloat(formData.vatRate),
      };
      
      await onSubmit(submitData);
      toast.success(isEditing ? 'อัพเดทใบเสนอราคาเรียบร้อยแล้ว' : 'สร้างใบเสนอราคาใหม่เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleInputChange = (field: keyof QuotationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c._id === customerId) || null;
    setSelectedCustomer(customer);
    
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerTaxId: customer.taxId || '',
        customerAddress: customer.companyAddress || '',
        customerPhone: customer.companyPhone || '',
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // คำนวณราคารวมของรายการนี้
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = newItems[index];
      const total = calculateItemTotal(item);
      newItems[index].totalPrice = total.toFixed(2);
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          productName: '',
          description: '',
          quantity: '',
          unit: '',
          unitPrice: '',
          discount: '0',
          totalPrice: '',
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const { subtotal, totalDiscount, totalAmount, vatAmount, grandTotal } = calculateTotals();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่'}
        </h2>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ✕ ยกเลิก
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ข้อมูลลูกค้า */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกลูกค้า *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">เลือกลูกค้า</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อลูกค้า *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ชื่อลูกค้า"
            />
            {errors.customerName && (
              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลขประจำตัวผู้เสียภาษี
            </label>
            <input
              type="text"
              value={formData.customerTaxId}
              onChange={(e) => handleInputChange('customerTaxId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก"
              maxLength={13}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรศัพท์
            </label>
            <input
              type="text"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เบอร์โทรศัพท์"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ที่อยู่
            </label>
            <input
              type="text"
              value={formData.customerAddress}
              onChange={(e) => handleInputChange('customerAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ที่อยู่ลูกค้า"
            />
          </div>
        </div>

        {/* ข้อมูลใบเสนอราคา */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หัวข้อใบเสนอราคา *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="หัวข้อใบเสนอราคา"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันหมดอายุ *
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleInputChange('validUntil', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.validUntil ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.validUntil && (
              <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เงื่อนไขการชำระเงิน *
            </label>
            <input
              type="text"
              value={formData.paymentTerms}
              onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.paymentTerms ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="เงื่อนไขการชำระเงิน"
            />
            {errors.paymentTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentTerms}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เงื่อนไขการส่งมอบ
            </label>
            <input
              type="text"
              value={formData.deliveryTerms}
              onChange={(e) => handleInputChange('deliveryTerms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เงื่อนไขการส่งมอบ"
            />
          </div>
        </div>

        {/* รายการสินค้า */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">รายการสินค้า</h3>
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              + เพิ่มสินค้า
            </button>
          </div>

          {errors.items && (
            <p className="text-red-500 text-sm mb-4">{errors.items}</p>
          )}

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อสินค้า *
                    </label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อสินค้า"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รายละเอียด
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="รายละเอียด"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวน *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หน่วย *
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชิ้น, กล่อง"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ราคาต่อหน่วย *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ส่วนลด (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    ราคารวม: <span className="font-medium">฿{parseFloat(item.totalPrice || '0').toFixed(2)}</span>
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-3 py-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* สรุปราคา */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">สรุปราคา</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">ราคารวม:</span>
                <span className="font-medium">฿{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ส่วนลดรวม:</span>
                <span className="font-medium">฿{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ราคาหลังหักส่วนลด:</span>
                <span className="font-medium">฿{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">อัตราภาษีมูลค่าเพิ่ม:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vatRate}
                    onChange={(e) => handleInputChange('vatRate', e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    min="0"
                    max="100"
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ภาษีมูลค่าเพิ่ม:</span>
                <span className="font-medium">฿{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>ราคารวมทั้งสิ้น:</span>
                <span>฿{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="md:col-span-2">
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
        </div>

        {/* ปุ่มบันทึก */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'กำลังบันทึก...' : (isEditing ? 'อัพเดท' : 'สร้างใบเสนอราคา')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default QuotationForm;
