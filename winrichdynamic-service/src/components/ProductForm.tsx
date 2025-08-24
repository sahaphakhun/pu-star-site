'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ProductInput, UnitInput, OptionInput, OptionValueInput, SkuConfigInput, SkuVariantInput } from '@/schemas/product';

interface ProductFormProps {
  initialData?: Partial<ProductInput>;
  onSubmit: (data: ProductInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
  categories: Array<{ _id: string; name: string }>;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
  categories
}) => {
  const [formData, setFormData] = useState<ProductInput>({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    units: initialData?.units || [],
    category: initialData?.category || 'ทั่วไป',
    options: initialData?.options || [],
    isAvailable: initialData?.isAvailable ?? true,
    skuConfig: initialData?.skuConfig || {
      prefix: '',
      separator: '-',
      autoGenerate: true,
      customSku: ''
    },
    skuVariants: initialData?.skuVariants || []
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<{optIdx: number, valIdx: number} | null>(null);
  const [showSkuConfig, setShowSkuConfig] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || 0,
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || '',
        units: initialData.units || [],
        category: initialData.category || 'ทั่วไป',
        options: initialData.options || [],
        isAvailable: initialData.isAvailable ?? true,
        skuConfig: initialData.skuConfig || {
          prefix: '',
          separator: '-',
          autoGenerate: true,
          customSku: ''
        },
        skuVariants: initialData.skuVariants || []
      });
      setShowSkuConfig(Boolean(initialData.skuConfig));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate SKU variants
    if (showSkuConfig && formData.skuVariants && formData.skuVariants.length > 0) {
      const invalidSkus = formData.skuVariants.filter(v => !v.sku.trim());
      if (invalidSkus.length > 0) {
        toast.error('กรุณาระบุ SKU ให้ครบทุก variant');
        return;
      }
    }

    await onSubmit(formData);
  };

  // Unit management
  const addUnit = () => {
    setFormData(prev => ({
      ...prev,
      units: [...(prev.units || []), { label: '', price: 0, shippingFee: 0 }
    ]));
  };

  const updateUnit = (index: number, field: keyof UnitInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units?.map((unit, i) => 
        i === index ? { ...unit, [field]: value } : unit
      ) || []
    }));
  };

  const removeUnit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units?.filter((_, i) => i !== index) || []
    }));
  };

  // Option management
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), { name: '', values: [{ label: '' }] }]
    }));
  };

  const updateOptionName = (optIdx: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => 
        i === optIdx ? { ...option, name } : option
      ) || []
    }));
  };

  const removeOption = (optIdx: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== optIdx) || []
    }));
  };

  const addOptionValue = (optIdx: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => 
        i === optIdx ? { ...option, values: [...option.values, { label: '' }] } : option
      ) || []
    }));
  };

  const updateOptionValueLabel = (optIdx: number, valIdx: number, label: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => 
        i === optIdx ? {
          ...option,
          values: option.values.map((value, j) => 
            j === valIdx ? { ...value, label } : value
          )
        } : option
      ) || []
    }));
  };

  const updateOptionValueAvailability = (optIdx: number, valIdx: number, isAvailable: boolean) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => 
        i === optIdx ? {
          ...option,
          values: option.values.map((value, j) => 
            j === valIdx ? { ...value, isAvailable } : value
          )
        } : option
      ) || []
    }));
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => 
        i === optIdx ? {
          ...option,
          values: option.values.filter((_, j) => j !== valIdx)
        } : option
      ) || []
    }));
  };

  const moveOptionValue = (optIdx: number, valIdx: number, direction: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => {
        if (i !== optIdx) return option;
        
        const newValues = [...option.values];
        const newIndex = valIdx + direction;
        
        if (newIndex >= 0 && newIndex < newValues.length) {
          [newValues[valIdx], newValues[newIndex]] = [newValues[newIndex], newValues[valIdx]];
        }
        
        return { ...option, values: newValues };
      }) || []
    }));
  };

  // Image upload for option values
  const updateOptionValueImage = async (optIdx: number, valIdx: number, file: File) => {
    setUploadingOptionImage({ optIdx, valIdx });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      if (data.secure_url) {
        setFormData(prev => ({
          ...prev,
          options: prev.options?.map((option, i) => 
            i === optIdx ? {
              ...option,
              values: option.values.map((value, j) => 
                j === valIdx ? { ...value, imageUrl: data.secure_url } : value
              )
            } : option
          ) || []
        }));
        toast.success('อัพโหลดรูปภาพสำเร็จ');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setUploadingOptionImage(null);
    }
  };

  // SKU management
  const buildVariantKey = (unitLabel?: string, selectedOptions?: Record<string, string>) => {
    const unitPart = unitLabel ? `unit:${unitLabel}` : 'unit:default';
    const optionsPart = selectedOptions && Object.keys(selectedOptions).length > 0
      ? 'opts:' + Object.keys(selectedOptions).sort().map(k => `${k}:${selectedOptions[k]}`).join('|')
      : 'opts:none';
    return `${unitPart}__${optionsPart}`;
  };

  const getOptionCombos = (opts: OptionInput[]): Record<string, string>[] => {
    if (!opts || opts.length === 0) return [{}];
    return opts.reduce<Record<string, string>[]>((acc, option) => {
      const validValues = (option.values || []).filter(v => v.label && v.label.trim());
      if (validValues.length === 0) return acc;
      const next: Record<string, string>[] = [];
      for (const combo of acc) {
        for (const val of validValues) {
          next.push({ ...combo, [option.name]: val.label });
        }
      }
      return next;
    }, [{}]);
  };

  const generateSkuVariants = () => {
    const unitLabels = (formData.units && formData.units.length > 0) ? formData.units.map(u => u.label) : [undefined];
    const optionCombos = getOptionCombos(formData.options || []);

    const existingByKey = new Map<string, SkuVariantInput>();
    for (const variant of formData.skuVariants || []) existingByKey.set(variant.key, variant);

    const variants: SkuVariantInput[] = [];
    for (const unitLabel of unitLabels) {
      for (const combo of optionCombos) {
        const key = buildVariantKey(unitLabel, combo);
        const prev = existingByKey.get(key);
        
        let sku = '';
        if (formData.skuConfig?.autoGenerate) {
          const parts = [formData.skuConfig.prefix];
          if (unitLabel) parts.push(unitLabel);
          Object.entries(combo).forEach(([optName, optValue]) => {
            parts.push(optValue);
          });
          sku = parts.filter(p => p).join(formData.skuConfig.separator || '-');
        } else {
          sku = formData.skuConfig?.customSku || '';
        }

        variants.push({
          key,
          unitLabel,
          options: combo,
          sku: prev?.sku || sku,
          isActive: prev?.isActive ?? true,
        });
      }
    }
    
    setFormData(prev => ({ ...prev, skuVariants: variants }));
  };

  const updateSkuVariant = (index: number, updates: Partial<SkuVariantInput>) => {
    setFormData(prev => ({
      ...prev,
      skuVariants: prev.skuVariants?.map((variant, i) => 
        i === index ? { ...variant, ...updates } : variant
      ) || []
    }));
  };

  // Main image upload
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    try {
      setIsUploading(true);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
        toast.success('อัพโหลดรูปภาพสำเร็จ');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">
        {isEditing ? 'แก้ไขสินค้า' : 'สร้างสินค้าใหม่'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ชื่อสินค้า"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ทั่วไป">ทั่วไป</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ราคาพื้นฐาน *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะสินค้า</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.isAvailable}
                  onChange={() => setFormData({...formData, isAvailable: true})}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">มีสินค้า</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!formData.isAvailable}
                  onChange={() => setFormData({...formData, isAvailable: false})}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">สินค้าหมด</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              เมื่อเลือก "สินค้าหมด" ลูกค้าจะเห็นสินค้าแต่ไม่สามารถสั่งซื้อได้
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียดสินค้า *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="รายละเอียดสินค้าโดยย่อ"
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {formData.imageUrl ? (
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={formData.imageUrl}
                  alt="ตัวอย่างรูปภาพ"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 mb-2">คลิกเพื่ือเลือกรูปภาพ</p>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {isUploading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600">กำลังอัพโหลด...</span>
              </div>
            )}
          </div>
        </div>

        {/* Units Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">หน่วยสินค้า (ถ้ามีหลายหน่วย)</h3>
            <button
              type="button"
              onClick={addUnit}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มหน่วย</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.units?.map((unit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหน่วย</label>
                    <input
                      type="text"
                      value={unit.label}
                      onChange={(e) => updateUnit(idx, 'label', e.target.value)}
                      placeholder="เช่น ชิ้น, กล่อง, เมตร"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคา</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unit.price}
                      onChange={(e) => updateUnit(idx, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ค่าส่ง</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unit.shippingFee || 0}
                      onChange={(e) => updateUnit(idx, 'shippingFee', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeUnit(idx)}
                  className="mt-3 text-red-600 hover:text-red-800 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบหน่วย
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Options Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ตัวเลือกสินค้า (ถ้ามี)</h3>
            <button
              type="button"
              onClick={addOption}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มตัวเลือก</span>
            </button>
          </button>
        </div>

        <div className="space-y-6">
          {formData.options?.map((option, optIdx) => (
            <motion.div
              key={optIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => updateOptionName(optIdx, e.target.value)}
                  placeholder="ชื่อตัวเลือก เช่น สี, ขนาด"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeOption(optIdx)}
                  className="ml-4 text-red-600 hover:text-red-800 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {option.values.map((value, valIdx) => (
                  <div key={valIdx} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                    <input
                      type="text"
                      value={value.label}
                      onChange={(e) => updateOptionValueLabel(optIdx, valIdx, e.target.value)}
                      placeholder="ค่าตัวเลือก เช่น แดง, L"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />

                    {value.imageUrl && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={value.imageUrl}
                          alt={value.label}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateOptionValueImage(optIdx, valIdx, file);
                          }}
                          className="hidden"
                        />
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                          {uploadingOptionImage?.optIdx === optIdx && uploadingOptionImage?.valIdx === valIdx ? 
                            'กำลังอัพโหลด...' : 'เลือกรูป'
                          }
                        </span>
                      </label>

                      <button type="button" onClick={() => moveOptionValue(optIdx, valIdx, -1)} className="text-gray-500 hover:text-gray-700 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => moveOptionValue(optIdx, valIdx, 1)} className="text-gray-500 hover:text-gray-700 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOptionValue(optIdx, valIdx)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOptionValue(optIdx)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                >
                  + เพิ่มค่าตัวเลือก
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SKU Configuration Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">การตั้งค่า SKU</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showSkuConfig}
                onChange={(e) => setShowSkuConfig(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">เปิดใช้งานระบบ SKU</span>
            </label>
          </div>

          {showSkuConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={formData.skuConfig?.prefix || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      skuConfig: { ...prev.skuConfig!, prefix: e.target.value }
                    }))}
                    placeholder="เช่น PRD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตัวคั่น</label>
                  <input
                    type="text"
                    value={formData.skuConfig?.separator || '-'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      skuConfig: { ...prev.skuConfig!, separator: e.target.value }
                    }))}
                    placeholder="-"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={formData.skuConfig?.autoGenerate}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      skuConfig: { ...prev.skuConfig!, autoGenerate: true }
                    }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">สร้าง SKU อัตโนมัติ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!formData.skuConfig?.autoGenerate}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      skuConfig: { ...prev.skuConfig!, autoGenerate: false }
                    }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">กำหนด SKU เอง</span>
                </label>
              </div>

              {!formData.skuConfig?.autoGenerate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU ที่กำหนดเอง</label>
                  <input
                    type="text"
                    value={formData.skuConfig?.customSku || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      skuConfig: { ...prev.skuConfig!, customSku: e.target.value }
                    }))}
                    placeholder="SKU ที่กำหนดเอง"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={generateSkuVariants}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                สร้าง SKU Variants
              </button>

              {formData.skuVariants && formData.skuVariants.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">SKU Variants</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">หน่วย</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ตัวเลือก</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.skuVariants.map((variant, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {variant.unitLabel || '-'}
                            </td>
                            <td className="px-3 py-2">
                              {variant.options && Object.keys(variant.options).length > 0
                                ? Object.entries(variant.options).map(([k, v]) => (
                                    <span key={k} className="inline-block mr-2 bg-gray-100 rounded px-2 py-0.5">
                                      {k}: {v}
                                    </span>
                                  ))
                                : '-'}
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                value={variant.sku} 
                                onChange={(e) => updateSkuVariant(idx, { sku: e.target.value })} 
                                className="w-40 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500" 
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input 
                                type="checkbox" 
                                checked={variant.isActive} 
                                onChange={(e) => updateSkuVariant(idx, { isActive: e.target.checked })} 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังบันทึก...' : (isEditing ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า')}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
