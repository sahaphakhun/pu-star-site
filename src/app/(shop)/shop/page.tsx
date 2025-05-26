'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

// เพิ่ม interface เพื่อระบุ _id
interface ProductWithId extends IProduct {
  _id: string;
}

interface CartItem {
  product: ProductWithId;
  quantity: number;
}

const ShopPage = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: CartItem}>({});
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ดึงข้อมูลสินค้า
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      toast.error('ไม่สามารถดึงข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = (product: ProductWithId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[product._id]) {
        newCart[product._id] = {
          product,
          quantity: newCart[product._id].quantity + 1
        };
      } else {
        newCart[product._id] = { product, quantity: 1 };
      }
      return newCart;
    });
    
    toast.success(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, {
      position: 'bottom-center',
      duration: 2000,
    });
  };

  // ลบสินค้าจากตะกร้า
  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] && newCart[productId].quantity > 1) {
        newCart[productId] = {
          ...newCart[productId],
          quantity: newCart[productId].quantity - 1
        };
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const deleteFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
    toast.success('ลบสินค้าออกจากตะกร้าแล้ว');
  };

  // คำนวณราคารวม
  const calculateTotal = () => {
    return Object.values(cart).reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  // คำนวณจำนวนสินค้าในตะกร้า
  const cartItemCount = Object.values(cart).reduce((total, item) => total + item.quantity, 0);

  // ฟิลเตอร์และเรียงลำดับสินค้า
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // หมวดหมู่สินค้า
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // ไปหน้าสั่งซื้อ
  const proceedToCheckout = () => {
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`);
      return;
    }
    
    if (cartItemCount === 0) {
      toast.error('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
      return;
    }
    
    // ส่งข้อมูลตะกร้าไปหน้า checkout
    const cartData = Object.values(cart);
    localStorage.setItem('cart', JSON.stringify(cartData));
    router.push('/shop/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster />
      
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🛍️ ร้านค้าออนไลน์</h1>
              <p className="text-gray-600">ซีลแลนท์และกาวคุณภาพสูง</p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5-6M13 13v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
                </svg>
                <span className="font-medium">ตะกร้าสินค้า</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {cartItemCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'newest')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">เรียงตามชื่อ</option>
              <option value="price">เรียงตามราคา</option>
              <option value="newest">ล่าสุด</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            สินค้าทั้งหมด ({filteredAndSortedProducts.length} รายการ)
          </h2>
        </div>

        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">ไม่พบสินค้าที่คุณค้นหา</h3>
            <p className="text-gray-600">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่ใหม่</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredAndSortedProducts.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={viewMode === 'grid' 
                  ? "bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group" 
                  : "bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 flex gap-4"
                }
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative aspect-square overflow-hidden rounded-t-xl">
                      <Image
                        src={product.imageUrl || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-bold">สินค้าหมด</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-indigo-600">
                          ฿{product.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          คงเหลือ {product.stock} ชิ้น
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {product.stock === 0 ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={product.imageUrl || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-indigo-600">
                            ฿{product.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">คงเหลือ {product.stock} ชิ้น</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.stock === 0 ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Side Panel */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold">ตะกร้าสินค้า ({cartItemCount})</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cartItemCount === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-gray-400 text-6xl mb-4">🛒</div>
                    <p className="text-gray-600">ตะกร้าสินค้าของคุณว่างเปล่า</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.values(cart).map((item) => (
                      <div key={item.product._id} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={item.product.imageUrl || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-indigo-600 font-bold">฿{item.product.price.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => removeFromCart(item.product._id)}
                              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="px-2 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => addToCart(item.product)}
                              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                            <button
                              onClick={() => deleteFromCart(item.product._id)}
                              className="ml-auto text-red-500 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItemCount > 0 && (
                <div className="border-t p-6 space-y-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>ยอดรวม:</span>
                    <span className="text-indigo-600">฿{calculateTotal().toLocaleString()}</span>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105"
                  >
                    ดำเนินการสั่งซื้อ
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopPage; 