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

      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg mb-8 sm:mb-10 max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-blue-700">{editMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-700">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
                  placeholder="เช่น เสื้อยืดลายแมว"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-700">ราคา (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
                  placeholder="เช่น 199"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-700">รายละเอียดสินค้า</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
                  rows={4}
                  placeholder="รายละเอียดสินค้าโดยย่อ"
                  required
                />
              </div>
            </div>
            <div>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-700">รูปภาพสินค้า</label>
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
          <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full"
            >
              {editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition w-full mt-2 sm:mt-0"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-blue-700">รายการสินค้าทั้งหมด ({products.length})</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 w-16 sm:w-24">รูปภาพ</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600">ชื่อสินค้า</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 w-20 sm:w-28">ราคา</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 w-20 sm:w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product, idx) => (
                    <tr
                      key={product._id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-3 sm:px-6 py-3">
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
                      <td className="px-3 sm:px-6 py-3">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-gray-500 line-clamp-1">{product.description}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        <div className="text-gray-900">฿{product.price.toLocaleString()}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded-md text-sm"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-800 font-semibold bg-red-50 px-2 py-1 rounded-md text-sm"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-gray-400 font-semibold bg-gray-50">
                      ไม่มีสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage; 