'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

interface ProductWithId extends IProduct {
  _id: string;
}

interface OptionValue { 
  label: string; 
  imageUrl?: string;
}

interface ProductOption { 
  name: string; 
  values: OptionValue[];
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [units, setUnits] = useState<{ label: string; price: string }[]>([]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('ทั่วไป');
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<{optIdx: number, valIdx: number} | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      setLoading(false);
      toast.error('ไม่สามารถดึงข้อมูลสินค้าได้');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setName('');
    setPrice('');
    setUnits([]);
    setDescription('');
    setImageUrl('');
    setCategory('ทั่วไป');
    setOptions([]);
    setEditMode(false);
    setCurrentProductId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !description || !imageUrl) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (price.trim() === '' && units.length === 0) {
      toast.error('กรุณาระบุราคาเดี่ยว หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย');
      return;
    }

    if (units.some((u) => u.label.trim() === '' || u.price.trim() === '' || isNaN(Number(u.price)))) {
      toast.error('กรุณากรอกข้อมูลหน่วยสินค้าให้ครบถ้วน และราคาต้องเป็นตัวเลข');
      return;
    }

    const productData: any = {
      name,
      description,
      imageUrl,
      category,
    };

    if (price.trim() !== '') {
      productData.price = parseFloat(price);
    }

    if (units.length > 0) {
      productData.units = units.map((u) => ({ label: u.label, price: parseFloat(u.price) }));
    }

    // กรอง option ที่ไม่สมบูรณ์ (ชื่อว่าง หรือไม่มี value ที่ label ไม่ว่าง)
    const cleanedOptions = options
      .filter((option) => option.name.trim() && option.values.some((v) => v.label.trim()))
      .map((option) => ({
        name: option.name.trim(),
        values: option.values
          .filter((v) => v.label.trim())
          .map((v) => ({ label: v.label.trim(), imageUrl: v.imageUrl })),
      }));

    if (options.length > 0 && cleanedOptions.length === 0) {
      toast.error('กรุณากรอกข้อมูลตัวเลือกสินค้าให้ครบถ้วน');
      return;
    }

    if (cleanedOptions.length > 0) {
      productData.options = cleanedOptions;
    }

