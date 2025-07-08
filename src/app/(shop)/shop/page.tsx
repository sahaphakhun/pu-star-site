'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

interface ProductWithId extends IProduct {
  _id: string;
}

interface CartItem {
  product: ProductWithId;
  quantity: number;
  selectedOptions?: { [optionName: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

const ShopPage = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: CartItem}>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{[optionName: string]: string}>({});
  const [selectedUnit, setSelectedUnit] = useState<{ label: string; price: number } | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [shippingSetting, setShippingSetting] = useState<{freeThreshold:number,fee:number,freeQuantityThreshold:number,maxFee:number}>({freeThreshold:500,fee:50,freeQuantityThreshold:0,maxFee:50});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [quantities, setQuantities] = useState<{[productId: string]: number}>({});
  
  // Tax Invoice states
  const [requestTaxInvoice, setRequestTaxInvoice] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  useEffect(() => {
    if (isLoggedIn && user) {
      setCustomerName(user.name);
      setCustomerPhone(user.phoneNumber);
    }
  }, [isLoggedIn, user]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data: ProductWithId[] = await response.json();
      setProducts(data);
      const cats = Array.from(new Set(data.map((p: any) => p.category || 'ทั่วไป')));
      setCategories(['ทั้งหมด', ...cats]);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error('โหลดข้อมูลตะกร้าจาก localStorage ไม่สำเร็จ', err);
    }
    // ดึง setting ค่าจัดส่ง
    fetch('/api/settings/shipping')
      .then(res=>res.json())
      .then(data=>{
        if(data) setShippingSetting(data);
      }).catch(()=>{});
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('บันทึกตะกร้าลง localStorage ไม่สำเร็จ', err);
    }
  }, [cart]);

  useEffect(() => {
    if (isLoggedIn) {
      const pending = localStorage.getItem('pendingCheckout');
      if (pending === '1') {
        setShowOrderForm(true);
        localStorage.removeItem('pendingCheckout');
      }
    }
  }, [isLoggedIn]);

  const generateCartKey = (productId: string, selectedOptions?: {[key: string]: string}, unitLabel?: string) => {
    const parts = [productId];
    if (unitLabel) parts.push(unitLabel);
    if (selectedOptions && Object.keys(selectedOptions).length > 0) {
      parts.push(JSON.stringify(selectedOptions));
    }
    return parts.join('-');
  };

  const handleAddToCart = (product: ProductWithId, options?: {[key: string]: string}, unit?: {label:string; price:number}, quantity: number = 1) => {
    const cartKey = generateCartKey(product._id, options, unit?.label);
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[cartKey]) {
        newCart[cartKey] = {
          ...newCart[cartKey],
          quantity: newCart[cartKey].quantity + quantity
        };
      } else {
        newCart[cartKey] = { 
          product, 
          quantity: quantity,
          selectedOptions: options,
          unitLabel: unit?.label,
          unitPrice: unit?.price,
        };
      }
      return newCart;
    });
    
    toast.success(`เพิ่ม ${product.name} ${quantity} ชิ้น ลงตะกร้าแล้ว`, {
      duration: 2000,
    });
  };

  const getQuantityForProduct = (productId: string) => {
    return quantities[productId] || 1;
  };

  const setQuantityForProduct = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  const openProductModal = (product: ProductWithId) => {
    setSelectedProduct(product);
    setSelectedOptions({});
    setModalQuantity(getQuantityForProduct(product._id));
    if (product.units && product.units.length > 0) {
      setSelectedUnit(product.units[0]);
    } else {
      setSelectedUnit(null);
    }
  };

  const addToCartWithOptions = () => {
    if (!selectedProduct) return;
    const unitToUse = selectedUnit ?? (selectedProduct.units && selectedProduct.units[0]);
    
    // ตรวจสอบว่าเลือกตัวเลือกครบหรือไม่
    if (selectedProduct.options && selectedProduct.options.length > 0) {
      const missingOptions = selectedProduct.options.filter(option => !selectedOptions[option.name]);
      if (missingOptions.length > 0) {
        toast.error(`กรุณาเลือก ${missingOptions.map(o => o.name).join(', ')}`);
        return;
      }
    }

    handleAddToCart(selectedProduct, selectedOptions, unitToUse || undefined, modalQuantity);
    setSelectedProduct(null);
    setSelectedOptions({});
    setSelectedUnit(null);
    setModalQuantity(1);
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[cartKey] && newCart[cartKey].quantity > 1) {
        newCart[cartKey] = {
          ...newCart[cartKey],
          quantity: newCart[cartKey].quantity - 1
        };
      } else {
        delete newCart[cartKey];
      }
      return newCart;
    });
  };
  
  const deleteFromCart = (cartKey: string) => {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ลบออก',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        setCart(prev => {
          const newCart = { ...prev };
          delete newCart[cartKey];
          return newCart;
        });
        toast.success('ลบสินค้าออกจากตะกร้าแล้ว');
      }
    });
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSlipFile(file);
    if (file) {
      setSlipPreview(URL.createObjectURL(file));
    } else {
      setSlipPreview(null);
    }
  };

  const handleShowOrderForm = () => {
    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingCheckout', '1');
      }
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`);
    } else {
      setShowOrderForm(true);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`);
      return;
    }
    
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error('กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่');
      return;
    }
    if (paymentMethod === 'transfer' && !slipFile) {
      toast.error('กรุณาแนบสลิปการโอนเงิน');
      return;
    }
    if (requestTaxInvoice) {
      if (!companyName || !taxId) {
        toast.error('กรุณากรอกชื่อบริษัทและเลขประจำตัวผู้เสียภาษี');
        return;
      }
    }
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
      toast.error('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
      return;
    }
    
    Swal.fire({
      title: 'กำลังดำเนินการ',
      html: 'กรุณารอสักครู่...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    let slipUrl = '';
    try {
      if (paymentMethod === 'transfer' && slipFile) {
        const formData = new FormData();
        formData.append('file', slipFile);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        slipUrl = data.secure_url;
      }
      
      const orderData = {
        customerName,
        customerPhone,
        customerAddress,
        paymentMethod,
        ...(paymentMethod === 'transfer' && slipUrl ? { slipUrl } : {}),
        items: cartItems.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.unitPrice !== undefined ? item.unitPrice : item.product.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? item.selectedOptions : undefined,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice
        })),
        shippingFee: calculateShippingFee(),
        totalAmount: calculateGrandTotal(),
        taxInvoice: requestTaxInvoice ? {
          requestTaxInvoice,
          companyName: companyName || undefined,
          taxId: taxId || undefined,
          companyAddress: companyAddress || undefined,
          companyPhone: companyPhone || undefined,
          companyEmail: companyEmail || undefined
        } : undefined
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'ส่งคำสั่งซื้อเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        });
        setCart({});
        setShowOrderForm(false);
        setCustomerAddress('');
        setSlipFile(null);
        setSlipPreview(null);
        setRequestTaxInvoice(false);
        setCompanyName('');
        setTaxId('');
        setCompanyAddress('');
        setCompanyPhone('');
        setCompanyEmail('');
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งคำสั่งซื้อได้ กรุณาลองอีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce((total, item) => {
      const priceEach = item.unitPrice !== undefined ? item.unitPrice : item.product.price;
      return total + (priceEach * item.quantity);
    }, 0);
  };

  const calculateShippingFee = () => {
    const { maxFee } = shippingSetting;

    // หากตะกร้าว่าง
    if (Object.values(cart).length === 0) return 0;

    // รวบรวมค่าจัดส่งของแต่ละหน่วย
    const fees: number[] = Object.values(cart).map((item) => {
      if (item.unitLabel && item.product.units) {
        const u = item.product.units.find((un) => un.label === item.unitLabel);
        return u?.shippingFee ?? 0;
      }
      // ไม่มีหน่วย → ใช้ shippingFee ของสินค้า
      return (item.product as any).shippingFee ?? 0;
    });

    const maxUnitFee = fees.length ? Math.max(...fees) : 0;
    return Math.min(maxFee ?? 50, maxUnitFee);
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateShippingFee();
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="bottom-left" />
      

      <div className="container mx-auto px-4 py-8">
        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">สินค้าทั้งหมด</h2>
            <div className="flex overflow-x-auto space-x-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {(
              selectedCategory === 'ทั้งหมด'
                ? products
                : products.filter((p) => (p.category || 'ทั่วไป') === selectedCategory)
            ).map((product) => (
              <motion.div
                key={product._id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl"
              >
                <div className="relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm md:text-base">
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold text-lg mb-3 text-sm md:text-base">
                    {(() => {
                      const priceVal = product.price !== undefined ? product.price : (product.units && product.units[0]?.price) || 0;
                      const label = product.price === undefined && product.units && product.units.length > 0 ? ` / ${product.units[0].label}` : '';
                      return `฿${priceVal.toLocaleString()}${label}`;
                    })()}
                  </p>
                  
                  {/* ช่องใส่จำนวนสินค้า */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">จำนวน</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setQuantityForProduct(product._id, getQuantityForProduct(product._id) - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600 text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={getQuantityForProduct(product._id)}
                        onChange={(e) => setQuantityForProduct(product._id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center border border-gray-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                      <button
                        onClick={() => setQuantityForProduct(product._id, getQuantityForProduct(product._id) + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if ((product.options && product.options.length > 0) || (product.units && product.units.length > 0)) {
                        openProductModal(product);
                      } else {
                        handleAddToCart(product, undefined, undefined, getQuantityForProduct(product._id));
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {(product.options && product.options.length > 0) || (product.units && product.units.length > 0) 
                      ? 'เลือกตัวเลือก' 
                      : `เพิ่มลงตะกร้า (${getQuantityForProduct(product._id)} ชิ้น)`
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Cart Button */}
        {getTotalItems() > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getTotalItems()}
              </span>
            </div>
          </motion.button>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-square">
                <Image
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover rounded-t-xl"
                />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
                <p className="text-2xl font-bold text-blue-600 mb-6">
                  {(() => {
                    const priceVal = selectedUnit ? selectedUnit.price : selectedProduct.price ?? (selectedProduct.units && selectedProduct.units[0]?.price) || 0;
                    const label = selectedUnit ? ` / ${selectedUnit.label}` : (selectedProduct.price === undefined && selectedProduct.units && selectedProduct.units.length > 0 ? ` / ${selectedProduct.units[0].label}` : '');
                    return `฿${priceVal.toLocaleString()}${label}`;
                  })()}
                </p>

                {/* Units */}
                {selectedProduct.units && selectedProduct.units.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลือกหน่วย
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.units.map((unit) => (
                        <button
                          key={unit.label}
                          type="button"
                          onClick={() => setSelectedUnit(unit)}
                          className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                            selectedUnit?.label === unit.label
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {unit.label} ({unit.price.toLocaleString()} ฿)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                {selectedProduct.options && selectedProduct.options.map((option) => (
                  <div key={option.name} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {option.name}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {option.values.map((value) => (
                        <button
                          key={value.label}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value.label }))}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            selectedOptions[option.name] === value.label
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {value.imageUrl && (
                            <div className="relative w-8 h-8 mx-auto mb-1">
                              <Image
                                src={value.imageUrl}
                                alt={value.label}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          )}
                          <span className="text-sm">{value.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* ช่องใส่จำนวนสินค้าใน modal */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">จำนวน</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={modalQuantity}
                      onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    <button
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={addToCartWithOptions}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  เพิ่มลงตะกร้า ({modalQuantity} ชิ้น)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md md:max-w-lg h-6/7 md:h-auto md:max-h-[75vh] rounded-t-xl md:rounded-xl overflow-hidden flex flex-col mb-20 md:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-semibold">ตะกร้าสินค้า ({getTotalItems()})</h3>
                <button onClick={() => setShowCart(false)} className="p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {Object.entries(cart).map(([cartKey, item]) => (
                  <div key={cartKey} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.product.name}</h4>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-xs text-gray-500">
                          {Object.entries(item.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                        </p>
                      )}
                      <p className="text-blue-600 font-semibold">
                        ฿{(item.unitPrice !== undefined ? item.unitPrice : item.product.price).toLocaleString()}
                        {item.unitLabel && (
                          <span className="text-xs text-gray-500 ml-1">/ {item.unitLabel}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(cartKey)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleAddToCart(
                          item.product,
                          item.selectedOptions,
                          item.unitLabel && item.unitPrice !== undefined ? { label: item.unitLabel, price: item.unitPrice } : undefined,
                          1
                        )}
                        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                      >
                        +
                      </button>
                      <button
                        onClick={() => deleteFromCart(cartKey)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fixed Footer with Summary and Checkout Button */}
              {Object.keys(cart).length > 0 && (
                <div className="border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ค่าส่ง</span>
                      <span className="text-sm font-medium">฿{calculateShippingFee().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-lg font-semibold">รวมทั้งสิ้น:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ฿{calculateGrandTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Checkout Button Outside Modal */}
      <AnimatePresence>
        {showCart && Object.keys(cart).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-[60] max-w-md md:max-w-lg mx-auto"
          >
            <button
              onClick={() => {
                setShowCart(false);
                handleShowOrderForm();
              }}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
            >
              ดำเนินการสั่งซื้อ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Form Modal */}
      <AnimatePresence>
        {showOrderForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowOrderForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">ข้อมูลการสั่งซื้อ</h3>
                  <button onClick={() => setShowOrderForm(false)} className="p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่จัดส่ง</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วิธีการชำระเงิน</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'transfer')}
                          className="mr-2"
                        />
                        เก็บเงินปลายทาง
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="transfer"
                          checked={paymentMethod === 'transfer'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'transfer')}
                          className="mr-2"
                        />
                        โอนเงินผ่านธนาคาร
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'transfer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อัพโหลดสลิปการโอนเงิน</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlipChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      {slipPreview && (
                        <div className="mt-2 relative w-full h-48">
                          <Image
                            src={slipPreview}
                            alt="ตัวอย่างสลิป"
                            fill
                            className="object-contain border rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tax Invoice Section */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="requestTaxInvoice"
                        checked={requestTaxInvoice}
                        onChange={(e) => setRequestTaxInvoice(e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="requestTaxInvoice" className="text-sm font-medium text-gray-700">
                        ต้องการใบกำกับภาษี (ไม่บังคับ)
                      </label>
                    </div>
                    
                    {requestTaxInvoice && (
                      <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท *</label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={requestTaxInvoice}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี *</label>
                          <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0000000000000"
                            maxLength={13}
                            required={requestTaxInvoice}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่บริษัท</label>
                          <textarea
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์บริษัท</label>
                          <input
                            type="tel"
                            value={companyPhone}
                            onChange={(e) => setCompanyPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลบริษัท</label>
                          <input
                            type="email"
                            value={companyEmail}
                            onChange={(e) => setCompanyEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">สรุปคำสั่งซื้อ</h4>
                    <div className="space-y-1 text-sm">
                      {Object.values(cart).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.product.name} x{item.quantity}</span>
                          <span>฿{((item.unitPrice !== undefined ? item.unitPrice : item.product.price) * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>ยอดสินค้า:</span>
                        <span>฿{calculateTotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ค่าจัดส่ง:</span>
                        <span>{calculateShippingFee() === 0 ? 'ฟรี' : `฿${calculateShippingFee().toLocaleString()}`}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-1 border-t">
                        <span>ยอดรวม:</span>
                        <span className="text-blue-600">฿{calculateGrandTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    ยืนยันการสั่งซื้อ
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopPage; 