'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTokenManager } from '@/utils/tokenManager';
import {
  AppModal,
  AppModalContent,
} from '@/components/ui/AppModal';
import ProductForm from '@/components/ProductForm';
import Loading from '@/components/ui/Loading';
import { Product, CreateProduct } from '@/schemas/product';

interface Category {
  _id: string;
  name: string;
  description: string;
}

// Extended Product interface with _id for database
interface ProductWithId extends Product {
  _id: string;
  isDeleted?: boolean;
  deletedAt?: string;
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
  const [selectedLifecycle, setSelectedLifecycle] = useState<'active' | 'archived' | 'all'>('active');
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

      const response = await fetch('/api/products?includeDeleted=true', {
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
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้? (ลบแบบเก็บประวัติ)')) return;
    
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
        toast.success('ลบสินค้าเรียบร้อยแล้ว (เก็บประวัติ)');
        loadProducts();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการลบสินค้า');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const handleRestoreProduct = async (productId: string) => {
    if (!confirm('คุณต้องการกู้คืนสินค้านี้หรือไม่?')) return;

    try {
      const token = await getValidToken();
      if (!token) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
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
        toast.success('กู้คืนสินค้าเรียบร้อยแล้ว');
        loadProducts();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการกู้คืนสินค้า');
      }
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error('เกิดข้อผิดพลาดในการกู้คืนสินค้า');
    }
  };

  const handleEditProduct = (product: ProductWithId) => {
    setEditingProduct(product);
  };

  // แสดง loading ถ้ายังไม่เสร็จการตรวจสอบ authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" label="กำลังตรวจสอบการเข้าสู่ระบบ..." />
      </div>
    );
  }

  // แสดงหน้า login ถ้าไม่ได้ authentication
  if (!isAuthenticated) {
    return null; // useTokenManager จะจัดการ redirect ไปหน้า login
  }

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(term) ||
                         (product as any).sku?.toLowerCase().includes(term || '') ||
                         (product.skuConfig?.prefix && product.skuConfig.prefix.toLowerCase().includes(term));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesLifecycle =
      selectedLifecycle === 'all' ||
      (selectedLifecycle === 'active' && !product.isDeleted) ||
      (selectedLifecycle === 'archived' && product.isDeleted);
    const matchesStatus =
      selectedLifecycle === 'archived' ||
      selectedStatus === 'all' ||
      (selectedStatus === 'available' && product.isAvailable) ||
      (selectedStatus === 'unavailable' && !product.isAvailable);
    
    return matchesSearch && matchesCategory && matchesLifecycle && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getStatusColor = (status: 'available' | 'unavailable' | 'archived') => {
    if (status === 'archived') return 'bg-gray-100 text-gray-600';
    return status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const totalActive = products.filter(product => !product.isDeleted).length;
  const totalArchived = products.filter(product => product.isDeleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
          <p className="text-gray-600">สร้าง แก้ไข และลบสินค้าในระบบ (ลบแบบเก็บประวัติ)</p>
          <p className="text-sm text-gray-500">
            ใช้งานอยู่ {totalActive} รายการ • ลบแล้ว {totalArchived} รายการ
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + สร้างสินค้าใหม่
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
          <select
            value={selectedLifecycle}
            onChange={(e) => setSelectedLifecycle(e.target.value as 'active' | 'archived' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">ใช้งานอยู่</option>
            <option value="archived">ลบแล้ว</option>
            <option value="all">ทั้งหมด</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg border shadow-sm">
        {loadingProducts ? (
          <div className="p-8 text-center">
            <Loading label="กำลังโหลดข้อมูลสินค้า..." />
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
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[32%]">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[9%]">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[9%]">
                    สต็อก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const isArchived = Boolean(product.isDeleted);
                  const statusLabel = isArchived ? 'ถูกลบ' : product.isAvailable ? 'พร้อมขาย' : 'สินค้าหมด';
                  const statusColor = getStatusColor(
                    isArchived ? 'archived' : product.isAvailable ? 'available' : 'unavailable'
                  );
                  return (
                  <tr key={product._id} className={`hover:bg-gray-50 ${isArchived ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 align-top w-[32%]">
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
                          <div
                            className="text-sm text-gray-500 leading-snug max-w-[320px]"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                            title={product.description}
                          >
                            {product.description || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-[14%]">
                      <div className="text-sm text-gray-900 truncate" title={product.sku || 'ไม่มี SKU'}>
                        {product.sku || 'ไม่มี SKU'}
                      </div>
                    </td>
                    <td className="px-6 py-4 w-[14%]">
                      <div className="text-sm text-gray-900 truncate" title={product.category}>
                        {product.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-[9%]">
                      {formatCurrency(product.price || (product.units && product.units.length > 0 ? product.units[0].price : 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-[9%]">
                      {product.units && product.units.length > 0 ? `${product.units.length} หน่วย` : 'ไม่มีหน่วย'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-[10%]">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-[12%]">
                      {isArchived ? (
                        <button
                          onClick={() => handleRestoreProduct(product._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          กู้คืน
                        </button>
                      ) : (
                        <>
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
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Product Modal */}
      <AppModal open={showCreateForm} onOpenChange={(open) => !open && setShowCreateForm(false)}>
        <AppModalContent size="lg" showClose={false}>
        <ProductForm
          initialData={editingProduct ? {
            name: editingProduct.name,
            description: editingProduct.description,
            sku: (editingProduct as any).sku,
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
        </AppModalContent>
      </AppModal>
    </div>
  );
};

export default ProductsPage;
