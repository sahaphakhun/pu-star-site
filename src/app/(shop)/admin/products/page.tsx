'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

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
  const [filteredProducts, setFilteredProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on search and price
  useEffect(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (priceFilter.min) {
      filtered = filtered.filter(product => product.price >= parseFloat(priceFilter.min));
    }
    if (priceFilter.max) {
      filtered = filtered.filter(product => product.price <= parseFloat(priceFilter.max));
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, priceFilter]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    setOptions([]);
    setEditMode(false);
    setCurrentProductId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !price || !description || !imageUrl) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const productData: any = {
      name,
      price: parseFloat(price),
      description,
      imageUrl,
    };

    if (options.length > 0) {
      productData.options = options.map((option) => ({
        name: option.name,
        values: option.values.map((value) => ({
          label: value.label,
          imageUrl: value.imageUrl,
        })),
      }));
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
        alert(editMode ? 'อัพเดทสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการ' + (editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า'));
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      alert('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProduct = (product: ProductWithId) => {
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description);
    setImageUrl(product.imageUrl);
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
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
        alert('ลบสินค้าสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการลบสินค้า');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบสินค้า:', error);
      alert('เกิดข้อผิดพลาดในการลบสินค้า');
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
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-xl text-gray-600">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการสินค้า</h1>
            <p className="text-gray-600">จัดการสินค้าในร้านของคุณ</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="mt-4 lg:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            เพิ่มสินค้าใหม่
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">สินค้าทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <EyeIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ราคาเฉลี่ย</p>
                <p className="text-3xl font-bold text-gray-900">
                  ฿{products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <PhotoIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ผลการค้นหา</p>
                <p className="text-3xl font-bold text-gray-900">{filteredProducts.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FunnelIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="ราคาต่ำสุด"
                value={priceFilter.min}
                onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
                className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="ราคาสูงสุด"
                value={priceFilter.max}
                onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
                className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">รายการสินค้า ({filteredProducts.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">รูปภาพ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ชื่อสินค้า</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ราคา</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">รายละเอียด</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {currentProducts.length > 0 ? (
                    currentProducts.map((product, idx) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-green-600">฿{product.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">{product.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteProduct(product._id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <PhotoIcon className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-lg font-medium">ไม่พบสินค้า</p>
                          <p className="text-sm">ลองปรับเปลี่ยนคำค้นหาหรือเพิ่มสินค้าใหม่</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  แสดง {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} จาก {filteredProducts.length} รายการ
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ก่อนหน้า
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">ชื่อสินค้า</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="เช่น เสื้อยืดลายแมว"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">ราคา (บาท)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="เช่น 199"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">รายละเอียดสินค้า</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="รายละเอียดสินค้าโดยย่อ"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">รูปภาพสินค้า</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadImage}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {imageUrl ? (
                            <div className="relative h-48 w-full">
                              <Image
                                src={imageUrl}
                                alt="ตัวอย่างรูปภาพ"
                                fill
                                className="object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="py-8">
                              <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <p className="text-gray-600">คลิกเพื่อเลือกรูปภาพ</p>
                            </div>
                          )}
                        </label>
                        {isUploading && (
                          <div className="mt-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">กำลังอัพโหลด...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsPage; 