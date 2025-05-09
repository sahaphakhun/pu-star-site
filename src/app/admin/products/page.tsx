'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';

interface ProductWithId extends IProduct {
  _id: string;
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    setEditMode(false);
    setCurrentProductId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !price || !description || !imageUrl) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const productData = {
      name,
      price: parseFloat(price),
      description,
      imageUrl,
    };

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
    window.scrollTo(0, 0);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">จัดการสินค้า</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">{editMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">ราคา (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">รายละเอียดสินค้า</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  required
                />
              </div>
            </div>
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">รูปภาพสินค้า</label>
                <div className="flex items-center mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="flex-1"
                    required
                  />
                  {isUploading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 ml-2"></div>
                  )}
                </div>
              </div>
              {imageUrl && (
                <div className="mt-2 relative h-48 w-full">
                  <Image
                    src={imageUrl}
                    alt="ตัวอย่างรูปภาพ"
                    fill
                    className="object-contain border rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">รายการสินค้าทั้งหมด ({products.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รูปภาพ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อสินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ราคา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative h-12 w-12">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="object-cover rounded"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">฿{product.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    ไม่มีสินค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage; 