    try {
      setIsUploading(true);

      const url = editMode && currentProductId 
        ? `/api/products/${currentProductId}` 
        : '/api/products';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        resetForm();
        fetchProducts();
        toast.success(editMode ? 'อัพเดทสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
      } else {
        let msg = 'เกิดข้อผิดพลาดในการ' + (editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า');
        try {
          const data = await response.json();
          if (data?.error) msg = data.error;
        } catch {}
        toast.error(msg);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProduct = (product: ProductWithId) => {
    setName(product.name);
    setPrice(product.price !== undefined ? product.price.toString() : '');
    setDescription(product.description);
    setImageUrl(product.imageUrl);
    setCategory(product.category || 'ทั่วไป');
    setEditMode(true);
    setCurrentProductId(product._id);
    setShowForm(true);

    if (product.options && product.options.length > 0) {
      setOptions(product.options.map((option) => ({
        name: option.name,
        values: option.values.map((value) => ({
          label: value.label,
          imageUrl: value.imageUrl,
        })),
      })));
    } else {
      setOptions([]);
    }

    if (product.units && product.units.length > 0) {
      setUnits(product.units.map((u) => ({ label: u.label, price: u.price.toString() })));
    } else {
      setUnits([]);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const result = await new Promise<boolean>((resolve) => {
        toast(
          (t) => (
            <div className="flex flex-col">
              <span className="mb-2">คุณต้องการลบสินค้านี้ใช่หรือไม่?</span>
              <div className="flex space-x-2">
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                >
                  ลบ
                </button>
                <button
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(false);
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ),
          { duration: Infinity }
        );
      });

      if (!result) return;

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
        toast.success('ลบสินค้าสำเร็จ');
      } else {
        toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบสินค้า:', error);
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
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

  const addOption = () => {
    setOptions((prev) => [...prev, { name: '', values: [] }]);
  };

  const removeOption = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateOptionName = (idx: number, name: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? { ...opt, name } : opt)));
  };

  const addOptionValue = (optIdx: number) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx ? { ...opt, values: [...opt.values, { label: '', imageUrl: '' }] } : opt
      )
    );
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx
          ? { ...opt, values: opt.values.filter((_, vi) => vi !== valIdx) }
          : opt
      )
    );
  };

  const updateOptionValueLabel = (optIdx: number, valIdx: number, label: string) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx
          ? {
              ...opt,
              values: opt.values.map((val, vi) => (vi === valIdx ? { ...val, label } : val)),
            }
          : opt
      )
    );
  };

  const updateOptionValueImage = async (optIdx: number, valIdx: number, file: File) => {
    try {
      setUploadingOptionImage({optIdx, valIdx});
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      if (data.secure_url) {
        setOptions((prev) =>
          prev.map((opt, i) =>
            i === optIdx
              ? {
                  ...opt,
                  values: opt.values.map((v, vi) =>
                    vi === valIdx ? { ...v, imageUrl: data.secure_url as string } : v
                  ),
                }
              : opt
          )
        );
        toast.success('อัพโหลดรูปภาพตัวเลือกสำเร็จ');
      }
    } catch (err) {
      console.error('upload option image error', err);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setUploadingOptionImage(null);
    }
  };

  const addUnit = () => {
    setUnits((prev) => [...prev, { label: '', price: '' }]);
  };

  const removeUnit = (idx: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveUnit = (idx: number, direction: -1 | 1) => {
    setUnits((prev) => {
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[newIdx];
      copy[newIdx] = temp;
      return copy;
    });
  };

  const updateUnitLabel = (idx: number, label: string) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, label } : u)));
  };

  const updateUnitPrice = (idx: number, priceValue: string) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, price: priceValue } : u)));
  };

  const moveOptionValue = (optIdx: number, valIdx: number, direction: -1 | 1) => {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== optIdx) return opt;
        const newIdx = valIdx + direction;
        if (newIdx < 0 || newIdx >= opt.values.length) return opt;
        const newValues = [...opt.values];
        const temp = newValues[valIdx];
        newValues[valIdx] = newValues[newIdx];
        newValues[newIdx] = temp;
        return { ...opt, values: newValues };
      })
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการสินค้า</h1>
            <p className="text-gray-600">เพิ่ม แก้ไข และจัดการสินค้าในร้านของคุณ</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>เพิ่มสินค้าใหม่</span>
          </motion.button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-square">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.options && product.options.length > 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    มีตัวเลือก
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-blue-600 font-bold text-lg mb-3">
                  ฿{
                    product.price !== undefined
                      ? product.price.toLocaleString()
                      : product.units && product.units.length > 0
                        ? product.units[0].price.toLocaleString()
                        : '-'
                  }
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                
                {/* Options preview */}
                {product.options && product.options.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">ตัวเลือก:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.options.map((option, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {option.name} ({option.values.length})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีสินค้า</h3>
            <p className="text-gray-600 mb-6">เริ่มต้นด้วยการเพิ่มสินค้าแรกของคุณ</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              เพิ่มสินค้าใหม่
            </button>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า</label>
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

                      {/* Units Section */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-gray-700">หน่วยสินค้า</span>
                          <button
                            type="button"
                            onClick={addUnit}
                            className="bg-indigo-600 text-white text-xs px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                          >
                            + เพิ่มหน่วย
                          </button>
                        </div>

                        {units.length === 0 && (
                          <p className="text-xs text-gray-500">ยังไม่มีหน่วย เพิ่มใหม่ได้ตามต้องการ</p>
                        )}

                        <div className="space-y-3">
                          {units.map((u, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={u.label}
                                onChange={(e) => updateUnitLabel(idx, e.target.value)}
                                placeholder="เช่น หลอด, ลัง"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={u.price}
                                onChange={(e) => updateUnitPrice(idx, e.target.value)}
                                placeholder="ราคา"
                                className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <div className="flex items-center space-x-1">
                                <button type="button" onClick={() => moveUnit(idx, -1)} className="text-gray-500 hover:text-gray-700 p-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button type="button" onClick={() => moveUnit(idx, 1)} className="text-gray-500 hover:text-gray-700 p-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeUnit(idx)}
                                  className="text-red-600 hover:text-red-800 p-1"
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="เช่น ฟีล์ม, กาว"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียดสินค้า</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        {imageUrl ? (
                          <div className="relative w-full h-48 mb-4">
                            <Image
                              src={imageUrl}
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
                    </div>

                    <div className="space-y-6">
                      {options.map((option, optIdx) => (
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
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'กำลังบันทึก...' : (editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า')}
                    </button>
                    
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsPage; 