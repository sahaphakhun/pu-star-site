"use client";

import { useState } from 'react';
import { X, Upload, Trash2, FileText, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface PriceApprovalFormProps {
  customer?: any;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

interface DocumentFile {
  id: string;
  type: string;
  url: string;
  name: string;
  file?: File;
}

export default function PriceApprovalForm({ customer, onClose, onSubmit }: PriceApprovalFormProps) {
  const [formData, setFormData] = useState({
    customerId: customer?._id || customer?.id || '',
    creditApproval: {
      ...customer?.creditApproval,
      requestedAmount: customer?.creditApproval?.requestedAmount || '',
      paymentPeriod: customer?.creditApproval?.paymentPeriod || '30 วัน',
      reason: customer?.creditApproval?.reason || '',
      responsiblePerson: customer?.creditApproval?.responsiblePerson || customer?.name || '',
      documents: (customer?.creditApproval?.documents || []) as DocumentFile[],
      creditLimit: customer?.creditApproval?.creditLimit || '',
      creditStartDate: customer?.creditApproval?.creditStartDate || new Date().toISOString().split('T')[0],
      status: customer?.creditApproval?.status || 'pending',
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreditApprovalChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      creditApproval: {
        ...formData.creditApproval,
        [field]: value,
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocuments: DocumentFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      type: getDocumentType(file.name),
      url: '', // จะถูกอัปโหลดไปยัง Cloudinary ในระบบจริง
      name: file.name,
      file: file,
    }));

    handleCreditApprovalChange('documents', [
      ...formData.creditApproval.documents,
      ...newDocuments,
    ]);
  };

  const removeDocument = (id: string) => {
    handleCreditApprovalChange('documents',
      formData.creditApproval.documents.filter((doc: DocumentFile) => doc.id !== id)
    );
  };

  const getDocumentType = (filename: string): string => {
    if (filename.includes('statement') || filename.includes('สเตทเมนต์')) {
      return 'statement';
    } else if (filename.includes('certificate') || filename.includes('หนังสือรับรอง')) {
      return 'certificate';
    } else if (filename.includes('id') || filename.includes('บัตร') || filename.includes('บัตรปชช')) {
      return 'id_card';
    } else if (filename.includes('house') || filename.includes('ทะเบียนบ้าน')) {
      return 'house_registration';
    } else if (filename.includes('shop') || filename.includes('ร้าน') || filename.includes('หน้าร้าน')) {
      return 'shop_photo';
    } else {
      return 'other';
    }
  };

  const getDocumentTypeName = (type: string): string => {
    switch (type) {
      case 'statement': return 'สเตทเมนต์ย้อนหลัง 6 เดือน';
      case 'certificate': return 'หนังสือรับรองบริษัท';
      case 'id_card': return 'บัตรประชาชน/สำเนาทะเบียนบ้านกรรมการ';
      case 'house_registration': return 'สำเนาทะเบียนบ้าน';
      case 'shop_photo': return 'รูปถ่ายหน้าร้าน';
      default: return 'เอกสารอื่นๆ';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateCreditDocument = () => {
    // สร้างเอกสารขออนุมัติเครดิต
    const documentData = {
      customerName: customer?.name || '',
      requestedAmount: formData.creditApproval.requestedAmount,
      paymentPeriod: formData.creditApproval.paymentPeriod,
      reason: formData.creditApproval.reason,
      responsiblePerson: formData.creditApproval.responsiblePerson,
      date: new Date().toLocaleDateString('th-TH'),
    };

    // ในระบบจริง ควรสร้าง PDF และอัปโหลดไปยัง Cloudinary
    // ตอนนี้จะสร้างเป็นข้อความธรรมดาแทน
    const documentText = `
เอกสารขออนุมัติเครดิต

วันที่: ${documentData.date}
เรื่อง: ขออนุมัติเครดิตลูกค้า

ชื่อลูกค้า: ${documentData.customerName}
วงเงินที่ขอ: ${documentData.requestedAmount ? parseFloat(documentData.requestedAmount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' }) : '-'}
ระยะเวลาการชำระ: ${documentData.paymentPeriod}
เหตุผล: ${documentData.reason}
ผู้รับผิดชอบ: ${documentData.responsiblePerson}

_________________________
ผู้ขออนุมัติ

_________________________
ผู้จัดการอนุมัติ

_________________________
ฝ่ายบัญชีอนุมัติ
    `.trim();

    // ในระบบจริง ควรสร้าง PDF และอัปโหลดไปยัง Cloudinary
    // แล้วอัปเดต URL ใน documents
    alert('ในระบบจริง จะสร้างเอกสาร PDF และอัปโหลดไปยัง Cloudinary\n\nเนื้อหาเอกสาร:\n\n' + documentText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.creditApproval.requestedAmount) {
        throw new Error('กรุณาระบุวงเงินที่ต้องการ');
      }

      if (!formData.creditApproval.reason) {
        throw new Error('กรุณาระบุเหตุผลในการขออนุมัติเครดิต');
      }

      if (!formData.creditApproval.responsiblePerson) {
        throw new Error('กรุณาระบุชื่อผู้รับผิดชอบ');
      }

      // สร้าง payload สำหรับส่งไปยัง API
      const payload = {
        ...formData,
        status: 'approved', // อัปเดตสถานะเป็น "อนุมัติราคา"
        creditApproval: {
          ...formData.creditApproval,
          requestedAmount: parseFloat(formData.creditApproval.requestedAmount),
          creditLimit: formData.creditApproval.creditLimit ? parseFloat(formData.creditApproval.creditLimit) : undefined,
          status: 'pending', // สถานะการอนุมัติเครดิตยังเป็น pending จนกว่าจะได้รับการอนุมัติ
        },
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
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">อนุมัติราคา</h2>
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

            {/* กรณีขออนุมัติเครดิต */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">💳</span> กรณีขออนุมัติเครดิต
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>ขั้นตอนการอนุมัติ:</strong> ลูกค้า – กิจกรรม- ขออนุมัติเครดิต(เซลล์)-ส่งขออนุมัติ(1.ผู้จัดการ 2.บัญชี)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    วงเงินที่ต้องการ (บาท) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.creditApproval.requestedAmount}
                    onChange={(e) => handleCreditApprovalChange('requestedAmount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ระยะเวลาการชำระเงิน
                  </label>
                  <select
                    value={formData.creditApproval.paymentPeriod}
                    onChange={(e) => handleCreditApprovalChange('paymentPeriod', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>30 วัน</option>
                    <option>45 วัน</option>
                    <option>60 วัน</option>
                    <option>90 วัน</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                  เหตุผลการให้เครดิต <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.creditApproval.reason}
                  onChange={(e) => handleCreditApprovalChange('reason', e.target.value)}
                  rows={3}
                  placeholder="ระบุเหตุผลการให้เครดิต..."
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                  ชื่อผู้รับผิดชอบ <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.creditApproval.responsiblePerson}
                  onChange={(e) => handleCreditApprovalChange('responsiblePerson', e.target.value)}
                  placeholder="ระบุชื่อผู้รับผิดชอบ (กรณีเปลี่ยนชื่อแอคเค้าท์ข้อมูลเดิมยังอยู่)"
                  required
                />
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  onClick={generateCreditDocument}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <FileText size={16} className="mr-2" />
                  ออกเอกสารเพื่อให้เซลล์ส่งลูกค้าเซ็นต์พร้อมประทับตรา
                </Button>
              </div>
            </div>

            {/* สถานะยืนยันเครดิต */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📊</span> สถานะยืนยันเครดิต
              </h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>หมายเหตุ:</strong> นับเครดิตจากวันที่ได้รับสินค้า
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    วงเงินเครดิตที่อนุมัติ (บาท)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.creditApproval.creditLimit}
                    onChange={(e) => handleCreditApprovalChange('creditLimit', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    วันที่เริ่มต้นเครดิต
                  </label>
                  <Input
                    type="date"
                    value={formData.creditApproval.creditStartDate}
                    onChange={(e) => handleCreditApprovalChange('creditStartDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* แนบเอกสาร */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📎</span> แนบเอกสาร
              </h3>
              
              <div className="mb-4">
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

              {/* รายการเอกสารที่แนะนำ */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">เอกสารที่ต้องแนบ:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• สเตทเมนต์ย้อนหลัง 6 เดือน</li>
                  <li>• หนังสือรับรองบริษัท (ภพ.20)</li>
                  <li>• บัตรประชาชน/สำเนาทะเบียนบ้านกรรมการ</li>
                  <li>• รูปถ่ายหน้าร้าน</li>
                </ul>
              </div>

              {/* รายการเอกสารที่อัปโหลด */}
              {formData.creditApproval.documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">เอกสารที่อัปโหลดแล้ว:</h4>
                  <div className="space-y-2">
                    {formData.creditApproval.documents.map((doc: DocumentFile) => (
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
                            <p className="text-xs text-gray-500">
                              {getDocumentTypeName(doc.type)}
                              {doc.file && ` (${formatFileSize(doc.file.size)})`}
                            </p>
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
          </div>

          {/* Footer Buttons */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-green-500 text-green-500 hover:bg-green-50"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white disabled:opacity-60"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}