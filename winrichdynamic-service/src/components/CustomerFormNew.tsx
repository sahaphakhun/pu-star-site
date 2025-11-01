"use client"

import { useState } from 'react';
import { X, Plus, Trash2, Upload, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

// TODO: Replace with actual data context when available
const mockData = {
  addCustomer: (customer: any) => console.log('Add customer:', customer),
  updateCustomer: (id: string, customer: any) => console.log('Update customer:', id, customer),
};

interface CustomerFormNewProps {
  customer?: any;
  onClose: () => void;
  onSave?: () => void;
}

export default function CustomerFormNew({ customer, onClose, onSave }: CustomerFormNewProps) {
  const { addCustomer, updateCustomer } = mockData;
  
  const [formData, setFormData] = useState(customer || {
    // ข้อมูลลูกค้า
    name: '',
    referenceCode: '',
    country: 'Thailand (ไทย)',
    province: '',
    district: '',
    
    // ข้อมูลผู้ติดต่อ
    contacts: [{
      name: '',
      isPrimary: true,
      phone: '',
      phoneExt: '',
      position: '',
      role: '',
      email: '',
      lineId: '',
    }],
    
    // ข้อมูลกิจการ
    registeredAddress: '',
    registeredCountry: 'Thailand (ไทย)',
    registeredProvince: '',
    registeredDistrict: '',
    branches: [],
    companyPhone: '',
    companyPhoneExt: '',
    taxId: '',
    companyEmail: '',
    importantDateType: 'วันก่อตั้ง',
    importantDate: '',
    documents: [],
    
    // ความสัมพันธ์ลูกค้า
    logo: null,
    dataCompleteness: 5,
    
    // ทีมที่รับผิดชอบ
    team: 'Trade Sales Team',
    owner: 'PU STAR Office',
    
    // ความสำคัญ
    importance: 3,
    
    // แท็ก
    tags: [],
    
    // บันทึกเพิ่มเติม
    notes: '',
  });

  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // แท็กที่มีอยู่แล้วในระบบ (ตัวอย่าง)
  const availableTags = [
    '6134 ไร้กรด', '6145 ACP', '6272 กันเชื้อรา',
    'Developer/เจ้าของโครงการ', 'EVA Cloud', 'Facebook',
    'Interior', 'Line OA', 'PU Foam', 'PU40 MS',
    'PU40 มีกรด', 'PU40 ไร้กรด', 'Wholesaler/ร้านค้าส่งเส้นอลูมิเนียม',
    'บริษัทจำหน่ายวัสดุก่อสร้าง-ฮาร์ดแวร์',
    'บริษัทรับเหมาก่อสร้างอาคาร-สำนักงาน ต่ำกว่า 8 ชั้น',
    'บริษัทรับเหมาก่อสร้างอาคาร-สำนักงาน สูงกว่า 8 ชั้น',
    'ผู้รับเหมาติดตั้งประตูหน้าต่างอลูมิเนียม',
    'ในนามบริษัท', 'ในนามบุคคล',
    'ภาคตะวันออก', 'ภาคใต้', 'ภาคเหนือ', 'ภาคอีสาน',
    'อะคริลิก Tiger',
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

  const handleContactChange = (index: number, field: string, value: any) => {
    const newContacts = [...formData.contacts];
    (newContacts[index] as any)[field] = value;
    setFormData({ ...formData, contacts: newContacts });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, {
        name: '',
        isPrimary: false,
        phone: '',
        phoneExt: '',
        position: '',
        role: '',
        email: '',
        lineId: '',
      }],
    });
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length > 1) {
      const newContacts = formData.contacts.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, contacts: newContacts });
    }
  };

  const addBranch = () => {
    setFormData({
      ...formData,
      branches: [...formData.branches, {
        name: '',
        address: '',
        country: 'Thailand (ไทย)',
        province: '',
        district: '',
      }],
    });
  };

  const removeBranch = (index: number) => {
    const newBranches = formData.branches.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, branches: newBranches });
  };

  const handleBranchChange = (index: number, field: string, value: any) => {
    const newBranches = [...formData.branches];
    (newBranches[index] as any)[field] = value;
    setFormData({ ...formData, branches: newBranches });
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (customer) {
      updateCustomer(customer.id, formData);
    } else {
      addCustomer({
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
    }
    
    if (onSave) onSave();
    onClose();
  };

  const calculateCompleteness = () => {
    let completed = 0;
    let total = 0;
    
    // ตรวจสอบฟิลด์สำคัญ
    const fields = [
      formData.name,
      formData.province,
      formData.contacts[0]?.name,
      formData.contacts[0]?.phone,
      formData.registeredAddress,
      formData.companyPhone,
      formData.taxId,
      formData.team,
      formData.owner,
    ];
    
    fields.forEach(field => {
      total++;
      if (field) completed++;
    });
    
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {customer ? 'แก้ไขลูกค้า' : 'สร้างลูกค้า'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - ข้อมูลลูกค้า + ผู้ติดต่อ */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* ข้อมูลลูกค้า */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">👤</span> ข้อมูลลูกค้า
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ชื่อกิจการ <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="ชื่อกิจการ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        รหัสลูกค้าอ้างอิง
                      </label>
                      <Input
                        value={formData.referenceCode}
                        onChange={(e) => handleChange('referenceCode', e.target.value)}
                        placeholder="รหัสลูกค้าอ้างอิง"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ประเทศ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
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
                        value={formData.province}
                        onChange={(e) => handleChange('province', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">โปรดเลือกจังหวัด</option>
                        <option>กรุงเทพมหานคร</option>
                        <option>นนทบุรี</option>
                        <option>ปทุมธานี</option>
                        <option>สมุทรปราการ</option>
                        <option>นครราชสีมา</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        อำเภอ
                      </label>
                      <select
                        value={formData.district}
                        onChange={(e) => handleChange('district', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Please select district</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ข้อมูลผู้ติดต่อ */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="mr-2">👥</span> ข้อมูลผู้ติดต่อ
                    </h3>
                    <Button
                      type="button"
                      onClick={addContact}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
                    >
                      <Plus size={16} className="mr-1" /> เพิ่มผู้ติดต่อ
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.contacts.map((contact: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={contact.isPrimary}
                              onChange={(e) => handleContactChange(index, 'isPrimary', e.target.checked)}
                              className="mr-2"
                            />
                            เลือกเป็นผู้ติดต่อหลัก
                          </label>
                          {formData.contacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeContact(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Input
                            value={contact.name}
                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                            placeholder="ชื่อผู้ติดต่อ *"
                            required
                          />

                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              value={contact.phone}
                              onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                              placeholder="เบอร์โทร *"
                              required
                              className="col-span-2"
                            />
                            <Input
                              value={contact.phoneExt}
                              onChange={(e) => handleContactChange(index, 'phoneExt', e.target.value)}
                              placeholder="ต่อ"
                            />
                          </div>

                          <Input
                            value={contact.position}
                            onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                            placeholder="ตำแหน่ง"
                          />

                          <select
                            value={contact.role}
                            onChange={(e) => handleContactChange(index, 'role', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="">โปรดเลือกบทบาท</option>
                            <option>ผู้ตัดสินใจ</option>
                            <option>ผู้ใช้งาน</option>
                            <option>ผู้มีอิทธิพล</option>
                          </select>

                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            placeholder="อีเมลผู้ติดต่อ"
                          />

                          <Input
                            value={contact.lineId}
                            onChange={(e) => handleContactChange(index, 'lineId', e.target.value)}
                            placeholder="LINE ID"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Column - ข้อมูลกิจการ */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🏢</span> ข้อมูลกิจการ
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ที่อยู่จดทะเบียน
                      </label>
                      <Textarea
                        value={formData.registeredAddress}
                        onChange={(e) => handleChange('registeredAddress', e.target.value)}
                        rows={3}
                        placeholder="ที่อยู่จดทะเบียน"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ประเทศ
                      </label>
                      <select
                        value={formData.registeredCountry}
                        onChange={(e) => handleChange('registeredCountry', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Thailand (ไทย)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        จังหวัด
                      </label>
                      <select
                        value={formData.registeredProvince}
                        onChange={(e) => handleChange('registeredProvince', e.target.value)}
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
                        value={formData.registeredDistrict}
                        onChange={(e) => handleChange('registeredDistrict', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Please select district</option>
                      </select>
                    </div>

                    <div>
                      <Button
                        type="button"
                        onClick={addBranch}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Plus size={16} className="mr-2" /> เพิ่มที่อยู่สาขา
                      </Button>
                    </div>

                    {formData.branches.map((branch: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">สาขาที่ {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeBranch(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={branch.name}
                            onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                            placeholder="ชื่อสาขา"
                          />
                          <Textarea
                            value={branch.address}
                            onChange={(e) => handleBranchChange(index, 'address', e.target.value)}
                            placeholder="ที่อยู่สาขา"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        หมายเลขโทรศัพท์กิจการ
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={formData.companyPhone}
                          onChange={(e) => handleChange('companyPhone', e.target.value)}
                          placeholder="หมายเลขโทรศัพท์"
                          className="col-span-2"
                        />
                        <Input
                          value={formData.companyPhoneExt}
                          onChange={(e) => handleChange('companyPhoneExt', e.target.value)}
                          placeholder="ต่อ"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        เลขประจำตัวผู้เสียภาษี
                      </label>
                      <Input
                        value={formData.taxId}
                        onChange={(e) => handleChange('taxId', e.target.value)}
                        placeholder="ระบุเลขประจำตัวผู้เสียภาษี"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        อีเมลกิจการ
                      </label>
                      <Input
                        type="email"
                        value={formData.companyEmail}
                        onChange={(e) => handleChange('companyEmail', e.target.value)}
                        placeholder="ระบุอีเมลกิจการ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        วันสำคัญของกิจการ
                      </label>
                      <select
                        value={formData.importantDateType}
                        onChange={(e) => handleChange('importantDateType', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                      >
                        <option>วันก่อตั้ง</option>
                        <option>วันครบรอบ</option>
                      </select>
                      <Input
                        type="date"
                        value={formData.importantDate}
                        onChange={(e) => handleChange('importantDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <Button
                        type="button"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Upload size={16} className="mr-2" /> แนบเอกสารที่เกี่ยวข้อง
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        ไฟล์จะต้องมีขนาดไม่เกิน 20 เมกะไบต์/ไฟล์
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - ความสัมพันธ์ + ทีม + ความสำคัญ + แท็ก */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* ความสัมพันธ์ลูกค้า */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📊</span> ความสัมพันธ์ลูกค้า
                  </h3>

                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${calculateCompleteness() * 3.51} 351`}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {calculateCompleteness()}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">ความสมบูรณ์ของข้อมูล</p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {formData.logo ? (
                        <img src={formData.logo as string} alt="Logo" className="max-h-32 mx-auto" />
                      ) : (
                        <div>
                          <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">อัปโหลดโลโก้กิจการ</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <Button
                    type="button"
                    className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus size={16} className="mr-2" /> เพิ่มข้อมูล
                  </Button>
                </div>

                {/* ทีมที่รับผิดชอบ */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">ทีมที่รับผิดชอบ</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ทีม
                      </label>
                      <select
                        value={formData.team}
                        onChange={(e) => handleChange('team', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Trade Sales Team</option>
                        <option>Project Sales Team</option>
                      </select>
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
                        <option>Saletrades 1 Kitti</option>
                        <option>Saleprojects 1 Sunisa</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ความสำคัญ */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">ความสำคัญ</h3>

                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleChange('importance', star)}
                        className="focus:outline-none"
                      >
                        <Star
                          size={32}
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

                {/* แท็ก */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">เพิ่มแท็ก</h3>

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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.map((tag: string, index: number) => (
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
                  </div>

                  {/* แท็กที่แนะนำ */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">แท็กที่แนะนำ:</p>
                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                      {availableTags
                        .filter(tag => !formData.tags.includes(tag))
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

            {/* บันทึกเพิ่มเติม */}
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">บันทึกเพิ่มเติม</h3>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                placeholder="บันทึกข้อมูลเพิ่มเติม..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              บันทึก
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
