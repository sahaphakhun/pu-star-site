"use client"

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Upload, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import ProductAutocomplete from '@/components/ui/ProductAutocomplete';
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
} from '@/components/ui/AppModal';
import { deriveTeamOptions } from '@/utils/teamOptions';

const defaultFormData = {
  // ข้อมูลลูกค้า
  customerId: '',
  customerName: '',
  customerTaxId: '',
  customerAddress: '',
  customerPhone: '',
  customerProvince: '',
  customerDistrict: '',
  customerSubdistrict: '',
  customerZipcode: '',
  projectId: '',
  opportunityId: '',

  // วันที่
  issueDate: new Date().toISOString().split('T')[0],
  validUntilDate: '',

  // ผู้รับผิดชอบ
  importance: 3,
  owner: '',
  team: '',

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
  shipToSameAsCustomer: true,
  deliveryLocationName: '',
  shippingAddress: '',
  deliveryCountry: 'Thailand (ไทย)',
  deliveryProvince: '',
  deliveryDistrict: '',
  deliverySubdistrict: '',
  deliveryZipcode: '',

  // รายการสินค้า
  showProductCode: false,
  items: [
    { productId: '', productName: '', sku: '', product: null, description: '', quantity: 0, unit: '', pricePerUnit: 0, discountPerUnit: 0, discountPercent: 0, amount: 0, productGroup: '' },
    { productId: '', productName: '', sku: '', product: null, description: '', quantity: 0, unit: '', pricePerUnit: 0, discountPerUnit: 0, discountPercent: 0, amount: 0, productGroup: '' },
    { productId: '', productName: '', sku: '', product: null, description: '', quantity: 0, unit: '', pricePerUnit: 0, discountPerUnit: 0, discountPercent: 0, amount: 0, productGroup: '' },
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
  embedded?: boolean;
}

export default function QuotationForm({
  quotation,
  initialData,
  customers,
  onSubmit,
  onCancel,
  onClose,
  onSave,
  embedded = false,
}: QuotationFormProps) {
  const customersList = customers ?? [];
  const normalizeItem = (item: any = {}) => {
    const pricePerUnit = Number(item.pricePerUnit ?? item.unitPrice ?? 0);
    const discountPercent = Number(item.discountPercent ?? item.discount ?? 0);
    const discountPerUnit = Number(
      item.discountPerUnit ?? (pricePerUnit ? (pricePerUnit * discountPercent) / 100 : 0)
    );
    const quantity = Number(item.quantity ?? 0);
    const amount = Number(
      item.amount ?? item.totalPrice ?? ((pricePerUnit - discountPerUnit) * quantity)
    );
    const productId = item.productId || item._id || '';
    const productName = item.productName || item.name || '';
    const sku = item.sku || productId || '';
    const product = item.product || (productId ? {
      _id: productId,
      name: productName || sku,
      sku: sku || productId,
      price: item.unitPrice ?? item.pricePerUnit,
      units: item.units,
    } : null);

    return {
      ...item,
      productId,
      productName,
      sku,
      product,
      description: item.description || '',
      quantity,
      unit: item.unit || '',
      pricePerUnit,
      discountPerUnit,
      discountPercent,
      amount,
      productGroup: item.productGroup || '',
    };
  };

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
        owner: base.assignedTo || base.owner || defaultFormData.owner,
        items: (base.items && base.items.length ? base.items : defaultFormData.items).map(normalizeItem),
        deliveryBatches: mappedBatches,
        isSplitDelivery: mappedBatches.length > 0,
      };
    }

    return { ...defaultFormData, items: defaultFormData.items.map(normalizeItem) };
  });
  const [admins, setAdmins] = useState<Array<{ _id: string; name?: string; phone?: string; team?: string }>>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const teamOptions = useMemo(() => {
    const derived = deriveTeamOptions(admins);
    const selected = formData.team?.trim();
    if (selected && !derived.includes(selected)) {
      return [selected, ...derived];
    }
    return derived;
  }, [admins, formData.team]);

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

  useEffect(() => {
    if (!formData.team && teamOptions.length > 0) {
      setFormData((prev: any) => ({ ...prev, team: teamOptions[0] }));
    }
  }, [formData.team, teamOptions]);

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const [projectsRes, opportunitiesRes] = await Promise.all([
          fetch('/api/projects?page=1&limit=200', { credentials: 'include' }),
          fetch('/api/deals?page=1&limit=200', { credentials: 'include' }),
        ]);

        const projectsData = await projectsRes.json().catch(() => ({}));
        const opportunitiesData = await opportunitiesRes.json().catch(() => ({}));

        if (!active) return;
        const projectList = Array.isArray(projectsData)
          ? projectsData
          : Array.isArray(projectsData?.data)
            ? projectsData.data
            : [];
        const opportunityList = Array.isArray(opportunitiesData)
          ? opportunitiesData
          : Array.isArray(opportunitiesData?.data)
            ? opportunitiesData.data
            : [];

        setProjects(projectList);
        setOpportunities(opportunityList);
      } catch {
        if (active) {
          setProjects([]);
          setOpportunities([]);
        }
      }
    };

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      let next = { ...prev, [field]: value };

      if (field === 'customerId' && value) {
        const customer = customersList.find((c: any) => String(c._id || c.id) === String(value));
        if (customer) {
          const primaryContact = customer.contacts?.[0];
          const customerAddress = customer.companyAddress || customer.shippingAddress || '';
          const shippingAddress = customer.shippingAddress || customer.companyAddress || '';
          const shipToSameAsCustomer = customer.shippingSameAsCompany ?? true;
          const customerProvince = customer.province || '';
          const customerDistrict = customer.district || '';
          const customerSubdistrict = customer.subdistrict || '';
          const customerZipcode = customer.zipcode || '';

          next = {
            ...next,
            customerName: customer.name,
            customerTaxId: customer.taxId || '',
            customerAddress,
            customerPhone: customer.phoneNumber || customer.companyPhone || '',
            customerProvince,
            customerDistrict,
            customerSubdistrict,
            customerZipcode,
            contactName: primaryContact?.name || '',
            contactEmail: primaryContact?.email || '',
            contactPhone: primaryContact?.phone || '',
            shipToSameAsCustomer,
            shippingAddress: shipToSameAsCustomer ? customerAddress : shippingAddress,
            deliveryProvince: shipToSameAsCustomer ? customerProvince : next.deliveryProvince,
            deliveryDistrict: shipToSameAsCustomer ? customerDistrict : next.deliveryDistrict,
            deliverySubdistrict: shipToSameAsCustomer ? customerSubdistrict : next.deliverySubdistrict,
            deliveryZipcode: shipToSameAsCustomer ? customerZipcode : next.deliveryZipcode,
          };
        }
      }

      if (field === 'shipToSameAsCustomer' && value) {
        next = {
          ...next,
          shippingAddress: prev.customerAddress || '',
          deliveryProvince: prev.customerProvince || '',
          deliveryDistrict: prev.customerDistrict || '',
          deliverySubdistrict: prev.customerSubdistrict || '',
          deliveryZipcode: prev.customerZipcode || '',
        };
      }

      return next;
    });
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

  const handleProductSelect = (index: number, product: any | null) => {
    const newItems = [...formData.items];
    const existing = newItems[index];

    if (!product) {
      newItems[index] = {
        ...existing,
        product: null,
        productId: '',
        productName: '',
        sku: '',
      };
      setFormData({ ...formData, items: newItems });
      calculateTotals(newItems);
      return;
    }

    const resolvedUnit = product.units?.[0]?.label || existing.unit || '';
    const resolvedPrice = product.price ?? product.units?.[0]?.price ?? existing.pricePerUnit ?? 0;
    const nextItem = {
      ...existing,
      product,
      productId: product._id,
      productName: product.name || '',
      sku: product.sku || '',
      unit: resolvedUnit,
      pricePerUnit: resolvedPrice,
      description: existing.description || product.description || '',
    };
    nextItem.amount = (Number(nextItem.pricePerUnit || 0) - Number(nextItem.discountPerUnit || 0)) * Number(nextItem.quantity || 0);
    newItems[index] = nextItem;

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
        productId: '',
        productName: '',
        sku: '',
        product: null,
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

    const mappedItems = (formData.items || []).map((item: any) => {
      const unitPrice = Number(item.pricePerUnit || 0);
      const quantity = Number(item.quantity || 0);
      const discountPercent = Number(item.discountPercent || 0);
      const discountPerUnit = Number(item.discountPerUnit || (unitPrice * discountPercent) / 100 || 0);
      const totalPrice = Number(item.amount || (unitPrice - discountPerUnit) * quantity || 0);
      return {
        productId: item.productId || item.sku || '',
        productName: item.productName || item.description || '',
        description: item.description || '',
        quantity,
        unit: item.unit || '',
        sku: item.sku || undefined,
        unitPrice,
        discount: discountPercent,
        totalPrice,
      };
    });

    const subtotalBeforeDiscount = mappedItems.reduce(
      (sum: number, item: any) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0
    );
    const totalAmount = mappedItems.reduce(
      (sum: number, item: any) => sum + Number(item.totalPrice || 0),
      0
    );
    const totalDiscount = Math.max(subtotalBeforeDiscount - totalAmount, 0);
    const vatRate = Number(formData.vat || 0);
    const vatAmount = (totalAmount * vatRate) / 100;
    const grandTotal = totalAmount + vatAmount;

    const selectedProject = projects.find(
      (project: any) => String(project._id || project.id) === String(formData.projectId)
    );
    const subject =
      selectedProject?.name ||
      selectedProject?.projectCode ||
      (formData as any).subject ||
      formData.customerName ||
      'ใบเสนอราคา';

    const quotationData = {
      ...rest,
      customerTaxId: formData.customerTaxId || '',
      customerAddress: formData.customerAddress || '',
      customerPhone: formData.customerPhone || '',
      shipToSameAsCustomer: formData.shipToSameAsCustomer,
      shippingAddress: formData.shipToSameAsCustomer
        ? formData.customerAddress || ''
        : formData.shippingAddress || '',
      subject,
      validUntil: formData.validUntilDate || '',
      deliveryTerms: formData.deliveryMethodNote || formData.deliveryMethod || '',
      items: mappedItems,
      subtotal: subtotalBeforeDiscount,
      totalDiscount,
      totalAmount,
      vatRate,
      vatAmount,
      grandTotal,
      status: action === 'submit' ? 'sent' : 'draft',
      approvalStatus: action === 'submit' ? 'pending' : 'none',
      deliveryBatches: preparedDeliveryBatches,
      assignedTo: formData.owner || '',
      quotationNumber: quotation?.quotationNumber || `Q${Date.now()}`,
      id: quotation?.id || (initialData as any)?.id || Date.now().toString(),
      createdAt: quotation?.createdAt || (initialData as any)?.createdAt || new Date().toISOString(),
    };

    if (!onSubmit) {
      throw new Error('ระบบบันทึกใบเสนอราคายังไม่ได้เชื่อมต่อ');
    }
    await onSubmit(quotationData);

    if (onSave) onSave();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const filteredProjects = formData.customerId
    ? projects.filter((project: any) => String(project.customerId) === String(formData.customerId))
    : projects;
  const filteredOpportunities = formData.customerId
    ? opportunities.filter((deal: any) => String(deal.customerId) === String(formData.customerId))
    : opportunities;

  const formBody = (
    <form className="flex h-full flex-col" onSubmit={(e) => handleSubmit(e, 'submit')}>
      <AppModalHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AppModalTitle>
            {quotation ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคา'}
          </AppModalTitle>
          <div className="text-sm font-semibold text-slate-700">
            รวมทั้งสิ้น THB {formData.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </AppModalHeader>
      <AppModalBody>
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
                        <option key={customer._id || customer.id} value={customer._id || customer.id}>
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
                      {filteredProjects.map((project: any) => (
                        <option key={project._id || project.id} value={project._id || project.id}>
                          {project.projectCode ? `${project.projectCode} - ${project.name}` : project.name}
                        </option>
                      ))}
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
                      {filteredOpportunities.map((deal: any) => (
                        <option key={deal._id || deal.id} value={deal._id || deal.id}>
                          {deal.title || deal.customerName || deal._id}
                        </option>
                      ))}
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
                            className={`${star <= formData.importance
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
                      <option value="">ไม่ระบุ</option>
                      {admins.map((admin) => (
                        <option key={admin._id} value={admin._id}>
                          {admin.name || admin.phone || admin._id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      ทีมที่รับผิดชอบ <span className="text-red-500">*</span>
                    </label>
                    {teamOptions.length > 0 ? (
                      <select
                        required
                        value={formData.team}
                        onChange={(e) => handleChange('team', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">โปรดเลือกทีม</option>
                        {teamOptions.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        required
                        value={formData.team}
                        onChange={(e) => handleChange('team', e.target.value)}
                        placeholder="ระบุทีม"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    )}
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
                        checked={formData.shipToSameAsCustomer}
                        onChange={(e) => handleChange('shipToSameAsCustomer', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">ที่อยู่เดียวกับลูกค้า</span>
                    </label>
                  </div>

                  <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {formData.customerAddress || 'ยังไม่มีที่อยู่ลูกค้า'}
                  </div>

                  {!formData.shipToSameAsCustomer && (
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
                          value={formData.shippingAddress}
                          onChange={(e) => handleChange('shippingAddress', e.target.value)}
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

                      <AddressAutocomplete
                        value={{
                          province: formData.deliveryProvince,
                          district: formData.deliveryDistrict,
                          subdistrict: formData.deliverySubdistrict,
                          zipcode: formData.deliveryZipcode,
                        }}
                        onChange={(address) => {
                          handleChange('deliveryProvince', address.province);
                          handleChange('deliveryDistrict', address.district);
                          handleChange('deliverySubdistrict', address.subdistrict);
                          handleChange('deliveryZipcode', address.zipcode);
                        }}
                        showSubdistrict={true}
                        showZipcode={true}
                      />
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
            <div className="col-span-12 lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-6 self-start">
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
                        <div className="space-y-2">
                          <ProductAutocomplete
                            value={item.product || null}
                            onChange={(product) => handleProductSelect(index, product)}
                            placeholder="พิมพ์ชื่อสินค้า หรือรหัสสินค้า"
                          />
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            rows={2}
                            placeholder="รายละเอียดเพิ่มเติม"
                          />
                        </div>
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
      </AppModalBody>
      <AppModalFooter>
        <Button
          type="button"
          onClick={handleCancel}
          variant="outline"
        >
          ยกเลิก
        </Button>
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          variant="secondary"
        >
          บันทึกร่าง
        </Button>
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, 'submit')}
        >
          บันทึกและส่งอนุมัติ
        </Button>
      </AppModalFooter>
    </form>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <AppModal open onOpenChange={(open) => !open && onClose?.()}>
      <AppModalContent size="2xl">
        {formBody}
      </AppModalContent>
    </AppModal>
  );
}
