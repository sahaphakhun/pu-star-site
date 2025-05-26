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

const ShopPage = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: {product: ProductWithId, quantity: number}}>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // ใช้สำหรับแบ่ง step ในฟอร์มการสั่งซื้อ
  const [showCart, setShowCart] = useState(false); // แสดงตะกร้าแบบ Bottom Sheet

  // ใช้ข้อมูลผู้ใช้จาก Auth Context ถ้ามีการล็อกอิน
  useEffect(() => {
    if (isLoggedIn && user) {
      setCustomerName(user.name);
      setCustomerPhone(user.phoneNumber);
    }
  }, [isLoggedIn, user]);

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
    
    // แสดงการตอบสนองเมื่อเพิ่มสินค้า
    toast.success(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, {
      position: 'bottom-right',
      duration: 2000,
    });
  };

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
          delete newCart[productId];
          return newCart;
        });
        toast.success('ลบสินค้าออกจากตะกร้าแล้ว', {
          position: 'bottom-right',
        });
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
      // ถ้ายังไม่ได้ล็อกอิน ให้ redirect ไปหน้าล็อกอิน
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
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
      toast.error('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
      return;
    }
    
    // แสดง Loading
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
        // อัพโหลดสลิปไป cloudinary (หรือ server)
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
        slipUrl,
        items: cartItems.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        totalAmount: calculateTotal()
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
          text: 'ขอบคุณสำหรับการสั่งซื้อ เราจะจัดส่งสินค้าให้เร็วที่สุด',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        });
        setCart({});
        setCustomerAddress('');
        setPaymentMethod('cod');
        setSlipFile(null);
        setSlipPreview(null);
        setShowOrderForm(false);
        setCurrentStep(1);
      } else {
        throw new Error('เกิดข้อผิดพลาดในการสั่งซื้อ');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const totalItems = Object.values(cart).reduce(
    (count, item) => count + item.quantity,
    0
  );

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
      {/* Toaster สำหรับการแสดงการแจ้งเตือน */}
      <Toaster />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">รายการสินค้า</h1>
        <motion.button 
          onClick={() => setShowCart(true)}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg"
          whileTap={{ scale: 0.95 }}
        >
          <span className="mr-2">ตะกร้า</span>
          <span className="bg-white text-blue-500 rounded-full h-6 w-6 flex items-center justify-center text-sm">
            {totalItems}
          </span>
        </motion.button>
      </div>

      {/* ตะกร้าสินค้าแบบ Bottom Sheet สำหรับมือถือ */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCart(false)}
          >
            <motion.div 
              className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl mt-auto sm:mt-0 max-h-[85vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">ตะกร้าสินค้า ({totalItems})</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {Object.keys(cart).length > 0 ? (
                <div className="p-4">
                  {Object.values(cart).map((item) => (
                    <motion.div 
                      key={item.product._id} 
                      className="flex justify-between items-center mb-3 border-b pb-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden mr-3">
                          <Image
                            src={item.product.imageUrl || '/placeholder.jpg'}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">฿{item.product.price.toLocaleString()} x {item.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <motion.button 
                            onClick={() => removeFromCart(item.product._id)} 
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                            whileTap={{ scale: 0.95 }}
                          >
                            -
                          </motion.button>
                          <span className="px-3">{item.quantity}</span>
                          <motion.button 
                            onClick={() => addToCart(item.product)} 
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                            whileTap={{ scale: 0.95 }}
                          >
                            +
                          </motion.button>
                        </div>
                        <motion.button 
                          onClick={() => deleteFromCart(item.product._id)}
                          className="ml-2 text-red-500 p-1"
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="border-t pt-3 mb-4 mt-2">
                    <div className="flex justify-between font-bold bg-blue-50 p-3 rounded-lg">
                      <span>รวมทั้งสิ้น:</span>
                      <span>฿{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShowOrderForm}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
                  >
                    ดำเนินการสั่งซื้อ
                  </motion.button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">ยังไม่มีสินค้าในตะกร้า</p>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg" 
                    onClick={() => setShowCart(false)}
                  >
                    เลือกสินค้า
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ฟอร์มการสั่งซื้อแบบ steps */}
      <AnimatePresence>
        {showOrderForm && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">สั่งซื้อสินค้า</h2>
                <button 
                  onClick={() => setShowOrderForm(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Stepper */}
              <div className="flex mb-6">
                <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-blue-500' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>1</div>
                  <span className="text-xs">ตรวจสอบสินค้า</span>
                </div>
                <div className={`h-0.5 w-full self-center max-w-10 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-blue-500' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>2</div>
                  <span className="text-xs">ข้อมูลจัดส่ง</span>
                </div>
                <div className={`h-0.5 w-full self-center max-w-10 ${currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`flex-1 text-center ${currentStep >= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>3</div>
                  <span className="text-xs">ชำระเงิน</span>
                </div>
              </div>
              
              {/* Step 1: แสดงรายการสินค้า */}
              {currentStep === 1 && (
                <div>
                  <div className="max-h-60 overflow-y-auto mb-4">
                    {Object.values(cart).map((item) => (
                      <div key={item.product._id} className="flex justify-between items-center mb-3 border-b pb-3">
                        <div className="flex items-center">
                          <div className="relative h-16 w-16 rounded-md overflow-hidden mr-3">
                            <Image
                              src={item.product.imageUrl || '/placeholder.jpg'}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">฿{item.product.price.toLocaleString()} x {item.quantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <motion.button 
                              onClick={() => removeFromCart(item.product._id)} 
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                              whileTap={{ scale: 0.95 }}
                            >
                              -
                            </motion.button>
                            <span className="px-3">{item.quantity}</span>
                            <motion.button 
                              onClick={() => addToCart(item.product)} 
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                              whileTap={{ scale: 0.95 }}
                            >
                              +
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-2 mb-4">
                    <div className="flex justify-between font-bold bg-blue-50 p-3 rounded-lg">
                      <span>รวมทั้งสิ้น:</span>
                      <span>฿{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentStep(2)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                    >
                      ถัดไป
                    </motion.button>
                  </div>
                </div>
              )}
              
              {/* Step 2: ข้อมูลการจัดส่ง */}
              {currentStep === 2 && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">ชื่อลูกค้า</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                      disabled={isLoggedIn}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                      disabled={isLoggedIn}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">ที่อยู่สำหรับจัดส่ง</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentStep(1)}
                      className="bg-gray-300 px-6 py-2 rounded-lg"
                    >
                      ย้อนกลับ
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentStep(3)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                    >
                      ถัดไป
                    </motion.button>
                  </div>
                </div>
              )}
              
              {/* Step 3: ชำระเงิน */}
              {currentStep === 3 && (
                <form onSubmit={handleSubmitOrder}>
                  <div className="mb-4">
                    <label className="block text-sm mb-2">เลือกวิธีชำระเงิน</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">เก็บเงินปลายทาง</p>
                          <p className="text-xs text-gray-500">ชำระเงินเมื่อได้รับสินค้า</p>
                        </div>
                      </label>
                      <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transfer"
                          checked={paymentMethod === 'transfer'}
                          onChange={() => setPaymentMethod('transfer')}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">โอนเงิน</p>
                          <p className="text-xs text-gray-500">โอนเงินผ่านธนาคาร</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {paymentMethod === 'transfer' && (
                    <div className="mb-4 border rounded-lg p-4 bg-blue-50">
                      <div className="mb-3">
                        <span className="font-semibold block mb-1">เลขบัญชีสำหรับโอนเงิน:</span>
                        <div className="bg-white p-3 rounded-lg border flex justify-between items-center">
                          <span className="select-all">123-4-56789-0 ธนาคารกรุงเทพ</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('123-4-56789-0');
                              toast.success('คัดลอกเลขบัญชีแล้ว', { duration: 2000 });
                            }}
                            className="text-blue-500"
                          >
                            คัดลอก
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-2">แนบสลิปการโอนเงิน</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleSlipChange} 
                          className="w-full mb-2"
                          required 
                        />
                        {slipPreview && (
                          <div className="mt-2 relative h-40 w-full">
                            <Image 
                              src={slipPreview} 
                              alt="slip preview" 
                              className="object-contain rounded-lg border" 
                              fill
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 mb-4 mt-2">
                    <div className="font-bold mb-2">ตรวจสอบข้อมูล</div>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ชื่อผู้สั่งซื้อ:</span>
                        <span>{customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">เบอร์โทรศัพท์:</span>
                        <span>{customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ที่อยู่จัดส่ง:</span>
                        <span className="text-right max-w-[220px]">{customerAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ชำระเงินโดย:</span>
                        <span>{paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>ยอดรวม:</span>
                        <span>฿{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentStep(2)}
                      className="bg-gray-300 px-6 py-2 rounded-lg"
                    >
                      ย้อนกลับ
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.95 }}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg"
                    >
                      ยืนยันการสั่งซื้อ
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* รายการสินค้า */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <motion.div
              key={product._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={product.imageUrl || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3 sm:p-4">
                <h2 className="text-lg font-semibold mb-1 line-clamp-1">{product.name}</h2>
                <p className="text-xl font-bold text-blue-600 mb-2">฿{product.price.toLocaleString()}</p>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(product)}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  เพิ่มลงตะกร้า
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">ไม่พบสินค้า</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage; 