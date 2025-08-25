'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CreateProduct, ProductOption, ProductUnit } from '@/schemas/product';

interface ProductFormProps {
  initialData?: Partial<CreateProduct>;
  onSubmit: (data: CreateProduct) => void;
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
  // Basic Info States
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [sku, setSku] = useState(initialData?.sku || ''); // เพิ่ม state สำหรับ sku
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [rootShippingFee, setRootShippingFee] = useState(initialData?.shippingFee?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable !== false);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  // Units States
  const [units, setUnits] = useState<Array<{ label: string; price: string; shippingFee: string }>>(
    (initialData?.units || []).map(u => ({
      label: u.label,
      price: u.price.toString(),
      shippingFee: (u.shippingFee || 0).toString()
    }))
  );

  // Options States
  const [options, setOptions] = useState<ProductOption[]>(initialData?.options || []);

  // SKU States
  const [showSkuConfig, setShowSkuConfig] = useState(false);
  const [skuConfig, setSkuConfig] = useState({
      prefix: '',
      separator: '-',
      autoGenerate: true,
      customSku: ''
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSku(initialData.sku || ''); // เพิ่มการตั้งค่า sku
      setPrice(initialData.price?.toString() || '');
      setRootShippingFee(initialData.shippingFee?.toString() || '');
      setCategory(initialData.category || '');
      setIsAvailable(initialData.isAvailable !== false);
      setImageUrl(initialData.imageUrl || '');
      setUnits((initialData.units || []).map(u => ({
        label: u.label,
        price: u.price.toString(),
        shippingFee: (u.shippingFee || 0).toString()
      })));
      setOptions(initialData.options || []);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !description || !imageUrl) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

    if (price.trim() === '' && units.length === 0) {
      toast.error('กรุณาระบุราคาเดี่ยว หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย');
      return;
    }

    if (price.trim() !== '' && rootShippingFee.trim() !== '' && isNaN(Number(rootShippingFee))) {
      toast.error('ค่าส่งต้องเป็นตัวเลข');
      return;
    }

    if (units.some((u) => u.label.trim() === '' || u.price.trim() === '' || isNaN(Number(u.price)) || (u.shippingFee.trim() !== '' && isNaN(Number(u.shippingFee))))) {
      toast.error('กรุณากรอกข้อมูลหน่วยสินค้าให้ครบถ้วน และราคาต้องเป็นตัวเลข');
      return;
    }

    // Build product data
    const productData: CreateProduct = {
      name: name.trim(),
      description: description.trim(),
      sku: sku.trim() || undefined, // เพิ่ม field sku
      imageUrl: imageUrl.trim(),
      category: category.trim(),
      isAvailable,
    };

    if (price.trim() !== '') {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue < 0) {
        toast.error('ราคาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
        return;
      }
      productData.price = priceValue;
    }

    if (rootShippingFee.trim() !== '') {
      const shippingFeeValue = parseFloat(rootShippingFee);
      if (isNaN(shippingFeeValue) || shippingFeeValue < 0) {
        toast.error('ค่าส่งต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
        return;
      }
      productData.shippingFee = shippingFeeValue;
    }

    if (units.length > 0) {
      productData.units = units.map((u) => {
        const unit: any = { 
          label: u.label.trim(), 
          price: parseFloat(u.price) 
        };
        if (u.shippingFee.trim() !== '') {
          unit.shippingFee = parseFloat(u.shippingFee);
        }
        return unit;
      });
    }

    // Clean and add options
    const cleanedOptions = options
      .filter((option) => option.name.trim() && option.values.some((v) => v.label.trim()))
      .map((option) => ({
        name: option.name.trim(),
        values: option.values
          .filter((v) => v.label.trim())
          .map((v) => {
            const val: any = { label: v.label.trim() };
            if (v.imageUrl && v.imageUrl.trim()) {
              val.imageUrl = v.imageUrl.trim();
            }
            if (v.isAvailable !== undefined) {
              val.isAvailable = v.isAvailable;
            }
            return val;
          }),
      }));

    if (cleanedOptions.length > 0) {
      productData.options = cleanedOptions;
    }

    // Add SKU config if enabled
    if (showSkuConfig) {
      if (skuConfig.autoGenerate) {
        if (!skuConfig.prefix.trim()) {
          toast.error('กรุณาระบุตัวอักษรนำหน้า SKU');
          return;
        }
      } else {
        if (!skuConfig.customSku?.trim()) {
          toast.error('กรุณาระบุ SKU เอง');
          return;
        }
      }
      
      productData.skuConfig = {
        prefix: skuConfig.prefix.trim(),
        separator: skuConfig.separator.trim(),
        autoGenerate: skuConfig.autoGenerate,
        customSku: skuConfig.customSku?.trim() || undefined
      };
    }

    // Debug: Log the product data being submitted
    console.log('[B2B] ProductForm - Submitting product data:', productData);

    // Final validation - ensure required fields are present
    if (!productData.name || !productData.description || !productData.imageUrl || !productData.category) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    onSubmit(productData);
  };

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
        setImageUrl(data.secure_url);
        toast.success('อัพโหลดรูปภาพสำเร็จ');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
      </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า *</label>
            <input
              type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น เสื้อยืดลายแมว"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SKU (รหัสสินค้า)</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="เช่น PRD-001 หรือปล่อยว่างเพื่อ auto-generate"
            />
            <p className="text-xs text-gray-500 mt-1">ปล่อยว่างเพื่อให้ระบบสร้าง SKU อัตโนมัติ</p>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ราคาเริ่มต้น (บาท) *(ไม่ใส่ได้ถ้ามีหน่วย)*</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น 199"
              />
            </div>

            {price.trim() !== '' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ค่าส่ง (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rootShippingFee}
                  onChange={(e) => setRootShippingFee(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น 50 (0 = ส่งฟรี)"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่ *</label>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะสินค้า</label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                <input
                  type="radio"
                    name="availability"
                    checked={isAvailable}
                    onChange={() => setIsAvailable(true)}
                    className="mr-2"
                  />
                  <span className="text-green-600">พร้อมขาย</span>
              </label>
                <label className="flex items-center">
                <input
                  type="radio"
                    name="availability"
                    checked={!isAvailable}
                    onChange={() => setIsAvailable(false)}
                    className="mr-2"
                  />
                  <span className="text-red-600">สินค้าหมด</span>
              </label>
              </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียดสินค้า *</label>
          <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="รายละเอียดสินค้าโดยย่อ"
            required
          />
            </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {imageUrl ? (
              <div className="relative w-full h-48 mb-4">
                  <img
                    src={imageUrl}
                  alt="ตัวอย่างรูปภาพ"
                    className="w-full h-full object-contain rounded-lg"
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
        </div>

        {/* Units Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">หน่วยสินค้า</h3>
            <button
              type="button"
              onClick={() => setUnits([...units, { label: '', price: '', shippingFee: '' }])}
              className="bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + เพิ่มหน่วย
            </button>
          </div>

          {units.length === 0 && (
            <p className="text-sm text-gray-500 italic">ยังไม่มีหน่วย เพิ่มใหม่ได้ตามต้องการ</p>
          )}

          <div className="space-y-3">
            {units.map((unit, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                    <input
                      type="text"
                    placeholder="หน่วย เช่น หลอด"
                      value={unit.label}
                    onChange={(e) => {
                      const newUnits = [...units];
                      newUnits[idx].label = e.target.value;
                      setUnits(newUnits);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                    placeholder="ราคา"
                      value={unit.price}
                    onChange={(e) => {
                      const newUnits = [...units];
                      newUnits[idx].price = e.target.value;
                      setUnits(newUnits);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                    placeholder="ค่าส่ง"
                    value={unit.shippingFee}
                    onChange={(e) => {
                      const newUnits = [...units];
                      newUnits[idx].shippingFee = e.target.value;
                      setUnits(newUnits);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx > 0) {
                        const newUnits = [...units];
                        [newUnits[idx], newUnits[idx - 1]] = [newUnits[idx - 1], newUnits[idx]];
                        setUnits(newUnits);
                      }
                    }}
                    disabled={idx === 0}
                    className="text-gray-500 hover:text-gray-700 text-xs p-1 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx < units.length - 1) {
                        const newUnits = [...units];
                        [newUnits[idx], newUnits[idx + 1]] = [newUnits[idx + 1], newUnits[idx]];
                        setUnits(newUnits);
                      }
                    }}
                    disabled={idx === units.length - 1}
                    className="text-gray-500 hover:text-gray-700 text-xs p-1 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                <button
                  type="button"
                    onClick={() => setUnits(units.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 text-xs p-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Options Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ตัวเลือกสินค้า (ถ้ามี)</h3>
            <button
              type="button"
              onClick={() => setOptions([...options, { name: '', values: [] }])}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มตัวเลือก</span>
            </button>
        </div>

        <div className="space-y-6">
            {options.map((option, optIdx) => (
              <div
              key={optIdx}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  value={option.name}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[optIdx].name = e.target.value;
                      setOptions(newOptions);
                    }}
                  placeholder="ชื่อตัวเลือก เช่น สี, ขนาด"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                    onClick={() => setOptions(options.filter((_, i) => i !== optIdx))}
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
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[optIdx].values[valIdx].label = e.target.value;
                          setOptions(newOptions);
                        }}
                      placeholder="ค่าตัวเลือก เช่น แดง, L"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />

                    {value.imageUrl && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                          <img
                          src={value.imageUrl}
                          alt={value.label}
                            className="w-full h-full object-cover rounded"
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
                              if (file) {
                                // Handle image upload for option value
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const newOptions = [...options];
                                  newOptions[optIdx].values[valIdx].imageUrl = e.target?.result as string;
                                  setOptions(newOptions);
                                };
                                reader.readAsDataURL(file);
                              }
                          }}
                          className="hidden"
                        />
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                            เลือกรูป
                          </span>
                        </label>

                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={value.isAvailable !== false}
                            onChange={(e) => {
                              const newOptions = [...options];
                              newOptions[optIdx].values[valIdx].isAvailable = e.target.checked;
                              setOptions(newOptions);
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className={`text-xs font-medium ${
                            value.isAvailable !== false ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {value.isAvailable !== false ? 'มีสินค้า' : 'หมด'}
                        </span>
                      </label>

                        <button
                          type="button"
                          onClick={() => {
                            if (valIdx > 0) {
                              const newOptions = [...options];
                              [newOptions[optIdx].values[valIdx], newOptions[optIdx].values[valIdx - 1]] = 
                                [newOptions[optIdx].values[valIdx - 1], newOptions[optIdx].values[valIdx]];
                              setOptions(newOptions);
                            }
                          }}
                          disabled={valIdx === 0}
                          className="text-gray-500 hover:text-gray-700 p-1 disabled:opacity-50"
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (valIdx < option.values.length - 1) {
                              const newOptions = [...options];
                              [newOptions[optIdx].values[valIdx], newOptions[optIdx].values[valIdx + 1]] = 
                                [newOptions[optIdx].values[valIdx + 1], newOptions[optIdx].values[valIdx]];
                              setOptions(newOptions);
                            }
                          }}
                          disabled={valIdx === option.values.length - 1}
                          className="text-gray-500 hover:text-gray-700 p-1 disabled:opacity-50"
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                          onClick={() => {
                            const newOptions = [...options];
                            newOptions[optIdx].values = newOptions[optIdx].values.filter((_, vi) => vi !== valIdx);
                            setOptions(newOptions);
                          }}
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
                    onClick={() => {
                      const newOptions = [...options];
                      newOptions[optIdx].values.push({ label: '', imageUrl: '', isAvailable: true });
                      setOptions(newOptions);
                    }}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                >
                  + เพิ่มค่าตัวเลือก
                </button>
              </div>
              </div>
          ))}
          </div>
        </div>

        {/* SKU Configuration Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">การตั้งค่า SKU</h3>
            <button
              type="button"
              onClick={() => setShowSkuConfig(!showSkuConfig)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                showSkuConfig 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showSkuConfig ? 'ปิดการตั้งค่า' : 'เปิดการตั้งค่า'}
            </button>
          </div>

          {showSkuConfig && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ตัวอักษรนำหน้า SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={skuConfig.prefix}
                    onChange={(e) => setSkuConfig(prev => ({ ...prev, prefix: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น PROD, ITEM"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ตัวอักษรที่ใช้เป็นจุดเริ่มต้นของ SKU
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ตัวคั่น
                  </label>
                  <input
                    type="text"
                    value={skuConfig.separator}
                    onChange={(e) => setSkuConfig(prev => ({ ...prev, separator: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น -, _, /"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ตัวอักษรที่ใช้คั่นระหว่างส่วนประกอบของ SKU
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วิธีการสร้าง SKU
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                  <input
                    type="radio"
                      name="skuGeneration"
                      checked={skuConfig.autoGenerate}
                      onChange={() => setSkuConfig(prev => ({ ...prev, autoGenerate: true }))}
                      className="mr-2"
                    />
                    <span>สร้างอัตโนมัติจากตัวเลือกและหน่วย</span>
                </label>
                  <label className="flex items-center">
                  <input
                    type="radio"
                      name="skuGeneration"
                      checked={!skuConfig.autoGenerate}
                      onChange={() => setSkuConfig(prev => ({ ...prev, autoGenerate: false }))}
                      className="mr-2"
                    />
                    <span>ระบุ SKU เอง</span>
                </label>
                </div>
              </div>

              {!skuConfig.autoGenerate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU ที่กำหนดเอง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={skuConfig.customSku}
                    onChange={(e) => setSkuConfig(prev => ({ ...prev, customSku: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น PROD-001"
                  />
                </div>
              )}

              {skuConfig.autoGenerate && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>หมายเหตุ:</strong> SKU จะถูกสร้างอัตโนมัติในรูปแบบ: {skuConfig.prefix}{skuConfig.separator}[หน่วย]{skuConfig.separator}[ตัวเลือก]
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    ตัวอย่าง: {skuConfig.prefix}{skuConfig.separator}หลอด{skuConfig.separator}แดง{skuConfig.separator}L
                  </p>
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
