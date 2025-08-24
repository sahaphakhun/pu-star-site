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
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [rootShippingFee, setRootShippingFee] = useState(initialData?.shippingFee?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || 'ทั่วไป');
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
      setPrice(initialData.price?.toString() || '');
      setRootShippingFee(initialData.shippingFee?.toString() || '');
      setCategory(initialData.category || 'ทั่วไป');
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
      name,
      description,
      imageUrl,
      category,
      isAvailable,
    };

    if (price.trim() !== '') {
      productData.price = parseFloat(price);
    }

    if (rootShippingFee.trim() !== '') {
      productData.shippingFee = parseFloat(rootShippingFee);
    }

    if (units.length > 0) {
      productData.units = units.map((u) => {
        const unit: any = { label: u.label, price: parseFloat(u.price) };
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
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
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
