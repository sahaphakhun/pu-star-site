'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
}

const CheckoutPage = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login?returnUrl=' + encodeURIComponent('/shop'));
      return;
    }

    // ดึงข้อมูลตะกร้าจาก localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลตะกร้า');
        router.push('/shop');
      }
    } else {
      toast.error('ไม่พบข้อมูลตะกร้าสินค้า');
      router.push('/shop');
    }

    // ใช้ข้อมูลผู้ใช้ที่ล็อกอินอยู่
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phoneNumber || '');
    }
  }, [isLoggedIn, user, router]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (paymentMethod === 'transfer' && !slipFile) {
      toast.error('กรุณาแนบสลิปการโอนเงิน');
      return;
    }

    setLoading(true);

    try {
      let slipUrl = '';
      
      // อัพโหลดสลิปถ้าเป็นการโอนเงิน
      if (paymentMethod === 'transfer' && slipFile) {
        const formData = new FormData();
        formData.append('file', slipFile);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          slipUrl = uploadData.secure_url;
        } else {
          throw new Error('ไม่สามารถอัพโหลดสลิปได้');
        }
      }

      // ส่งข้อมูลคำสั่งซื้อ
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
        // ลบข้อมูลตะกร้าออกจาก localStorage
        localStorage.removeItem('cart');
        
        await Swal.fire({
          title: 'สำเร็จ!',
          text: 'ขอบคุณสำหรับการสั่งซื้อ เราจะติดต่อกลับเร็วที่สุด',
          icon: 'success',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#10B981'
        });
        
        router.push('/shop');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสั่งซื้อ');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!customerName || !customerPhone || !customerAddress) {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบสินค้าในตะกร้า</h2>
          <p className="text-gray-600 mb-6">กรุณาเลือกสินค้าก่อนทำการสั่งซื้อ</p>
          <button
            onClick={() => router.push('/shop')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            กลับไปเลือกสินค้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <Toaster />
      
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ดำเนินการสั่งซื้อ</h1>
          <p className="text-gray-600">กรุณาตรวจสอบข้อมูลและดำเนินการชำระเงิน</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <div className="ml-2 text-sm font-medium">
                  {step === 1 && 'ตรวจสอบสินค้า'}
                  {step === 2 && 'ข้อมูลจัดส่ง'}
                  {step === 3 && 'ชำระเงิน'}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-4 ${
                      currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          {/* Step 1: ตรวจสอบสินค้า */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">ตรวจสอบรายการสินค้า</h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.product.imageUrl || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-gray-600">จำนวน: {item.quantity} ชิ้น</p>
                      <p className="text-indigo-600 font-bold">
                        ฿{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span className="text-indigo-600">฿{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={nextStep}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  ถัดไป
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: ข้อมูลจัดส่ง */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลการจัดส่ง</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อผู้รับ *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เบอร์โทรศัพท์ *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่สำหรับจัดส่ง *
                </label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="กรุณาระบุที่อยู่ที่ชัดเจน รวมถึงรหัสไปรษณีย์"
                  required
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={nextStep}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  ถัดไป
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: ชำระเงิน */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">วิธีการชำระเงิน</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <h3 className="font-medium">เก็บเงินปลายทาง</h3>
                      <p className="text-sm text-gray-600">ชำระเงินเมื่อได้รับสินค้า</p>
                    </div>
                  </div>
                </label>

                <label
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🏦</div>
                    <div>
                      <h3 className="font-medium">โอนเงินผ่านธนาคาร</h3>
                      <p className="text-sm text-gray-600">โอนเงินล่วงหน้า</p>
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'transfer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-medium text-blue-900 mb-4">ข้อมูลบัญชีสำหรับโอนเงิน</h3>
                  
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">ธนาคารกรุงเทพ</p>
                        <p className="text-lg font-mono">123-4-56789-0</p>
                        <p className="text-sm text-gray-600">นาย PU STAR</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('123-4-56789-0');
                          toast.success('คัดลอกเลขบัญชีแล้ว');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        คัดลอก
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      แนบสลิปการโอนเงิน *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlipChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    {slipPreview && (
                      <div className="mt-4">
                        <div className="relative w-full max-w-xs mx-auto h-64 overflow-hidden rounded-lg border">
                          <Image
                            src={slipPreview}
                            alt="สลิปการโอนเงิน"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* สรุปคำสั่งซื้อ */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">สรุปคำสั่งซื้อ</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ชื่อผู้รับ:</span>
                    <span>{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">เบอร์โทรศัพท์:</span>
                    <span>{customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ที่อยู่จัดส่ง:</span>
                    <span className="text-right max-w-xs">{customerAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วิธีชำระเงิน:</span>
                    <span>{paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>ยอดรวม:</span>
                      <span className="text-indigo-600">฿{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  <span>{loading ? 'กำลังดำเนินการ...' : 'ยืนยันการสั่งซื้อ'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 