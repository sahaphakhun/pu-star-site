'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { computeLineTotal, round2, computeVatIncluded } from '@/utils/number';

interface QuotationItem {
  productId: string;
  productName: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
  totalPrice: string;
  sku?: string;
  selectedOptions?: Record<string, string>;
}

interface ProductOptionValue {
  label: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

interface ProductOption {
  name: string;
  values: ProductOptionValue[];
}

interface ProductSummary {
  _id: string;
  name: string;
  sku?: string;
  price?: number;
  units?: Array<{ label: string; price: number; shippingFee?: number; sku?: string }>;
  options?: ProductOption[];
  isAvailable: boolean;
}

interface QuotationFormData {
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerAddress: string;
  shippingAddress: string;
  shipToSameAsCustomer: boolean;
  customerPhone: string;
  subject: string;
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  items: QuotationItem[];
  specialDiscount: string; // จำนวนเงินเป็นบาท
  vatRate: string;
  notes: string;
}

interface Customer {
  _id: string;
  name: string;
  phoneNumber?: string;
  taxId?: string;
  companyAddress?: string;
  companyPhone?: string;
  shippingAddress?: string;
  shippingSameAsCompany?: boolean;
}

interface QuotationFormProps {
  initialData?: Partial<QuotationFormData>;
  customers: Customer[];
  onSubmit: (data: any) => Promise<any>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const QuotationForm: React.FC<QuotationFormProps> = ({
  initialData,
  customers,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const getDefaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [formData, setFormData] = useState<QuotationFormData>({
    customerId: '',
    customerName: '',
    customerTaxId: '',
    customerAddress: '',
    shippingAddress: '',
    shipToSameAsCustomer: true,
    customerPhone: '',
    subject: '',
    validUntil: getDefaultValidUntil(),
    paymentTerms: 'ชำระเงินทันที',
    deliveryTerms: '',
    items: [
      {
        productId: '',
        productName: '',
        description: '',
        quantity: '',
        unit: '',
        sku: '',
        unitPrice: '',
        discount: '0',
        totalPrice: '',
        selectedOptions: {},
      }
    ],
    specialDiscount: '0',
    vatRate: '7',
    notes: '',
  });

  type QuotationFormErrors = Partial<Record<keyof QuotationFormData, string>>;
  const [errors, setErrors] = useState<QuotationFormErrors>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // โหลดรายการสินค้า
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products?isAvailable=true&limit=100&page=1', { credentials: 'include' });
        const data = await res.json();
        if (data?.success) {
          const productList: ProductSummary[] = (Array.isArray(data.data) ? data.data : []).map((p: any) => ({
            _id: String(p._id || ''),
            name: String(p.name || ''),
            sku: p.sku ? String(p.sku) : undefined,
            price: typeof p.price === 'number' ? p.price : undefined,
            units: Array.isArray(p.units)
              ? p.units
                  .filter((u: any) => u && u.label)
                  .map((u: any) => ({
                    label: String(u.label),
                    price: typeof u.price === 'number' ? u.price : Number(u.price) || 0,
                    shippingFee: typeof u.shippingFee === 'number' || typeof u.shippingFee === 'string'
                      ? Number(u.shippingFee)
                      : undefined,
                    sku: u.sku ? String(u.sku) : undefined,
                  }))
              : undefined,
            options: Array.isArray(p.options)
              ? p.options
                  .filter((opt: any) => opt && opt.name)
                  .map((opt: any) => ({
                    name: String(opt.name),
                    values: Array.isArray(opt.values)
                      ? opt.values
                          .filter((val: any) => val && val.label)
                          .map((val: any) => ({
                            label: String(val.label),
                            imageUrl: val.imageUrl ? String(val.imageUrl) : undefined,
                            isAvailable: val.isAvailable !== false,
                          }))
                      : [],
                  }))
              : [],
            isAvailable: p.isAvailable !== false,
          }));
          setProducts(productList);
        }
      } catch (e) {
        // เงียบไว้ ไม่ต้องบล็อคการกรอกฟอร์ม
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => {
        const merged: QuotationFormData = {
          ...prev,
          ...initialData,
        } as QuotationFormData;

        if (initialData.items && Array.isArray(initialData.items)) {
          merged.items = initialData.items.map(item => ({
            productId: item.productId || '',
            productName: item.productName || '',
            description: item.description || '',
            quantity: typeof item.quantity === 'string' ? item.quantity : String(item.quantity ?? ''),
            unit: item.unit || '',
            sku: item.sku ? String(item.sku) : '',
            unitPrice: typeof item.unitPrice === 'string' ? item.unitPrice : String(item.unitPrice ?? ''),
            discount: typeof item.discount === 'string' ? item.discount : String(item.discount ?? '0'),
            totalPrice: typeof item.totalPrice === 'string' ? item.totalPrice : String(item.totalPrice ?? ''),
            selectedOptions: item.selectedOptions
              ? Object.fromEntries(
                  Object.entries(item.selectedOptions).map(([key, value]) => [key, String(value)])
                )
              : undefined,
          }));
        }

        return merged;
      });
      
      // หาลูกค้าที่เลือก
      if (initialData.customerId) {
        const customer = customers.find(c => c._id === initialData.customerId);
        if (customer) {
          setSelectedCustomer(customer);
          setCustomerQuery(customer.name || '');
        }
      }
    }
  }, [initialData, customers]);

  // คำนวณราคารวมของแต่ละรายการ
  const calculateItemTotal = (item: QuotationItem): number => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discount) || 0;
    return round2(computeLineTotal(quantity, unitPrice, discount));
  };

  // คำนวณราคารวมทั้งหมด
  const calculateTotals = () => {
    const subtotalRaw = formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
    const subtotal = round2(subtotalRaw);
    
    const itemsDiscountRaw = formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discount) || 0;
      const itemGross = qty * price;
      return sum + (itemGross * (disc / 100));
    }, 0);
    const itemsDiscount = round2(itemsDiscountRaw);

    const specialDiscount = Math.max(0, parseFloat(formData.specialDiscount || '0') || 0);
    const totalDiscount = round2(itemsDiscount + specialDiscount);
    
    const totalAmount = round2(subtotal - totalDiscount);
    const vatRate = parseFloat(formData.vatRate) || 7;
    const { vatAmount } = computeVatIncluded(totalAmount, vatRate);
    const grandTotal = totalAmount; // รวมภาษีอยู่แล้ว
    
    return { subtotal, itemsDiscount, specialDiscount, totalDiscount, totalAmount, vatAmount, grandTotal };
  };

  const validateForm = (): boolean => {
    const newErrors: QuotationFormErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = 'กรุณาเลือกลูกค้า';
    }

    // subject ไม่บังคับ

    // validUntil ไม่บังคับ (ถ้าไม่ระบุ จะ default +7 วัน ที่ฝั่งเซิร์ฟเวอร์)

    if (!formData.paymentTerms.trim()) {
      newErrors.paymentTerms = 'กรุณาระบุเงื่อนไขการชำระเงิน';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ';
    }

    // ตรวจสอบรายการสินค้า
    formData.items.forEach((item, index) => {
      if (!item.productName.trim()) {
        newErrors.items = 'กรุณาระบุชื่อสินค้าทุกรายการ';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors.items = 'กรุณาระบุจำนวนสินค้าทุกรายการ';
      }
      if (!item.unit.trim()) {
        newErrors.items = 'กรุณาระบุหน่วยสินค้าทุกรายการ';
      }
      if (!item.unitPrice || parseFloat(item.unitPrice) < 0) {
        newErrors.items = 'กรุณาระบุราคาต่อหน่วยสินค้าทุกรายการ';
      }
      if (!newErrors.items) {
        const product = products.find(p => p._id === item.productId);
        if (product?.options && product.options.length > 0) {
          const hasMissingSelection = product.options.some(option => {
            const selected = item.selectedOptions?.[option.name] || '';
            if (!selected) return true;
            return !(option.values || []).some(value => value.label === selected);
          });
          if (hasMissingSelection) {
            newErrors.items = 'กรุณาเลือกตัวเลือกสินค้าให้ครบถ้วน';
          }
        }
      }
    });

    // ตรวจสอบส่วนลดพิเศษ
    const { subtotal, itemsDiscount } = calculateTotals();
    const sd = Math.max(0, parseFloat(formData.specialDiscount || '0') || 0);
    if (sd < 0) {
      newErrors.specialDiscount = 'ส่วนลดพิเศษต้องไม่เป็นค่าติดลบ';
    } else if (sd > round2(subtotal - itemsDiscount)) {
      newErrors.specialDiscount = 'ส่วนลดพิเศษต้องไม่มากกว่าราคารวมหลังหักส่วนลดตามรายการ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('กรุณาตรวจสอบข้อมูลให้ถูกต้อง');
      return;
    }

    try {
      // Calculate totals first
      const { subtotal, totalDiscount, totalAmount, vatAmount, grandTotal } = calculateTotals();
      
      // Validate required fields
      if (!formData.customerId || !formData.subject || !formData.validUntil) {
        toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
      }

      // Validate date
      const validUntilDate = new Date(formData.validUntil);
      if (formData.validUntil) {
        if (isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
          toast.error('วันหมดอายุต้องเป็นวันที่ในอนาคต');
          return;
        }
      }

      // Validate items
      const hasInvalidItems = formData.items.some(item => 
        {
          if (!item.productName.trim() || !item.quantity || parseFloat(item.quantity) <= 0 || parseFloat(item.unitPrice) < 0) {
            return true;
          }
          const product = products.find(p => p._id === item.productId);
          if (product?.options && product.options.length > 0) {
            return product.options.some(option => {
              const selected = item.selectedOptions?.[option.name] || '';
              if (!selected) return true;
              return !(option.values || []).some(value => value.label === selected);
            });
          }
          return false;
        }
      );

      if (hasInvalidItems) {
        toast.error('กรุณาตรวจสอบข้อมูลรายการสินค้าให้ถูกต้อง');
        return;
      }
      
      const submitData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          sku: (item.sku || '').trim() || undefined,
          productId: item.productId,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          discount: parseFloat(item.discount) || 0,
          totalPrice: calculateItemTotal(item),
          selectedOptions: (() => {
            if (!item.selectedOptions) return undefined;
            const entries = Object.entries(item.selectedOptions).filter(([, value]) => (value || '').trim() !== '');
            if (!entries.length) return undefined;
            return Object.fromEntries(entries.map(([key, value]) => [key, value.trim()]));
          })(),
        })),
        specialDiscount: Math.max(0, parseFloat(formData.specialDiscount || '0') || 0),
        vatRate: parseFloat(formData.vatRate) || 7,
        // Add calculated fields that the model expects
        subtotal,
        totalDiscount,
        totalAmount,
        vatAmount,
        grandTotal,
        // Add status field
        status: 'draft' as const,
      };

      if (submitData.shipToSameAsCustomer) {
        submitData.shippingAddress = submitData.customerAddress;
      }
      
      // Validate that all required numeric fields are valid numbers
      const hasInvalidNumbers = submitData.items.some(item => 
        isNaN(item.quantity) || isNaN(item.unitPrice) || isNaN(item.discount)
      );
      
      if (hasInvalidNumbers) {
        toast.error('กรุณาตรวจสอบข้อมูลตัวเลขให้ถูกต้อง');
        return;
      }
      
      console.log('Submitting quotation data:', submitData);
      const result = await onSubmit(submitData);
      
      if (result && result._id && !isEditing) {
        // หลังสร้างใบเสนอราคาใหม่ ให้แสดง PDF
        toast.success('สร้างใบเสนอราคาใหม่เรียบร้อยแล้ว กำลังเปิด PDF...');
        
        // รอสักครู่แล้วเปิด PDF
        setTimeout(() => {
          window.open(`/adminb2b/quotations/${result._id}/view`, '_blank');
        }, 1000);
      } else {
        toast.success(isEditing ? 'อัพเดทใบเสนอราคาเรียบร้อยแล้ว' : 'สร้างใบเสนอราคาใหม่เรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleInputChange = (field: keyof QuotationFormData, value: string) => {
    setFormData(prev => {
      const next = { ...prev } as QuotationFormData;
      next[field] = value as any;

      if (field === 'customerAddress' && prev.shipToSameAsCustomer) {
        next.shippingAddress = value;
      }

      if (field === 'shippingAddress' && value && prev.shipToSameAsCustomer) {
        next.shipToSameAsCustomer = false;
      }

      return next;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c._id === customerId) || null;
    setSelectedCustomer(customer);
    
    if (customer) {
      const companyAddress = customer.companyAddress || '';
      const useSame = customer.shippingSameAsCompany !== false;
      const shippingAddress = useSame
        ? companyAddress
        : (customer.shippingAddress || companyAddress);
      const primaryPhone = customer.phoneNumber || customer.companyPhone || '';
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerTaxId: customer.taxId || '',
        customerAddress: companyAddress,
        shipToSameAsCustomer: useSame,
        shippingAddress,
        customerPhone: primaryPhone,
      }));
      setCustomerQuery(customer.name || '');
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // คำนวณราคารวมของรายการนี้
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = newItems[index];
      const total = calculateItemTotal(item);
      newItems[index].totalPrice = String(round2(total));
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    const newItems = [...formData.items];
    if (product) {
      const hasUnits = Array.isArray(product.units) && product.units.length > 0;
      const firstUnit = hasUnits ? product.units[0] : undefined;
      const unitLabel = firstUnit?.label || (hasUnits ? '' : 'ชิ้น');
      const unitPrice = firstUnit
        ? String(firstUnit.price)
        : String(product.price || 0);
      const unitSku = firstUnit?.sku || product.sku || '';
      const optionList = Array.isArray(product.options) ? product.options : [];
      const previousSelections = newItems[index].selectedOptions || {};
      const normalizedSelections = optionList.reduce((acc, option) => {
        const validValues = (option.values || []).map(v => String(v.label));
        if (validValues.length === 0) return acc;
        const prev = previousSelections[option.name];
        acc[option.name] = prev && validValues.includes(prev) ? prev : '';
        return acc;
      }, {} as Record<string, string>);

      newItems[index] = {
        ...newItems[index],
        productId: product._id,
        productName: product.name,
        unit: unitLabel,
        sku: unitSku,
        unitPrice,
        selectedOptions: Object.keys(normalizedSelections).length > 0 ? normalizedSelections : undefined,
      } as any;

      const total = calculateItemTotal(newItems[index]);
      newItems[index].totalPrice = String(round2(total));
      setFormData(prev => ({ ...prev, items: newItems }));
    } else {
      newItems[index] = {
        ...newItems[index],
        productId: '',
        productName: '',
        unit: '',
        sku: '',
        unitPrice: '',
        totalPrice: '',
        selectedOptions: undefined,
      } as any;
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const handleUnitSelect = (index: number, unitLabel: string) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const targetItem: QuotationItem = { ...newItems[index], unit: unitLabel };
      const product = products.find(p => p._id === targetItem.productId);
      if (product && Array.isArray(product.units)) {
        const matchedUnit = product.units.find(u => u.label === unitLabel);
        if (matchedUnit) {
          targetItem.unitPrice = String(matchedUnit.price);
          targetItem.sku = matchedUnit.sku || product.sku || targetItem.sku || '';
        } else if (!unitLabel) {
          targetItem.unitPrice = '';
          targetItem.sku = product.sku || '';
        }
      } else if (!unitLabel) {
        targetItem.unitPrice = '';
        targetItem.sku = product?.sku || '';
      }

      const total = calculateItemTotal(targetItem);
      targetItem.totalPrice = String(round2(total));
      newItems[index] = targetItem;
      return { ...prev, items: newItems };
    });
  };

  const handleOptionSelect = (index: number, optionName: string, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const targetItem: QuotationItem = { ...newItems[index] };
      const currentSelections = { ...(targetItem.selectedOptions || {}) };
      currentSelections[optionName] = value;
      targetItem.selectedOptions = currentSelections;
      newItems[index] = targetItem;
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          productName: '',
          description: '',
          quantity: '',
          unit: '',
          sku: '',
          unitPrice: '',
          discount: '0',
          totalPrice: '',
          selectedOptions: {},
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const { subtotal, totalDiscount, totalAmount, vatAmount, grandTotal } = calculateTotals();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่'}
        </h2>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ✕ ยกเลิก
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ข้อมูลลูกค้า */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกลูกค้า *
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerQuery}
                onChange={(e) => { setCustomerQuery(e.target.value); setShowCustomerSuggestions(true); }}
                onFocus={() => setShowCustomerSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 150)}
                placeholder="พิมพ์เพื่อค้นหาลูกค้า..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customerId ? 'border-red-500' : 'border-gray-300'}`}
              />
              {showCustomerSuggestions && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded-md mt-1 w-full max-h-56 overflow-auto shadow-lg">
                  {customers
                    .filter(c => (c.name || '').toLowerCase().includes((customerQuery || '').toLowerCase()))
                    .slice(0, 20)
                    .map(c => (
                      <button
                        type="button"
                        key={c._id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleCustomerChange(c._id)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      >
                        {c.name}
                      </button>
                    ))}
                  {customers.filter(c => (c.name || '').toLowerCase().includes((customerQuery || '').toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-gray-500 text-sm">ไม่พบลูกค้า</div>
                  )}
                </div>
              )}
            </div>
            {errors.customerId && (
              <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อลูกค้า *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ชื่อลูกค้า"
            />
            {errors.customerName && (
              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลขประจำตัวผู้เสียภาษี
            </label>
            <input
              type="text"
              value={formData.customerTaxId}
              onChange={(e) => handleInputChange('customerTaxId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก"
              maxLength={13}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรศัพท์
            </label>
            <input
              type="text"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เบอร์โทรศัพท์"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ที่อยู่
            </label>
            <input
              type="text"
              value={formData.customerAddress}
              onChange={(e) => handleInputChange('customerAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ที่อยู่ลูกค้า"
            />
          </div>

          {/* ที่อยู่จัดส่ง */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <input
                id="shipSame"
                type="checkbox"
                checked={formData.shipToSameAsCustomer}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    shipToSameAsCustomer: checked,
                    shippingAddress: checked ? prev.customerAddress : prev.shippingAddress,
                  }));
                }}
              />
              <label htmlFor="shipSame" className="text-sm text-gray-700">ที่อยู่จัดส่งเหมือนที่อยู่ลูกค้า</label>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่จัดส่ง</label>
            <textarea
              value={formData.shipToSameAsCustomer ? (formData.customerAddress || '') : formData.shippingAddress}
              onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
              disabled={formData.shipToSameAsCustomer}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.shipToSameAsCustomer ? 'bg-gray-100 border-gray-200' : 'border-gray-300'}`}
              placeholder="ระบุที่อยู่จัดส่ง (ถ้าไม่เหมือนที่อยู่ลูกค้า)"
            />
          </div>
        </div>

        {/* ข้อมูลใบเสนอราคา */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หัวข้อใบเสนอราคา
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="หัวข้อใบเสนอราคา"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันหมดอายุ (ค่าเริ่มต้น +7 วัน)
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleInputChange('validUntil', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.validUntil ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.validUntil && (
              <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เงื่อนไขการชำระเงิน *
            </label>
            <input
              type="text"
              value={formData.paymentTerms}
              onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.paymentTerms ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="เงื่อนไขการชำระเงิน"
            />
            {errors.paymentTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentTerms}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เงื่อนไขการส่งมอบ
            </label>
            <input
              type="text"
              value={formData.deliveryTerms}
              onChange={(e) => handleInputChange('deliveryTerms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เงื่อนไขการส่งมอบ"
            />
          </div>
        </div>

        {/* รายการสินค้า */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">รายการสินค้า</h3>
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              + เพิ่มสินค้า
            </button>
          </div>

          {errors.items && (
            <p className="text-red-500 text-sm mb-4">{errors.items}</p>
          )}

          <div className="space-y-4">
            {formData.items.map((item, index) => {
              const product = products.find(p => p._id === item.productId);
              const unitList = product?.units || [];
              const hasMatchingUnit = unitList.some(unit => unit.label === item.unit);
              const optionList = (product?.options || []).filter(option => (option.values || []).length > 0);

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        เลือกสินค้า *
                      </label>
                      <select
                        value={item.productId || ''}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">เลือกสินค้า</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        รายละเอียด
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="รายละเอียด"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวน *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หน่วย
                      </label>
                      {unitList.length > 0 ? (
                        <select
                          value={item.unit}
                          onChange={(e) => handleUnitSelect(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกหน่วย</option>
                          {!hasMatchingUnit && item.unit && (
                            <option value={item.unit}>{item.unit} (ไม่พบในสินค้า)</option>
                          )}
                          {unitList.map(unit => (
                            <option key={unit.label} value={unit.label}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={item.unit}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none"
                          placeholder="หน่วยจากสินค้า"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={item.sku || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none"
                        placeholder="SKU จากสินค้า"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ราคาต่อหน่วย (รวม VAT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none"
                        placeholder="ราคาอัตโนมัติจากสินค้า"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ส่วนลด (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {optionList.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {optionList.map(option => {
                        const optionValues = option.values || [];
                        const selectedValue = item.selectedOptions?.[option.name] || '';
                        const hasOptionError = !selectedValue && (errors.items || '').includes('ตัวเลือกสินค้า');
                        return (
                          <div key={`${option.name}-${index}`}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {option.name}
                            </label>
                            <select
                              value={selectedValue}
                              onChange={(e) => handleOptionSelect(index, option.name, e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasOptionError ? 'border-red-500' : 'border-gray-300'}`}
                            >
                              <option value="">เลือก{option.name}</option>
                              {optionValues.map(value => (
                                <option
                                  key={value.label}
                                  value={value.label}
                                  disabled={value.isAvailable === false}
                                >
                                  {value.label}{value.isAvailable === false ? ' (ไม่พร้อมขาย)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      ราคารวม: <span className="font-medium">฿{parseFloat(item.totalPrice || '0').toFixed(2)}</span>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 transition-colors"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* สรุปราคา */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">สรุปราคา</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">ราคารวม:</span>
                <span className="font-medium">฿{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <label className="text-gray-600">ส่วนลดพิเศษ:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.specialDiscount}
                    onChange={(e) => handleInputChange('specialDiscount', e.target.value)}
                    className={`w-32 px-2 py-1 border rounded text-right ${errors.specialDiscount ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <span>฿</span>
                </div>
              </div>
              {errors.specialDiscount && (
                <p className="text-red-500 text-sm">{errors.specialDiscount}</p>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">ส่วนลดรวม:</span>
                <span className="font-medium">฿{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ราคาหลังหักส่วนลด:</span>
                <span className="font-medium">฿{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">อัตราภาษีมูลค่าเพิ่ม:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vatRate}
                    onChange={(e) => handleInputChange('vatRate', e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    min="0"
                    max="100"
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ภาษีมูลค่าเพิ่ม:</span>
                <span className="font-medium">฿{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>ราคารวมทั้งสิ้น:</span>
                <span>฿{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">ผู้รับผิดชอบ</p>
            <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded-md px-3 py-2">
              ระบบจะกำหนดผู้รับผิดชอบเป็นผู้สร้างใบเสนอราคาโดยอัตโนมัติ
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'กำลังบันทึก...' : (isEditing ? 'อัพเดท' : 'สร้างใบเสนอราคา')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default QuotationForm;
