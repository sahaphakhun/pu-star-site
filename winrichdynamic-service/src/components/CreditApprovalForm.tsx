"use client";

import { useState } from 'react';
import { Upload, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
} from '@/components/ui/AppModal';

interface CreditApprovalFormProps {
  customer?: any;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
}

export default function CreditApprovalForm({ customer, onClose, onSubmit }: CreditApprovalFormProps) {
  const [formData, setFormData] = useState({
    customerId: customer?._id || customer?.id || '',
    customerName: customer?.name || '',
    customerCode: customer?.customerCode || '',
    requestedCreditLimit: '',
    paymentTerms: 'ชำระเงินทันที',
    reasonForRequest: '',
    businessHistory: '',
    monthlyRevenue: '',
    otherCreditLines: '',
    references: '',
    documents: [] as DocumentFile[],
    requestedBy: '',
    requestedDate: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocuments: DocumentFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
    }));

    setFormData({
      ...formData,
      documents: [...formData.documents, ...newDocuments],
    });
  };

  const removeDocument = (id: string) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter(doc => doc.id !== id),
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.requestedCreditLimit) {
        throw new Error('กรุณาระบุวงเงินเครดิตที่ต้องการ');
      }

      if (!formData.reasonForRequest) {
        throw new Error('กรุณาระบุเหตุผลในการขออนุมัติเครดิต');
      }

      // สร้าง payload สำหรับส่งไปยัง API
      const payload = {
        ...formData,
        requestedCreditLimit: parseFloat(formData.requestedCreditLimit),
        monthlyRevenue: formData.monthlyRevenue ? parseFloat(formData.monthlyRevenue) : undefined,
        otherCreditLines: formData.otherCreditLines ? parseFloat(formData.otherCreditLines) : undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการส่งคำขออนุมัติเครดิต');
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
            <AppModalTitle>คำขออนุมัติเครดิต</AppModalTitle>
          </AppModalHeader>
          <AppModalBody>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">รหัสลูกค้า</label>
                  <Input
                    value={formData.customerCode}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อลูกค้า</label>
                  <Input
                    value={formData.customerName}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* รายละเอียดการขออนุมัติเครดิต */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">💰</span> รายละเอียดการขออนุมัติเครดิต
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    วงเงินเครดิตที่ต้องการ (บาท) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.requestedCreditLimit}
                    onChange={(e) => handleChange('requestedCreditLimit', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">เงื่อนไขการชำระเงิน</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>ชำระเงินทันที</option>
                    <option>เครดิต 30 วัน</option>
                    <option>เครดิต 45 วัน</option>
                    <option>เครดิต 60 วัน</option>
                    <option>เครดิต 90 วัน</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                  เหตุผลในการขออนุมัติเครดิต <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.reasonForRequest}
                  onChange={(e) => handleChange('reasonForRequest', e.target.value)}
                  rows={3}
                  placeholder="ระบุเหตุผลในการขออนุมัติเครดิต..."
                  required
                />
              </div>
            </div>

            {/* ข้อมูลทางการเงิน */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📊</span> ข้อมูลทางการเงิน
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ประวัติการดำเนินธุรกิจ</label>
                  <Textarea
                    value={formData.businessHistory}
                    onChange={(e) => handleChange('businessHistory', e.target.value)}
                    rows={3}
                    placeholder="ระบุประวัติการดำเนินธุรกิจ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">รายได้ต่อเดือน (บาท)</label>
                  <Input
                    type="number"
                    value={formData.monthlyRevenue}
                    onChange={(e) => handleChange('monthlyRevenue', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">วงเงินเครดิตอื่นๆ ที่เปิดอยู่ (บาท)</label>
                <Input
                  type="number"
                  value={formData.otherCreditLines}
                  onChange={(e) => handleChange('otherCreditLines', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">บุคคลอ้างอิง</label>
                <Textarea
                  value={formData.references}
                  onChange={(e) => handleChange('references', e.target.value)}
                  rows={2}
                  placeholder="ระบุชื่อบุคคลอ้างอิงและข้อมูลติดต่อ..."
                />
              </div>
            </div>

            {/* เอกสารแนบ */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📎</span> เอกสารแนบ
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">อัปโหลดเอกสาร</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="document-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดเอกสาร</p>
                    <p className="text-xs text-gray-500 mt-1">
                      รองรับไฟล์ PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG (ขนาดไม่เกิน 20MB/ไฟล์)
                    </p>
                  </label>
                </div>
              </div>

              {/* รายการเอกสารที่อัปโหลด */}
              {formData.documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">เอกสารที่อัปโหลดแล้ว:</h4>
                  <div className="space-y-2">
                    {formData.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                            <span className="text-xs text-blue-600">
                              {doc.type.includes('pdf') ? 'PDF' : 
                               doc.type.includes('doc') ? 'DOC' : 
                               doc.type.includes('xls') ? 'XLS' : 
                               doc.type.includes('image') ? 'IMG' : 'FILE'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ข้อมูลผู้ขอ */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">👤</span> ข้อมูลผู้ขอ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ผู้ขออนุมัติ</label>
                  <Input
                    value={formData.requestedBy}
                    onChange={(e) => handleChange('requestedBy', e.target.value)}
                    placeholder="ระบุชื่อผู้ขออนุมัติ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่ขอ</label>
                  <Input
                    type="date"
                    value={formData.requestedDate}
                    onChange={(e) => handleChange('requestedDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </AppModalBody>
          <AppModalFooter>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'กำลังส่ง...' : 'ส่งคำขอ'}
            </Button>
          </AppModalFooter>
        </form>
      </AppModalContent>
    </AppModal>
  );
}
