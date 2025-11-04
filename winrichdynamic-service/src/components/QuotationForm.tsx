"use client"

import { useState } from 'react';
import { X, Plus, Trash2, Upload, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

// TODO: Replace with actual data context when available
const mockData = {
  customers: [],
  addQuotation: (quotation: any) => console.log('Add quotation:', quotation),
  updateQuotation: (id: string, quotation: any) => console.log('Update quotation:', id, quotation),
};

const defaultFormData = {
  // ข้อมูลลูกค้า
  customerId: '',
  customerName: '',
  projectId: '',
  opportunityId: '',
  
  // วันที่
  issueDate: new Date().toISOString().split('T')[0],
  validUntilDate: '',
  
  // ผู้รับผิดชอบ
  importance: 3,
  owner: 'PU STAR Office',
  team: 'PU STAR Office',
  
  // ข้อมูลผู้ติดต่อ
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  
  // ข้อมูลการจัดส่ง
  deliveryMethod: 'รับเอง',
  deliveryMethodNote: '',
  deliveryDate: '',
  hideDeliveryDate: false,
  
  // ที่อยู่จัดส่ง
  sameAsCompanyAddress: true,
  deliveryLocationName: '',
  deliveryAddress: '',
  deliveryCountry: 'Thailand (ไทย)',
  deliveryProvince: '',
  deliveryDistrict: '',
  
  // รายการสินค้า
  showProductCode: false,
  items: [
    { description: '', quantity: 0, unit: '', pricePerUnit: 0, discountPerUnit: 0, discountPercent: 0, amount: 0, productGroup: '' },
    { description: '', quantity: 0, unit: '', pricePerUnit: 0, discountPerUnit: 0, discountPercent: 0, amount: 0, productGroup: '' },
    { description: '', quantity: 0, unit: '', pricePerUnit: 0, discountPerUnit: 0, discountPercent: 0, amount: 0, productGroup: '' },
  ],
  
  // สรุปยอด
  subtotal: 0,
  vat: 7,
  vatAmount: 0,
  total: 0,
  
  // เงื่อนไข
  paymentTerms: '',
  paymentDays: 0,
  
  // เอกสารแนบ
  attachments: [],
  
  // สถานะ
  status: 'draft',

  // แผนการจัดส่ง
  deliveryBatches: [] as Array<{
    batchId: string;
    deliveryDate: string;
    quantity: number;
    notes?: string;
  }>,
  isSplitDelivery: false,
};

interface QuotationFormProps {
  quotation?: any;
  initialData?: any;
  customers?: any[];
  onSubmit?: (quotationData: any) => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  onSave?: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

export default function QuotationForm({
  quotation,
  initialData,
  customers,
  onSubmit,
  onCancel,
  onClose,
  onSave,
}: QuotationFormProps) {
  const dataSource = mockData;
  const customersList = customers ?? dataSource.customers;
  const addQuotation = dataSource.addQuotation;
  const updateQuotation = dataSource.updateQuotation;
  
  const [formData, setFormData] = useState(() => {
    const base = initialData || quotation;
    if (base) {
      const mappedBatches = Array.isArray(base.deliveryBatches)
        ? base.deliveryBatches.map((batch: any, index: number) => ({
            batchId: batch.batchId || `รอบที่ ${index + 1}`,
            deliveryDate: batch.deliveryDate
              ? new Date(batch.deliveryDate).toISOString().split('T')[0]
              : '',
            quantity: Number(batch.deliveredQuantity ?? batch.quantity ?? 0),
            notes: batch.notes || '',
          }))
        : [];

      return {
        ...defaultFormData,
        ...base,
        deliveryBatches: mappedBatches,
        isSplitDelivery: mappedBatches.length > 0,
      };
    }

    return { ...defaultFormData };
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    
    // Auto-fill contact info when customer is selected
    if (field === 'customerId' && value) {
      const customer = customersList.find((c: any) => c.id === value);
      if (customer) {
        const primaryContact = customer.contacts?.[0];
        setFormData((prev: any) => ({
          ...prev,
          customerName: customer.name,
          contactName: primaryContact?.name || '',
          contactEmail: primaryContact?.email || '',
          contactPhone: primaryContact?.phone || '',
        }));
      }
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto calculate
    const item = newItems[index];
    if (field === 'quantity' || field === 'pricePerUnit' || field === 'discountPerUnit' || field === 'discountPercent') {
      // Calculate discount from percent
      if (field === 'discountPercent') {
        item.discountPerUnit = (item.pricePerUnit * value) / 100;
      }
      // Calculate discount percent from amount
      if (field === 'discountPerUnit' && item.pricePerUnit > 0) {
        item.discountPercent = (value / item.pricePerUnit) * 100;
      }
      // Calculate total amount
      item.amount = (item.pricePerUnit - item.discountPerUnit) * item.quantity;
    }
    
    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);
  };

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const vatAmount = (subtotal * formData.vat) / 100;
    const total = subtotal + vatAmount;
    
    setFormData((prev: any) => ({
      ...prev,
      subtotal,
      vatAmount,
      total,
    }));
  };

  const totalItemQuantity = formData.items.reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0
  );

  const plannedDeliveryQuantity = formData.deliveryBatches?.reduce(
    (sum: number, batch: any) => sum + Number(batch.quantity || 0),
    0
  ) || 0;

  const addDeliveryBatch = () => {
    setFormData((prev: any) => {
      const nextIndex = (prev.deliveryBatches?.length || 0) + 1;
      const existingTotalQuantity = prev.items?.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0
      ) || 0;
      const existingPlanned = prev.deliveryBatches?.reduce(
        (sum: number, batch: any) => sum + Number(batch.quantity || 0),
        0
      ) || 0;
      const remaining = Math.max(existingTotalQuantity - existingPlanned, 0);
      const fallbackQuantity = remaining > 0 ? remaining : 0;
      return {
        ...prev,
        deliveryBatches: [
          ...(prev.deliveryBatches || []),
          {
            batchId: `รอบที่ ${nextIndex}`,
            deliveryDate: '',
            quantity: fallbackQuantity,
            notes: '',
          },
        ],
      };
    });
  };

  const updateDeliveryBatch = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const batches = [...(prev.deliveryBatches || [])];
      batches[index] = {
        ...batches[index],
        [field]: field === 'quantity' ? Number(value) : value,
      };
      return { ...prev, deliveryBatches: batches };
    });
  };

  const removeDeliveryBatch = (index: number) => {
    setFormData((prev: any) => {
      const batches = (prev.deliveryBatches || []).filter((_: any, i: number) => i !== index);
      return {
        ...prev,
        deliveryBatches: batches,
      };
    });
  };

  const toggleSplitDelivery = (enabled: boolean) => {
    setFormData((prev: any) => {
      if (!enabled) {
        return { ...prev, isSplitDelivery: false, deliveryBatches: [] };
      }

      const existingTotalQuantity = prev.items?.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0
      ) || 0;

      const existingBatches = prev.deliveryBatches && prev.deliveryBatches.length > 0
        ? prev.deliveryBatches
        : [{
            batchId: 'รอบที่ 1',
            deliveryDate: '',
            quantity: existingTotalQuantity || 0,
            notes: '',
          }];

      return {
        ...prev,
        isSplitDelivery: true,
        deliveryBatches: existingBatches,
      };
    });
  };

  const addItems = (count: number) => {
    const newItems = [...formData.items];
    for (let i = 0; i < count; i++) {
      newItems.push({
        description: '',
        quantity: 0,
        unit: '',
        pricePerUnit: 0,
        discountPerUnit: 0,
        discountPercent: 0,
        amount: 0,
        productGroup: '',
      });
    }
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);
  };

  const handleSubmit = async (e: React.SyntheticEvent, action: string = 'draft') => {
    e.preventDefault();

    const { isSplitDelivery, deliveryBatches, ...rest } = formData as any;

    if (isSplitDelivery) {
      const hasIncompleteBatch = (deliveryBatches || []).some(
        (batch: any) => !batch.deliveryDate || Number(batch.quantity || 0) <= 0
      );
      if (hasIncompleteBatch) {
        alert('กรุณาระบุวันที่และจำนวนสำหรับทุก ๆ รอบการจัดส่ง');
        return;
      }

      const planned = (deliveryBatches || []).reduce(
        (sum: number, batch: any) => sum + Number(batch.quantity || 0),
        0
      );

      if (totalItemQuantity > 0 && planned !== totalItemQuantity) {
        if (!confirm('จำนวนสินค้าที่แบ่งส่งไม่เท่ากับจำนวนรวมทั้งหมด คุณต้องการดำเนินการต่อหรือไม่?')) {
          return;
        }
      }
    }

    const preparedDeliveryBatches = isSplitDelivery
      ? (deliveryBatches || []).map((batch: any, index: number) => ({
          batchId: batch.batchId || `BATCH-${index + 1}`,
          deliveredQuantity: Number(batch.quantity || 0),
          deliveryDate: new Date(batch.deliveryDate).toISOString(),
          deliveryStatus: 'pending',
          notes: batch.notes || '',
        }))
      : [];

    const quotationData = {
      ...rest,
      deliveryBatches: preparedDeliveryBatches,
      status: action === 'submit' ? 'pending' : 'draft',
      quotationNumber: quotation?.quotationNumber || `Q${Date.now()}`,
      id: quotation?.id || (initialData as any)?.id || Date.now().toString(),
      createdAt: quotation?.createdAt || (initialData as any)?.createdAt || new Date().toISOString(),
    };
    
    if (onSubmit) {
      await onSubmit(quotationData);
    } else if (quotation?.id) {
      updateQuotation(quotation.id, quotationData);
    } else if ((initialData as any)?.id) {
      updateQuotation((initialData as any).id, quotationData);
    } else {
      addQuotation(quotationData);
    }
    
    if (onSave) onSave();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {quotation ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคา'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">
              จำนวนเงินรวมทั้งหมด THB {formData.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
            <button onClick={() => onClose?.()} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form className="flex-1 overflow-y-auto" onSubmit={(e) => handleSubmit(e, 'submit')}>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - ข้อมูลลูกค้า */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">👤</span> ข้อมูลลูกค้า
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ชื่อกิจการ <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.customerId}
                        onChange={(e) => handleChange('customerId', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">โปรดเลือกชื่อกิจการ</option>
                        {customersList.map((customer: any) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        โครงการ
                      </label>
                      <select
                        value={formData.projectId}
                        onChange={(e) => handleChange('projectId', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">โปรดเลือกโครงการ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        โอกาส
                      </label>
                      <select
                        value={formData.opportunityId}
                        onChange={(e) => handleChange('opportunityId', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">โปรดเลือกโอกาส</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วันที่ออกเอกสาร
                      </label>
                      <Input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => handleChange('issueDate', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วันที่หมดอายุ
                      </label>
                      <Input
                        type="date"
                        value={formData.validUntilDate}
                        onChange={(e) => handleChange('validUntilDate', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ความสำคัญ <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleChange('importance', star)}
                            className="focus:outline-none"
                          >
                            <Star
                              size={24}
                              className={`${
                                star <= formData.importance
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              } transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ผู้รับผิดชอบ
                      </label>
                      <select
                        value={formData.owner}
                        onChange={(e) => handleChange('owner', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>PU STAR Office</option>
                        <option>Sales 1 Kitti</option>
                        <option>Salesprojects 1 Sunisa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ทีมที่รับผิดชอบ <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.team}
                        onChange={(e) => handleChange('team', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>PU STAR Office</option>
                        <option>Trade Sales Team</option>
                        <option>Project Sales Team</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ข้อมูลผู้ติดต่อ */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📞</span> ข้อมูลผู้ติดต่อ
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ชื่อผู้ติดต่อ <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        value={formData.contactName}
                        onChange={(e) => handleChange('contactName', e.target.value)}
                        placeholder="โปรดเลือกชื่อผู้ติดต่อ"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        อีเมล์ผู้ติดต่อ
                      </label>
                      <Input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        เบอร์โทรผู้ติดต่อ
                      </label>
                      <Input
                        type="text"
                        value={formData.contactPhone}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column - ข้อมูลการจัดส่ง */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🚚</span> ข้อมูลการจัดส่ง
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        วิธีการจัดส่ง <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="รับเอง"
                            checked={formData.deliveryMethod === 'รับเอง'}
                            onChange={(e) => handleChange('deliveryMethod', e.target.value)}
                            className="mr-2"
                          />
                          รับเอง
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="จัดส่ง"
                            checked={formData.deliveryMethod === 'จัดส่ง'}
                            onChange={(e) => handleChange('deliveryMethod', e.target.value)}
                            className="mr-2"
                          />
                          จัดส่ง
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="ไม่ระบุ"
                            checked={formData.deliveryMethod === 'ไม่ระบุ'}
                            onChange={(e) => handleChange('deliveryMethod', e.target.value)}
                            className="mr-2"
                          />
                          ไม่ระบุ
                        </label>
                      </div>
                      <Input
                        value={formData.deliveryMethodNote}
                        onChange={(e) => handleChange('deliveryMethodNote', e.target.value)}
                        placeholder="ระบุเพิ่มเติม"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วันที่จัดส่งสินค้า
                      </label>
                      <Input
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => handleChange('deliveryDate', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={formData.hideDeliveryDate}
                          onChange={(e) => handleChange('hideDeliveryDate', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">ไม่แสดงวันที่ในเอกสาร</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.sameAsCompanyAddress}
                          onChange={(e) => handleChange('sameAsCompanyAddress', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">ที่อยู่เดียวกับบริษัท</span>
                      </label>
                    </div>

                    {!formData.sameAsCompanyAddress && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            ชื่อสถานที่
                          </label>
                          <Input
                            value={formData.deliveryLocationName}
                            onChange={(e) => handleChange('deliveryLocationName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            ที่อยู่
                          </label>
                          <Textarea
                            value={formData.deliveryAddress}
                            onChange={(e) => handleChange('deliveryAddress', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            ประเทศ <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.deliveryCountry}
                            onChange={(e) => handleChange('deliveryCountry', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option>Thailand (ไทย)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            จังหวัด <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.deliveryProvince}
                            onChange={(e) => handleChange('deliveryProvince', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">โปรดเลือกจังหวัด</option>
                            <option>กรุงเทพมหานคร</option>
                            <option>นนทบุรี</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            อำเภอ
                          </label>
                          <select
                            value={formData.deliveryDistrict}
                            onChange={(e) => handleChange('deliveryDistrict', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Please select district</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📦</span> การจัดส่งแบบแบ่งรอบ
                  </h3>

                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isSplitDelivery}
                        onChange={(e) => toggleSplitDelivery(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">
                        แบ่งการจัดส่งสินค้าออกเป็นหลายรอบ
                      </span>
                    </label>

                    {formData.isSplitDelivery && (
                      <div className="space-y-4">
                        {formData.deliveryBatches?.map((batch: any, index: number) => (
                          <div key={index} className="border border-dashed border-blue-200 rounded-md p-3 bg-blue-50/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-blue-700">
                                รอบที่ {index + 1}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDeliveryBatch(index)}
                              >
                                <Trash2 size={16} className="mr-1" /> ลบรอบนี้
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  ชื่อรอบ/หมายเหตุ
                                </label>
                                <Input
                                  value={batch.batchId}
                                  onChange={(e) => updateDeliveryBatch(index, 'batchId', e.target.value)}
                                  placeholder={`รอบที่ ${index + 1}`}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  วันที่ส่ง
                                </label>
                                <Input
                                  type="date"
                                  value={batch.deliveryDate}
                                  onChange={(e) => updateDeliveryBatch(index, 'deliveryDate', e.target.value)}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  จำนวนที่จะส่ง
                                </label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={batch.quantity}
                                  onChange={(e) => updateDeliveryBatch(index, 'quantity', e.target.value)}
                                  className="w-full"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                หมายเหตุเพิ่มเติม
                              </label>
                              <Textarea
                                value={batch.notes || ''}
                                onChange={(e) => updateDeliveryBatch(index, 'notes', e.target.value)}
                                rows={2}
                                className="w-full"
                              />
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="text-sm text-gray-600">
                            จำนวนสินค้ารวมทั้งหมด: <span className="font-semibold text-gray-900">{totalItemQuantity}</span> หน่วย<br />
                            จำนวนที่วางแผนส่งแล้ว: <span className="font-semibold text-gray-900">{plannedDeliveryQuantity}</span> หน่วย
                            {totalItemQuantity > 0 && (
                              <span className="ml-1">
                                ({plannedDeliveryQuantity - totalItemQuantity === 0
                                  ? 'ครบกำหนดการส่ง'
                                  : plannedDeliveryQuantity < totalItemQuantity
                                    ? `เหลืออีก ${totalItemQuantity - plannedDeliveryQuantity} หน่วย`
                                    : `เกินจำนวนสินค้า ${plannedDeliveryQuantity - totalItemQuantity} หน่วย`})
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addDeliveryBatch}
                            className="flex items-center justify-center"
                          >
                            <Plus size={16} className="mr-2" /> เพิ่มรอบการส่ง
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - เงื่อนไข */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">💰</span> เงื่อนไขการชำระเงิน
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        เงื่อนไขการชำระเงิน <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.paymentTerms}
                        onChange={(e) => handleChange('paymentTerms', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">โปรดเลือกเงื่อนไขการชำระเงิน</option>
                        <option>เงินสด</option>
                        <option>เก็บเงินปลายทาง (COD)</option>
                        <option>เครดิต</option>
                        <option>เช็ค</option>
                        <option>โอนเงิน</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        จำนวนวัน
                      </label>
                      <Input
                        type="number"
                        value={formData.paymentDays}
                        onChange={(e) => handleChange('paymentDays', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">จำนวนเงินหลังหักส่วนลด:</span>
                          <span className="font-semibold">
                            {formData.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">ภาษีมูลค่าเพิ่ม 7%:</span>
                          <span className="font-semibold">
                            {formData.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>จำนวนเงินรวมทั้งหมด:</span>
                          <span className="text-blue-600">
                            THB {formData.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📎</span> แนบเอกสาร
                  </h3>
                  
                  <Button
                    type="button"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Upload size={16} className="mr-2" /> แนบเอกสารที่เกี่ยวข้อง
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    ไฟล์จะต้องมีขนาดไม่เกิน 20 เมกะไบต์/ไฟล์
                  </p>
                </div>
              </div>
            </div>

            {/* รายการสินค้า */}
            <div className="mt-6 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">📦</span> รายการสินค้า
                </h3>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.showProductCode}
                    onChange={(e) => handleChange('showProductCode', e.target.checked)}
                    className="mr-2"
                  />
                  แสดงรหัสสินค้าบนใบเสนอราคา
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-sm">ลำดับ</th>
                      <th className="border p-2 text-sm">รายละเอียดสินค้า *</th>
                      <th className="border p-2 text-sm">จำนวน *</th>
                      <th className="border p-2 text-sm">หน่วย *</th>
                      <th className="border p-2 text-sm">ราคา/หน่วย</th>
                      <th className="border p-2 text-sm">ส่วนลด/หน่วย</th>
                      <th className="border p-2 text-sm">ส่วนลด(%)/หน่วย</th>
                      <th className="border p-2 text-sm">มูลค่า</th>
                      <th className="border p-2 text-sm">กลุ่มสินค้า *</th>
                      <th className="border p-2 text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border p-2 text-center">{index + 1}</td>
                        <td className="border p-2">
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            rows={2}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border rounded text-sm"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={item.discountPerUnit}
                            onChange={(e) => handleItemChange(index, 'discountPerUnit', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border rounded text-sm"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => handleItemChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                            placeholder="0%"
                            step="0.01"
                          />
                        </td>
                        <td className="border p-2 text-right font-semibold">
                          {item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border p-2">
                          <select
                            value={item.productGroup}
                            onChange={(e) => handleItemChange(index, 'productGroup', e.target.value)}
                            className="w-32 px-2 py-1 border rounded text-sm"
                          >
                            <option value="">โปรดเลือกกลุ่มสินค้า</option>
                            <option>PU Foam</option>
                            <option>Sealant</option>
                            <option>Adhesive</option>
                          </select>
                        </td>
                        <td className="border p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() => addItems(5)}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
                >
                  5 รายการสินค้า
                </Button>
                <Button
                  type="button"
                  onClick={() => addItems(10)}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
                >
                  10 รายการสินค้า
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <Button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white"
            >
              บันทึกร่าง
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, 'submit')}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white"
            >
              บันทึกและส่งอนุมัติ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
