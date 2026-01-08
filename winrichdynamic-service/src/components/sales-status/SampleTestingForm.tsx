"use client";

import { useState } from 'react';
import { Plus, Trash2, Upload, Camera, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
} from '@/components/ui/AppModal';

interface SampleTestingFormProps {
  customer?: any;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

interface SampleItem {
  productId: string;
  productName: string;
  quantity: number;
}

interface SampleRequest {
  requestId: string;
  date: Date;
  items: SampleItem[];
  status: string;
  testImages: string[];
}

export default function SampleTestingForm({ customer, onClose, onSubmit }: SampleTestingFormProps) {
  const [formData, setFormData] = useState({
    customerId: customer?._id || customer?.id || '',
    sampleRequestHistory: (customer?.sampleRequestHistory || []) as SampleRequest[],
    currentRequest: {
      requestId: `REQ${Date.now()}`,
      date: new Date(),
      items: [
        {
          productId: '',
          productName: '',
          quantity: 1,
        }
      ] as SampleItem[],
      status: 'pending',
      testImages: [] as string[],
    },
    sampleReceipt: customer?.sampleReceipt || {
      companyCopy: '',
      customerCopy: '',
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCurrentRequestChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      currentRequest: {
        ...formData.currentRequest,
        [field]: value,
      },
    });
  };

  const addItem = () => {
    handleCurrentRequestChange('items', [
      ...formData.currentRequest.items,
      {
        productId: '',
        productName: '',
        quantity: 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (formData.currentRequest.items.length > 1) {
      const newItems = formData.currentRequest.items.filter((_: any, i: number) => i !== index);
      handleCurrentRequestChange('items', newItems);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.currentRequest.items];
    (newItems[index] as any)[field] = value;
    handleCurrentRequestChange('items', newItems);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === files.length) {
          handleCurrentRequestChange('testImages', [
            ...formData.currentRequest.testImages,
            ...newImages,
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newImages = formData.currentRequest.testImages.filter((_: any, i: number) => i !== index);
    handleCurrentRequestChange('testImages', newImages);
  };

  const generateSampleReceipt = (type: 'company' | 'customer') => {
    // สร้างข้อมูลใบรับสินค้าตัวอย่าง
    const receiptData = {
      requestId: formData.currentRequest.requestId,
      date: new Date().toLocaleDateString('th-TH'),
      customerName: customer?.name || '',
      items: formData.currentRequest.items,
      totalItems: formData.currentRequest.items.reduce((sum, item) => sum + item.quantity, 0),
    };

    // ในระบบจริง ควรสร้าง PDF และอัปโหลดไปยัง Cloudinary
    // ตอนนี้จะสร้างเป็นข้อความธรรมดาแทน
    const receiptText = `
ใบรับสินค้าตัวอย่าง (${type === 'company' ? 'ฉบับบริษัท' : 'ฉบับลูกค้า'})

เลขที่: ${receiptData.requestId}
วันที่: ${receiptData.date}
ลูกค้า: ${receiptData.customerName}

รายการสินค้า:
${receiptData.items.map(item => `- ${item.productName} (${item.quantity} ชิ้น)`).join('\n')}

รวมทั้งหมด: ${receiptData.totalItems} ชิ้น

_________________________
(${type === 'company' ? 'ผู้ส่งของ' : 'ผู้รับของ'})
    `.trim();

    const updatedReceipt = {
      ...formData.sampleReceipt,
      [`${type}Copy`]: receiptText,
    };

    handleChange('sampleReceipt', updatedReceipt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      // ตรวจสอบข้อมูลที่จำเป็น
      if (formData.currentRequest.items.some(item => !item.productName || item.quantity <= 0)) {
        throw new Error('กรุณาระบุข้อมูลสินค้าให้ครบถ้วน');
      }

      // เพิ่มคำขอปัจจุบันลงในประวัติ
      const updatedHistory = [
        ...formData.sampleRequestHistory,
        formData.currentRequest,
      ];

      // สร้าง payload สำหรับส่งไปยัง API
      const payload = {
        ...formData,
        sampleRequestHistory: updatedHistory,
        status: 'testing', // อัปเดตสถานะเป็น "ทดสอบตัวอย่างสินค้า"
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
    <AppModal open onOpenChange={(open) => !open && onClose()}>
      <AppModalContent size="xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <AppModalHeader>
            <AppModalTitle>ทดสอบตัวอย่างสินค้า</AppModalTitle>
          </AppModalHeader>
          <AppModalBody>
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* ประวัติการเบิก */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📋</span> ประวัติการเบิก
              </h3>
              
              {formData.sampleRequestHistory.length > 0 ? (
                <div className="space-y-3">
                  {formData.sampleRequestHistory.map((request, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">เลขที่: {request.requestId}</span>
                          <span className="ml-4 text-sm text-gray-600">
                            วันที่: {new Date(request.date).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status === 'approved' ? 'อนุมัติ' :
                           request.status === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                        </span>
                      </div>
                      <div className="text-sm">
                        {request.items.map((item, itemIndex) => (
                          <div key={itemIndex}>
                            - {item.productName} ({item.quantity} ชิ้น)
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  ยังไม่มีประวัติการเบิก
                </div>
              )}
            </div>

            {/* รายการเบิก */}
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">📦</span> รายการเบิก
                </h3>
                <Button
                  type="button"
                  onClick={addItem}
                  className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-1"
                >
                  <Plus size={16} className="mr-1" /> เพิ่มรายการ
                </Button>
              </div>

              <div className="space-y-3">
                {formData.currentRequest.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium">รายการที่ {index + 1}</span>
                      {formData.currentRequest.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
                        <Input
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          placeholder="ระบุชื่อสินค้า"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">รหัสสินค้า</label>
                        <Input
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          placeholder="ระบุรหัสสินค้า"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">จำนวน</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* รูปภาพแนบการทดสอบ */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📷</span> รูปภาพแนบการทดสอบ
              </h3>
              
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="test-images-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="test-images-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดรูปภาพ</p>
                    <p className="text-xs text-gray-500 mt-1">
                      รองรับไฟล์ JPG, JPEG, PNG (ขนาดไม่เกิน 10MB/ไฟล์)
                    </p>
                  </label>
                </div>
              </div>

              {formData.currentRequest.testImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.currentRequest.testImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`รูปทดสอบ ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ใบรับสินค้าตัวอย่าง */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📄</span> ใบรับสินค้าตัวอย่าง
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">ใบรับสินค้าตัวอย่าง (ฉบับบริษัท)</label>
                    <Button
                      type="button"
                      onClick={() => generateSampleReceipt('company')}
                      className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-1"
                    >
                      <FileText size={14} className="mr-1" /> สร้าง
                    </Button>
                  </div>
                  {formData.sampleReceipt.companyCopy ? (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <pre className="text-xs whitespace-pre-wrap">{formData.sampleReceipt.companyCopy}</pre>
                      <Button
                        type="button"
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
                      >
                        <Download size={14} className="mr-1" /> ดาวน์โหลด
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                      ยังไม่ได้สร้างใบรับสินค้าตัวอย่าง
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">ใบรับสินค้าตัวอย่าง (ฉบับลูกค้า)</label>
                    <Button
                      type="button"
                      onClick={() => generateSampleReceipt('customer')}
                      className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-1"
                    >
                      <FileText size={14} className="mr-1" /> สร้าง
                    </Button>
                  </div>
                  {formData.sampleReceipt.customerCopy ? (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <pre className="text-xs whitespace-pre-wrap">{formData.sampleReceipt.customerCopy}</pre>
                      <Button
                        type="button"
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
                      >
                        <Download size={14} className="mr-1" /> ดาวน์โหลด
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                      ยังไม่ได้สร้างใบรับสินค้าตัวอย่าง
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          </AppModalBody>
          <AppModalFooter>
            <Button type="button" onClick={onClose} variant="outline">
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </AppModalFooter>
        </form>
      </AppModalContent>
    </AppModal>
  );
}
