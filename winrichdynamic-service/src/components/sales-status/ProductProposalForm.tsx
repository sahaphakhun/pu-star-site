"use client";

import { useState } from 'react';
import { Upload, Plus, Trash2, Camera } from 'lucide-react';
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

interface ProductProposalFormProps {
  customer?: any;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

interface SalesOpportunity {
  productId: string;
  productName: string;
  competitorPrice?: number;
  competitorBrand?: string;
}

interface FutureProduct {
  productName: string;
  details: string;
}

export default function ProductProposalForm({ customer, onClose, onSubmit }: ProductProposalFormProps) {
  const [formData, setFormData] = useState({
    customerId: customer?._id || customer?.id || '',
    companyAddress: customer?.companyAddress || '',
    companyPhoto: customer?.companyPhoto || '',
    storeDetails: customer?.storeDetails || '',
    salesOpportunities: (customer?.salesOpportunities || []) as SalesOpportunity[],
    futureProducts: (customer?.futureProducts || []) as FutureProduct[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, companyPhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addSalesOpportunity = () => {
    setFormData({
      ...formData,
      salesOpportunities: [...formData.salesOpportunities, {
        productId: '',
        productName: '',
        competitorPrice: undefined,
        competitorBrand: '',
      }],
    });
  };

  const removeSalesOpportunity = (index: number) => {
    const newOpportunities = formData.salesOpportunities.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, salesOpportunities: newOpportunities });
  };

  const handleSalesOpportunityChange = (index: number, field: string, value: any) => {
    const newOpportunities = [...formData.salesOpportunities];
    (newOpportunities[index] as any)[field] = value;
    setFormData({ ...formData, salesOpportunities: newOpportunities });
  };

  const addFutureProduct = () => {
    setFormData({
      ...formData,
      futureProducts: [...formData.futureProducts, {
        productName: '',
        details: '',
      }],
    });
  };

  const removeFutureProduct = (index: number) => {
    const newProducts = formData.futureProducts.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, futureProducts: newProducts });
  };

  const handleFutureProductChange = (index: number, field: string, value: any) => {
    const newProducts = [...formData.futureProducts];
    (newProducts[index] as any)[field] = value;
    setFormData({ ...formData, futureProducts: newProducts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.companyAddress) {
        throw new Error('กรุณาระบุที่อยู่บริษัท');
      }

      if (!formData.storeDetails) {
        throw new Error('กรุณาระบุรายละเอียดร้านค้า');
      }

      // สร้าง payload สำหรับส่งไปยัง API
      const payload = {
        ...formData,
        status: 'proposed', // อัปเดตสถานะเป็น "นำเสนอสินค้า"
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
            <AppModalTitle>นำเสนอสินค้า</AppModalTitle>
          </AppModalHeader>
          <AppModalBody>
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* ข้อมูลที่อยู่บริษัท */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📍</span> ที่อยู่บริษัท
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1">
                  ที่อยู่บริษัท <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  rows={3}
                  placeholder="ระบุที่อยู่บริษัท..."
                  required
                />
              </div>
            </div>

            {/* รูปหน้าร้าน */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📷</span> รูปหน้าร้าน
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="company-photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label htmlFor="company-photo-upload" className="cursor-pointer">
                  {formData.companyPhoto ? (
                    <div className="relative">
                      <img 
                        src={formData.companyPhoto} 
                        alt="รูปหน้าร้าน" 
                        className="max-h-64 mx-auto rounded"
                      />
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                        <Camera size={16} className="text-gray-600" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดรูปหน้าร้าน</p>
                      <p className="text-xs text-gray-500 mt-1">
                        รองรับไฟล์ JPG, JPEG, PNG (ขนาดไม่เกิน 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* รายละเอียดร้านค้า */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🏪</span> รายละเอียดร้านค้า
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1">
                  รายละเอียดร้านค้า <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.storeDetails}
                  onChange={(e) => handleChange('storeDetails', e.target.value)}
                  rows={4}
                  placeholder="ระบุรายละเอียดเกี่ยวกับร้านค้า..."
                  required
                />
              </div>
            </div>

            {/* โอกาสการขาย */}
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">💼</span> โอกาสการขาย
                </h3>
                <Button
                  type="button"
                  onClick={addSalesOpportunity}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
                >
                  <Plus size={16} className="mr-1" /> เพิ่มโอกาสการขาย
                </Button>
              </div>

              <div className="space-y-4">
                {formData.salesOpportunities.map((opportunity, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium">โอกาสการขายที่ {index + 1}</span>
                      {formData.salesOpportunities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSalesOpportunity(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
                        <Input
                          value={opportunity.productName}
                          onChange={(e) => handleSalesOpportunityChange(index, 'productName', e.target.value)}
                          placeholder="ระบุชื่อสินค้า"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">รหัสสินค้า</label>
                        <Input
                          value={opportunity.productId}
                          onChange={(e) => handleSalesOpportunityChange(index, 'productId', e.target.value)}
                          placeholder="ระบุรหัสสินค้า"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">ราคาคู่แข่ง</label>
                        <Input
                          type="number"
                          value={opportunity.competitorPrice || ''}
                          onChange={(e) => handleSalesOpportunityChange(index, 'competitorPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">ยี่ห้อคู่แข่ง</label>
                        <Input
                          value={opportunity.competitorBrand || ''}
                          onChange={(e) => handleSalesOpportunityChange(index, 'competitorBrand', e.target.value)}
                          placeholder="ระบุยี่ห้อคู่แข่ง"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formData.salesOpportunities.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  ยังไม่มีข้อมูลโอกาสการขาย คลิก "เพิ่มโอกาสการขาย" เพื่อเพิ่มข้อมูล
                </div>
              )}
            </div>

            {/* สินค้าอนาคต */}
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">🔮</span> สินค้าอนาคตที่คิดว่าจะใช้
                </h3>
                <Button
                  type="button"
                  onClick={addFutureProduct}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
                >
                  <Plus size={16} className="mr-1" /> เพิ่มสินค้าอนาคต
                </Button>
              </div>

              <div className="space-y-4">
                {formData.futureProducts.map((product, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium">สินค้าอนาคตที่ {index + 1}</span>
                      {formData.futureProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFutureProduct(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
                        <Input
                          value={product.productName}
                          onChange={(e) => handleFutureProductChange(index, 'productName', e.target.value)}
                          placeholder="ระบุชื่อสินค้า"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                        <Textarea
                          value={product.details}
                          onChange={(e) => handleFutureProductChange(index, 'details', e.target.value)}
                          rows={2}
                          placeholder="ระบุรายละเอียดสินค้า..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formData.futureProducts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  ยังไม่มีข้อมูลสินค้าอนาคต คลิก "เพิ่มสินค้าอนาคต" เพื่อเพิ่มข้อมูล
                </div>
              )}
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
