"use client";

import { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
} from '@/components/ui/AppModal';

interface CustomerTagManagerProps {
  customer?: any;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

export default function CustomerTagManager({ customer, onClose, onSubmit }: CustomerTagManagerProps) {
  const [formData, setFormData] = useState({
    customerId: customer?._id || customer?.id || '',
    tags: (customer?.tags || []) as string[],
  });

  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // แท็กที่มีอยู่แล้วในระบบ (ตัวอย่าง)
  const availableTags = [
    // แท็กประเภทธุรกิจ
    'ช่างติดตั้งประตูหน้าต่างอลูมิเนียม',
    'ร้านขายเส้นอลูมิเนียม',
    'โรงรีดเส้น',
    'ร้านขายวัสดุก่อสร้าง',
    'เจ้าของโครงการ',
    
    // แท็กผลิตภัณฑ์
    '6134 ไร้กรด',
    '6145 ACP',
    '6272 กันเชื้อรา',
    'EVA Cloud',
    'PU Foam',
    'PU40 MS',
    'PU40 มีกรด',
    'PU40 ไร้กรด',
    'อะคริลิก Tiger',
    
    // แท็กช่องทางการติดต่อ
    'Facebook',
    'Line OA',
    
    // แท็กประเภทลูกค้า
    'Developer/เจ้าของโครงการ',
    'Wholesaler/ร้านค้าส่งเส้นอลูมิเนียม',
    'บริษัทจำหน่ายวัสดุก่อสร้าง-ฮาร์ดแวร์',
    'บริษัทรับเหมาก่อสร้างอาคาร-สำนักงาน ต่ำกว่า 8 ชั้น',
    'บริษัทรับเหมาก่อสร้างอาคาร-สำนักงาน สูงกว่า 8 ชั้น',
    'ผู้รับเหมาติดตั้งประตูหน้าต่างอลูมิเนียม',
    'ในนามบริษัท',
    'ในนามบุคคล',
    
    // แท็กภูมิภาค
    'ภาคตะวันออก',
    'ภาคใต้',
    'ภาคเหนือ',
    'ภาคอีสาน',
    
    // แท็กอื่นๆ
    'Interior',
  ];

  const tagColors = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-yellow-100 text-yellow-800 border-yellow-300',
    'bg-red-100 text-red-800 border-red-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-orange-100 text-orange-800 border-orange-300',
  ];

  const getTagColor = (index: number) => {
    return tagColors[index % tagColors.length];
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setNewTag('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag: string) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      // สร้าง payload สำหรับส่งไปยัง API
      const payload = {
        tags: formData.tags,
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
            <AppModalTitle className="flex items-center gap-2">
              <Tag size={20} className="text-slate-500" />
              จัดการแท็กลูกค้า
            </AppModalTitle>
          </AppModalHeader>
          <AppModalBody>
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* ข้อมูลลูกค้า */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">ข้อมูลลูกค้า</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">รหัสลูกค้า</label>
                  <Input
                    value={customer?.customerCode || ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อลูกค้า</label>
                  <Input
                    value={customer?.name || ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* จัดการแท็ก */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">จัดการแท็ก</h3>

              <div className="relative mb-4">
                <Input
                  value={newTag}
                  onChange={(e) => {
                    setNewTag(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  placeholder="ค้นหาหรือเพิ่มแท็ก"
                />
                {showTagSuggestions && newTag && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {availableTags
                      .filter(tag => 
                        tag.toLowerCase().includes(newTag.toLowerCase()) &&
                        !formData.tags.includes(tag)
                      )
                      .map((tag, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* แท็กที่เลือกแล้ว */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">แท็กที่เลือกแล้ว:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getTagColor(index)}`}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                  {formData.tags.length === 0 && (
                    <div className="text-gray-500 text-sm">ยังไม่ได้เลือกแท็ก</div>
                  )}
                </div>
              </div>

              {/* แท็กที่แนะนำ */}
              <div>
                <h4 className="text-sm font-medium mb-2">แท็กที่แนะนำ:</h4>
                <div className="space-y-4">
                  {/* แท็กประเภทธุรกิจ */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">ประเภทธุรกิจ:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags
                        .filter(tag => 
                          ['ช่างติดตั้ง', 'ร้านขายเส้น', 'โรงรีด', 'ร้านขายวัสดุ', 'เจ้าของโครงการ'].some(keyword => 
                            tag.includes(keyword)
                          ) && !formData.tags.includes(tag)
                        )
                        .map((tag, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm border ${getTagColor(index)} hover:opacity-80`}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* แท็กผลิตภัณฑ์ */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">ผลิตภัณฑ์:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags
                        .filter(tag => 
                          ['6134', '6145', '6272', 'EVA', 'PU', 'อะคริลิก'].some(keyword => 
                            tag.includes(keyword)
                          ) && !formData.tags.includes(tag)
                        )
                        .map((tag, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm border ${getTagColor(index)} hover:opacity-80`}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* แท็กภูมิภาค */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">ภูมิภาค:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags
                        .filter(tag => 
                          ['ภาค'].some(keyword => 
                            tag.includes(keyword)
                          ) && !formData.tags.includes(tag)
                        )
                        .map((tag, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm border ${getTagColor(index)} hover:opacity-80`}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* แท็กอื่นๆ */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">อื่นๆ:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags
                        .filter(tag => 
                          !['ช่างติดตั้ง', 'ร้านขายเส้น', 'โรงรีด', 'ร้านขายวัสดุ', 'เจ้าของโครงการ',
                           '6134', '6145', '6272', 'EVA', 'PU', 'อะคริลิก',
                           'ภาค'].some(keyword => 
                            tag.includes(keyword)
                          ) && !formData.tags.includes(tag)
                        )
                        .map((tag, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm border ${getTagColor(index)} hover:opacity-80`}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
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
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </AppModalFooter>
        </form>
      </AppModalContent>
    </AppModal>
  );
}
