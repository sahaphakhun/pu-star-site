'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTokenManager } from '@/utils/tokenManager';
import AdminModal from '@/components/AdminModal';
import ProductForm from '@/components/ProductForm';
import { Product, CreateProduct } from '@/schemas/product';

interface Category {
  _id: string;
  name: string;
  description: string;
}

// Extended Product interface with _id for database
interface ProductWithId extends Product {
  _id: string;
}

const ProductsPage: React.FC = () => {
  const { getValidToken, logout, isAuthenticated, loading } = useTokenManager();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithId | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'unavailable'>('all');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    // ตรวจสอบ authentication เมื่อโหลดหน้า
    if (!loading && !isAuthenticated) {
      logout();
      return;
    }
    
    if (isAuthenticated) {
      loadProducts();
      loadCategories();
    }
  }, [isAuthenticated, loading, logout]);

  const loadProducts = async () => {
    try {
      console.log('[B2B] Loading products...');
      const token = await getValidToken();
      if (!token) {
        console.log('[B2B] No valid token found');
        return;
      }

      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[B2B] Products API response status:', response.status);
      
      if (response.status === 401) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }
      
      const result = await response.json();
      console.log('[B2B] Products API response:', result);
      
      if (result.success) {
        console.log('[B2B] Products loaded successfully, count:', result.data?.length || 0);
        setProducts(result.data || []);
      } else {
        console.log('[B2B] Failed to load products:', result.error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
      }
    } catch (error) {
      console.error('[B2B] Error loading products:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        return;
      }

      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateProduct = async (productData: CreateProduct) => {
    setFormLoading(true);
    try {
      console.log('[B2B] Creating product with data:', productData);
      const token = await getValidToken();
      
      if (!token) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      console.log('[B2B] Create product response status:', response.status);
      
      if (response.status === 401) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }
      
      const result = await response.json();
      console.log('[B2B] Create product response:', result);
      
      if (result.success) {
        console.log('[B2B] Product created successfully');
        toast.success('สร้างสินค้าเรียบร้อยแล้ว');
        setShowCreateForm(false);
        await loadProducts();
      } else {
        console.log('[B2B] Failed to create product:', result.error);
        toast.error(result.error || 'เกิดข้อผิดพลาดในการสร้างสินค้า');
      }
    } catch (error) {
      console.error('[B2B] Error creating product:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างสินค้า');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProduct = async (productData: CreateProduct) => {
    setFormLoading(true);
    if (!editingProduct) return;
    
    try {
      const token = await getValidToken();
      if (!token) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }

      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (response.status === 401) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('อัปเดตสินค้าเรียบร้อยแล้ว');
        setEditingProduct(null);
        loadProducts();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการอัปเดตสินค้า');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสินค้า');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) return;
    
    try {
      const token = await getValidToken();
      if (!token) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('ลบสินค้าเรียบร้อยแล้ว');
        loadProducts();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการลบสินค้า');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const handleEditProduct = (product: ProductWithId) => {
    setEditingProduct(product);
  };

  const handleLogout = async () => {
    logout();
  };

  // แสดง loading ถ้ายังไม่เสร็จการตรวจสอบ authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  // แสดงหน้า login ถ้าไม่ได้ authentication
  if (!isAuthenticated) {
    return null; // useTokenManager จะจัดการ redirect ไปหน้า login
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.skuConfig?.prefix && product.skuConfig.prefix.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'available' && product.isAvailable) ||
                         (selectedStatus === 'unavailable' && !product.isAvailable);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
          <p className="text-gray-600">สร้าง แก้ไข และลบสินค้าในระบบ</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + สร้างสินค้าใหม่
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'available' | 'unavailable')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="available">พร้อมขาย</option>
            <option value="unavailable">สินค้าหมด</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg border shadow-sm">
        {loadingProducts ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูลสินค้า...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">ไม่พบสินค้าในระบบ</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              สร้างสินค้าแรก
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สต็อก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.imageUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={product.imageUrl}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">ไม่มีรูป</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.skuConfig?.prefix || 'ไม่มี SKU'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price || (product.units && product.units.length > 0 ? product.units[0].price : 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.units && product.units.length > 0 ? `${product.units.length} หน่วย` : 'ไม่มีหน่วย'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.isAvailable ? 'available' : 'unavailable')}`}>
                        {product.isAvailable ? 'พร้อมขาย' : 'สินค้าหมด'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Product Modal */}
      <AdminModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="max-w-2xl"
        maxHeight="max-h-[90vh]"
      >
        <ProductForm
          initialData={editingProduct ? {
            name: editingProduct.name,
            description: editingProduct.description,
            price: editingProduct.price,
            shippingFee: editingProduct.shippingFee,
            category: editingProduct.category,
            imageUrl: editingProduct.imageUrl,
            isAvailable: editingProduct.isAvailable,
            units: editingProduct.units,
            options: editingProduct.options,
            skuConfig: editingProduct.skuConfig,
          } : undefined}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingProduct(null);
          }}
          isEditing={!!editingProduct}
          loading={formLoading}
          categories={categories}
        />
      </AdminModal>
    </div>
  );
};

export default ProductsPage;


