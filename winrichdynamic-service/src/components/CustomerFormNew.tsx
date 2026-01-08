"use client"

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, Upload, Star, AlertTriangle } from 'lucide-react';
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
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { deriveTeamOptions } from '@/utils/teamOptions';

interface CustomerFormNewProps {
  customer?: any;
  onClose: () => void;
  onSubmit: (payload: any, options: { customerId?: string }) => Promise<void>;
}

const ensureContact = (contact?: any) => ({
  name: contact?.name || '',
  isPrimary: contact?.isPrimary ?? true,
  phone: contact?.phone || '',
  phoneExt: contact?.phoneExt || '',
  position: contact?.position || '',
  role: contact?.role || '',
  email: contact?.email || '',
  lineId: contact?.lineId || '',
});

const normalizePhone = (input: string) => {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+66${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+66${digits}`;
  }
  return `+${digits}`;
};

export default function CustomerFormNew({ customer, onClose, onSubmit }: CustomerFormNewProps) {
  const fetchNextCustomerCode = useCallback(async () => {
    try {
      const res = await fetch('/api/customers/next-code', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      return typeof data?.code === 'string' ? data.code : '';
    } catch {
      return '';
    }
  }, []);

  const initialFormData = useMemo(() => {
    if (!customer) {
      return {
        // ข้อมูลลูกค้า
        name: '',
        customerCode: '',
        referenceCode: '',
        country: 'Thailand (ไทย)',
        province: '',
        district: '',
        subdistrict: '',
        zipcode: '',

        // ข้อมูลผู้ติดต่อ
        contacts: [
          ensureContact(),
        ],

        // ข้อมูลกิจการ
        registeredAddress: '',
        registeredCountry: 'Thailand (ไทย)',
        registeredProvince: '',
        registeredDistrict: '',
        registeredSubdistrict: '',
        registeredZipcode: '',
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
        team: '',
        owner: '',

        // ความสำคัญ
        importance: 3,

        // แท็ก
        tags: [],

        // บันทึกเพิ่มเติม
        notes: '',
        customerType: 'new',
        assignedTo: '',
        paymentTerms: 'ชำระเงินทันที',

        // สถานะการขาย
        status: 'planning',
      };
    }

    return {
      ...customer,
      contacts: customer.contacts && customer.contacts.length
        ? customer.contacts.map(ensureContact)
        : [ensureContact({
          name: customer.contactName,
          phone: customer.phoneNumber,
          email: customer.email,
        })],
      branches: customer.branches || [],
      documents: customer.documents || [],
      importance: customer.priorityStar ?? customer.importance ?? 0,
      team: customer.team || customer.customerType || '',
      owner: customer.assignedTo || customer.owner || '',
      registeredAddress: customer.companyAddress || customer.registeredAddress || '',
      taxId: customer.taxId || '',
      registeredProvince: (customer as any).registeredProvince || '',
      registeredDistrict: (customer as any).registeredDistrict || '',
      registeredSubdistrict: (customer as any).registeredSubdistrict || '',
      registeredZipcode: (customer as any).registeredZipcode || '',
      tags: customer.tags || [],
      notes: customer.notes || '',
      customerType: customer.customerType || 'new',
      paymentTerms: customer.paymentTerms || 'ชำระเงินทันที',
      status: customer.status || 'planning',
      subdistrict: (customer as any).subdistrict || '',
      zipcode: (customer as any).zipcode || '',
    };
  }, [customer]);

  const [formData, setFormData] = useState(initialFormData);
  const [admins, setAdmins] = useState<Array<{ _id: string; name?: string; phone?: string; team?: string }>>([]);
  const teamOptions = useMemo(() => {
    const derived = deriveTeamOptions(admins);
    const selected = formData.team?.trim();
    if (selected && !derived.includes(selected)) {
      return [selected, ...derived];
    }
    return derived;
  }, [admins, formData.team]);

  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [taxIdWarning, setTaxIdWarning] = useState<string | null>(null);
  const [checkingTaxId, setCheckingTaxId] = useState(false);

  useEffect(() => {
    if (customer || formData.customerCode) return;
    let active = true;
    fetchNextCustomerCode().then((code) => {
      if (active && code) {
        setFormData((prev: typeof initialFormData) => ({ ...prev, customerCode: code }));
      }
    });
    return () => {
      active = false;
    };
  }, [customer, formData.customerCode, fetchNextCustomerCode]);

  useEffect(() => {
    if (!formData.team && teamOptions.length > 0) {
      setFormData((prev: typeof initialFormData) => ({ ...prev, team: teamOptions[0] }));
    }
  }, [formData.team, teamOptions]);

  useEffect(() => {
    let active = true;
    const loadAdmins = async () => {
      try {
        const res = await fetch('/api/adminb2b/admins', { credentials: 'include' });
        const data = await res.json();
        if (!active) return;
        if (data?.success && Array.isArray(data.data)) {
          setAdmins(data.data);
        } else {
          setAdmins([]);
        }
      } catch {
        if (active) setAdmins([]);
      }
    };
    loadAdmins();
    return () => {
      active = false;
    };
  }, []);

  // ตรวจสอบเลขผู้เสียภาษีซ้ำ
  const checkTaxIdDuplicate = useCallback(async (taxId: string) => {
    if (!taxId || taxId.length !== 13) {
      setTaxIdWarning(null);
      return;
    }
    setCheckingTaxId(true);
    try {
      const excludeId = customer?._id || customer?.id || '';
      const res = await fetch(
        `/api/customers/check-tax-id?taxId=${taxId}&excludeId=${excludeId}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.exists) {
        setTaxIdWarning(`⚠️ พบลูกค้าที่ใช้เลขนี้แล้ว: ${data.customerName}`);
      } else {
        setTaxIdWarning(null);
      }
    } catch {
      setTaxIdWarning(null);
    } finally {
      setCheckingTaxId(false);
    }
  }, [customer]);

  // Handle tax ID blur
  const handleTaxIdBlur = () => {
    if (formData.taxId) {
      checkTaxIdDuplicate(formData.taxId);
    }
  };

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
    setFormData((prev: typeof initialFormData) => ({ ...prev, [field]: value }));
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
      branches: [...(formData.branches || []), {
        name: '',
        address: '',
        country: 'Thailand (ไทย)',
        province: '',
        district: '',
      }],
    });
  };

  const removeBranch = (index: number) => {
    const newBranches = (formData.branches || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, branches: newBranches });
  };

  const handleBranchChange = (index: number, field: string, value: any) => {
    const newBranches = [...(formData.branches || [])];
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

  const buildPayload = () => {
    const primaryContact = formData.contacts?.[0] || {};
    const phoneNumber = normalizePhone(primaryContact.phone || formData.phoneNumber || '');
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error('กรุณาระบุเบอร์โทรศัพท์ลูกค้าให้ถูกต้อง');
    }

    const payload: Record<string, any> = {
      name: formData.name,
      customerCode: formData.customerCode?.trim() || undefined,
      phoneNumber,
      email: primaryContact.email || '',
      taxId: formData.taxId || '',
      companyName: formData.companyName || formData.name,
      companyAddress: formData.registeredAddress || '',
      province: formData.province || '',
      district: formData.district || '',
      subdistrict: formData.subdistrict || '',
      zipcode: formData.zipcode || '',
      registeredProvince: formData.registeredProvince || '',
      registeredDistrict: formData.registeredDistrict || '',
      registeredSubdistrict: formData.registeredSubdistrict || '',
      registeredZipcode: formData.registeredZipcode || '',
      companyPhone: formData.companyPhone ? normalizePhone(formData.companyPhone) : '',
      companyEmail: formData.companyEmail || '',
      shippingAddress: formData.deliveryAddress || '',
      shippingSameAsCompany: !formData.deliveryAddress,
      customerType: formData.customerType || 'new',
      assignedTo: formData.owner || '',
      paymentTerms: formData.paymentTerms || 'ชำระเงินทันที',
      creditLimit: formData.creditLimit ? Number(formData.creditLimit) : undefined,
      notes: formData.notes || '',
      tags: formData.tags || [],
      priorityStar: formData.importance || 0,
      goals: formData.goals || '',
      status: formData.status || 'planning', // เพิ่มสถานะการขาย
      authorizedPhones: (formData.contacts || [])
        .map((c: any) => normalizePhone(c.phone || ''))
        .filter(Boolean),
      isActive: formData.isActive ?? true,
    };

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const payload = buildPayload();
      await onSubmit(payload, { customerId: customer?._id || customer?.id });
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกลูกค้า');
      }
    } finally {
      setSubmitting(false);
    }
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
    <AppModal open onOpenChange={(open) => !open && onClose()}>
      <AppModalContent size="2xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <AppModalHeader>
            <AppModalTitle>{customer ? 'แก้ไขลูกค้า' : 'สร้างลูกค้า'}</AppModalTitle>
          </AppModalHeader>
          <AppModalBody>
            {errorMessage && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
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
                        รหัสลูกค้า
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.customerCode}
                          onChange={(e) => handleChange('customerCode', e.target.value)}
                          placeholder="รหัสลูกค้า"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={async () => {
                            const code = await fetchNextCustomerCode();
                            if (code) {
                              handleChange('customerCode', code);
                            }
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3"
                        >
                          สร้างอัตโนมัติ
                        </Button>
                      </div>
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

                    {/* Address Autocomplete */}
                    <AddressAutocomplete
                      value={{
                        province: formData.province,
                        district: formData.district,
                        subdistrict: formData.subdistrict,
                        zipcode: formData.zipcode,
                      }}
                      onChange={(address) => {
                        handleChange('province', address.province);
                        handleChange('district', address.district);
                        handleChange('subdistrict', address.subdistrict);
                        handleChange('zipcode', address.zipcode);
                      }}
                      showSubdistrict={true}
                      showZipcode={true}
                    />
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

                    <AddressAutocomplete
                      value={{
                        province: formData.registeredProvince,
                        district: formData.registeredDistrict,
                        subdistrict: formData.registeredSubdistrict,
                        zipcode: formData.registeredZipcode,
                      }}
                      onChange={(address) => {
                        handleChange('registeredProvince', address.province);
                        handleChange('registeredDistrict', address.district);
                        handleChange('registeredSubdistrict', address.subdistrict);
                        handleChange('registeredZipcode', address.zipcode);
                      }}
                      showSubdistrict={true}
                      showZipcode={true}
                    />

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
                        onBlur={handleTaxIdBlur}
                        placeholder="ระบุเลขประจำตัวผู้เสียภาษี"
                        maxLength={13}
                      />
                      {checkingTaxId && (
                        <p className="text-sm text-gray-500 mt-1">กำลังตรวจสอบ...</p>
                      )}
                      {taxIdWarning && (
                        <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {taxIdWarning}
                        </p>
                      )}
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
                      {teamOptions.length > 0 ? (
                        <select
                          value={formData.team}
                          onChange={(e) => handleChange('team', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">ไม่ระบุ</option>
                          {teamOptions.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          value={formData.team}
                          onChange={(e) => handleChange('team', e.target.value)}
                          placeholder="ระบุทีม"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      )}
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
                        <option value="">ไม่ระบุ</option>
                        {admins.map((admin) => (
                          <option key={admin._id} value={admin._id}>
                            {admin.name || admin.phone || admin._id}
                          </option>
                        ))}
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
                          className={`${star <= formData.importance
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

            {/* สถานะการขาย */}
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">สถานะการขาย</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { value: 'planning', label: 'วางแผน', color: 'bg-gray-100 text-gray-800 border-gray-300' },
                  { value: 'proposed', label: 'นำเสนอสินค้า', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                  { value: 'quoted', label: 'เสนอราคา', color: 'bg-orange-100 text-orange-800 border-orange-300' },
                  { value: 'testing', label: 'ทดสอบตัวอย่างสินค้า', color: 'bg-purple-100 text-purple-800 border-purple-300' },
                  { value: 'approved', label: 'อนุมัติราคา', color: 'bg-green-100 text-green-800 border-green-300' },
                  { value: 'closed', label: 'ปิดใบเสนอราคา', color: 'bg-red-100 text-red-800 border-red-300' },
                ].map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleChange('status', status.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${formData.status === status.value
                      ? `${status.color} ring-2 ring-offset-2 ring-blue-500`
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ขั้นตอนปัจจุบัน:</strong> {
                    [
                      { value: 'planning', label: 'วางแผน' },
                      { value: 'proposed', label: 'นำเสนอสินค้า' },
                      { value: 'quoted', label: 'เสนอราคา' },
                      { value: 'testing', label: 'ทดสอบตัวอย่างสินค้า' },
                      { value: 'approved', label: 'อนุมัติราคา' },
                      { value: 'closed', label: 'ปิดใบเสนอราคา' },
                    ].find(s => s.value === formData.status)?.label || 'วางแผน'
                  }
                </p>
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
