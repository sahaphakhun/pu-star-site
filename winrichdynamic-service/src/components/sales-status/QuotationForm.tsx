"use client";

import { useState } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import ProductAutocomplete from '@/components/ui/ProductAutocomplete';

interface QuotationFormProps {
  customer?: any;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  product?: any;
}

interface QuotationHistory {
  quotationId: string;
  date: Date;
  amount: number;
  status: string;
}

export default function QuotationForm({ customer, onClose, onSubmit }: QuotationFormProps) {
  const [formData, setFormData] = useState({
    customerId: customer?._id || customer?.id || '',
    customerCode: customer?.customerCode || '',
    quotationHistory: (customer?.quotationHistory || []) as QuotationHistory[],
    newQuotationReason: customer?.newQuotationReason || '',
    items: [
      {
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
        total: 0,
        product: null,
      }
    ] as QuotationItem[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
        total: 0,
      }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    
    // คำนวณยอดรวมใหม่
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleProductSelect = (index: number, product: any | null) => {
    const newItems = [...formData.items];
    const current = newItems[index];

    if (!product) {
      newItems[index] = {
        ...current,
        product: null,
        productId: '',
        productName: '',
      };
      setFormData({ ...formData, items: newItems });
      return;
    }

    const resolvedPrice = product.price ?? product.units?.[0]?.price ?? current.price ?? 0;
    newItems[index] = {
      ...current,
      product,
      productId: product.sku || product._id || current.productId,
      productName: product.name || current.productName,
      price: resolvedPrice,
      total: (current.quantity || 0) * resolvedPrice,
    };

    setFormData({ ...formData, items: newItems });
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      // ตรวจสอบข้อมูลที่จำเป็น
      if (formData.items.some(item => !item.productName || item.quantity <= 0 || item.price <= 0)) {
        throw new Error('กรุณาระบุข้อมูลสินค้าให้ครบถ้วน');
      }

      // สร้าง payload สำหรับส่งไปยัง API
      const payload = {
        ...formData,
        status: 'quoted', // อัปเดตสถานะเป็น "เสนอราคา"
        grandTotal: calculateGrandTotal(),
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">เสนอราคา</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* ข้อมูลลูกค้า */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">👤</span> ข้อมูลลูกค้า
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อลูกค้า</label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {customer?.name || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">รหัสลูกค้า</label>
                  <div className="p-2 bg-gray-50 rounded border font-mono">
                    {customer?.customerCode || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* ประวัติใบเสนอราคา */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📋</span> ประวัติใบเสนอราคา
              </h3>
              
              {formData.quotationHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">เลขที่ใบเสนอราคา</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">วันที่</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">จำนวนเงิน</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.quotationHistory.map((quotation, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{quotation.quotationId}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(quotation.date).toLocaleDateString('th-TH')}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {quotation.amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{quotation.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  ยังไม่มีประวัติใบเสนอราคา
                </div>
              )}
            </div>

            {/* รายการสินค้า */}
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">🛒</span> รายการสินค้า
                </h3>
                <Button
                  type="button"
                  onClick={addItem}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1"
                >
                  <Plus size={16} className="mr-1" /> เพิ่มรายการ
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">ชื่อสินค้า</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">รหัสสินค้า</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">จำนวน</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">ราคา/หน่วย</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">รวม</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">
                          <ProductAutocomplete
                            value={item.product || null}
                            onChange={(product) => handleProductSelect(index, product)}
                            placeholder="พิมพ์ชื่อสินค้าหรือรหัสสินค้า"
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            placeholder="รหัสสินค้า"
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full text-center"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full text-right"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {item.total.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={4} className="border border-gray-300 px-4 py-2 text-right">
                        รวมทั้งหมด:
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {calculateGrandTotal().toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                      </td>
                      <td className="border border-gray-300 px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* เหตุผลของการสร้างใบเสนอราคาใหม่ */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📝</span> เหตุผลของการสร้างใบเสนอราคาใหม่
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1">
                  เหตุผลของการสร้างใบเสนอราคาใหม่
                </label>
                <Textarea
                  value={formData.newQuotationReason}
                  onChange={(e) => handleChange('newQuotationReason', e.target.value)}
                  rows={3}
                  placeholder="ระบุเหตุผลของการสร้างใบเสนอราคาใหม่..."
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
