"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { addToCart, isOnline } from '@/utils/cartUtils';

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category?: string;
  isAvailable?: boolean;
  units?: {
    label: string;
    price: number;
    multiplier?: number;
    shippingFee?: number;
  }[];
  options?: {
    name: string;
    values: {
      label: string;
      imageUrl?: string;
      isAvailable?: boolean;
    }[];
  }[];
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error('ไม่พบสินค้า');
      }
      const data = await response.json();
      setProduct(data);
      
      // ตั้งค่าหน่วยเริ่มต้น
      if (data.units && data.units.length > 0) {
        setSelectedUnit(data.units[0].label);
        setSelectedPrice(data.units[0].price);
      } else {
        setSelectedUnit('หน่วย');
        setSelectedPrice(data.price);
      }
      
      // ตั้งค่าตัวเลือกเริ่มต้น
      if (data.options) {
        const initialOptions: Record<string, string> = {};
        data.options.forEach((option: any) => {
          if (option.values && option.values.length > 0) {
            initialOptions[option.name] = option.values[0].label;
          }
        });
        setSelectedOptions(initialOptions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (unitLabel: string) => {
    setSelectedUnit(unitLabel);
    const unit = product?.units?.find(u => u.label === unitLabel);
    if (unit) {
      setSelectedPrice(unit.price);
    }
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
    if (!isOnline()) {
      toast.error('ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง', {
        duration: 5000,
        position: 'bottom-right',
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      });
      return;
    }
    
    // ตรวจสอบว่าสินค้าพร้อมขายหรือไม่
    if (product.isAvailable === false) {
      toast.error('สินค้านี้หมดแล้ว ไม่สามารถสั่งซื้อได้');
      return;
    }
    
    // ตรวจสอบว่าสินค้ามีหน่วยหรือไม่ และต้องเลือกหน่วย
    if (product.units && product.units.length > 0) {
      if (!selectedUnit || selectedUnit === '') {
        toast.error('กรุณาเลือกหน่วยสินค้าก่อนเพิ่มลงตะกร้า');
        return;
      }
    }
    
    // ตรวจสอบว่าสินค้ามีตัวเลือกหรือไม่ และต้องเลือกตัวเลือกครบถ้วน
    if (product.options && product.options.length > 0) {
      const missingOptions = product.options.filter(option => {
        const selectedValue = selectedOptions[option.name];
        return !selectedValue || selectedValue === '';
      });
      
      if (missingOptions.length > 0) {
        toast.error(`กรุณาเลือก ${missingOptions.map(o => o.name).join(', ')} ก่อนเพิ่มลงตะกร้า`);
        return;
      }
      
      // ตรวจสอบว่าตัวเลือกที่เลือกยังมีสินค้าหรือไม่
      for (const option of product.options) {
        const selectedValue = selectedOptions[option.name];
        const optionValue = option.values.find(v => v.label === selectedValue);
        if (optionValue && optionValue.isAvailable === false) {
          toast.error(`ตัวเลือก "${selectedValue}" ของ "${option.name}" หมดแล้ว กรุณาเลือกตัวเลือกอื่น`);
          return;
        }
      }
    }
    
    // ตรวจสอบจำนวนสินค้า
    if (quantity < 1) {
      toast.error('กรุณาเลือกจำนวนสินค้าอย่างน้อย 1 ชิ้น');
      return;
    }
    
    setAddingToCart(true);
    
    try {
      // ใช้ utility function ใหม่
      const success = addToCart(product, quantity, selectedOptions, selectedUnit, selectedPrice);
      
      if (!success) {
        throw new Error('ไม่สามารถบันทึกข้อมูลลงตะกร้าได้');
      }
      
      // แสดง toast แสดงความสำเร็จพร้อมแอนิเมชัน
      toast.success(
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium flex items-center gap-1 text-sm">
              เพิ่มลงตะกร้าสำเร็จ!
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </p>
            <p className="text-xs text-gray-600 truncate">{product.name}</p>
            <p className="text-xs text-gray-500">จำนวน {quantity} ชิ้น</p>
            {selectedUnit && <p className="text-xs text-blue-600">หน่วย: {selectedUnit}</p>}
          </div>
        </div>,
        {
          duration: 3000,
          position: 'bottom-right',
          style: {
            background: '#f0fdf4',
            color: '#16a34a',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '12px',
            maxWidth: '320px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }
      );
      
      // เพิ่มแอนิเมชันการสั่นของปุ่ม
      const button = document.querySelector('.add-to-cart-btn');
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => {
          button.classList.remove('animate-pulse');
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // แสดงข้อความ error ที่เหมาะสมตามประเภทของ error
      let errorMessage = 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า';
      
      if (error instanceof Error) {
        if (error.message.includes('localStorage')) {
          errorMessage = 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
        } else if (error.message.includes('ไม่สามารถบันทึกข้อมูล')) {
          errorMessage = 'ไม่สามารถบันทึกข้อมูลลงตะกร้าได้ กรุณาลองใหม่อีกครั้ง';
        }
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        position: 'bottom-right',
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const isFormValid = () => {
    if (!product) return false;

    // ตรวจสอบว่าสินค้าพร้อมขายหรือไม่
    if (product.isAvailable === false) {
      return false;
    }

    // ตรวจสอบว่าสินค้ามีหน่วยหรือไม่ และต้องเลือกหน่วย
    if (product.units && product.units.length > 0) {
      if (!selectedUnit || selectedUnit === '') {
        return false;
      }
    }

    // ตรวจสอบว่าสินค้ามีตัวเลือกหรือไม่ และต้องเลือกตัวเลือกครบถ้วน
    if (product.options && product.options.length > 0) {
      const missingOptions = product.options.filter(option => {
        const selectedValue = selectedOptions[option.name];
        return !selectedValue || selectedValue === '';
      });
      
      if (missingOptions.length > 0) {
        return false;
      }
      
      // ตรวจสอบว่าตัวเลือกที่เลือกยังมีสินค้าหรือไม่
      for (const option of product.options) {
        const selectedValue = selectedOptions[option.name];
        const optionValue = option.values.find(v => v.label === selectedValue);
        if (optionValue && optionValue.isAvailable === false) {
          return false;
        }
      }
    }

    // ตรวจสอบจำนวนสินค้า
    if (quantity < 1) {
      return false;
    }

    return true;
  };

  const getValidationMessage = () => {
    if (!product) return 'ไม่พบสินค้า';

    if (product.isAvailable === false) {
      return 'สินค้านี้หมดแล้ว ไม่สามารถสั่งซื้อได้';
    }

    if (product.units && product.units.length > 0) {
      if (!selectedUnit || selectedUnit === '') {
        return 'กรุณาเลือกหน่วยสินค้าก่อนเพิ่มลงตะกร้า';
      }
    }

    if (product.options && product.options.length > 0) {
      const missingOptions = product.options.filter(option => {
        const selectedValue = selectedOptions[option.name];
        return !selectedValue || selectedValue === '';
      });
      
      if (missingOptions.length > 0) {
        return `กรุณาเลือก ${missingOptions.map(o => o.name).join(', ')} ก่อนเพิ่มลงตะกร้า`;
      }
      
      for (const option of product.options) {
        const selectedValue = selectedOptions[option.name];
        const optionValue = option.values.find(v => v.label === selectedValue);
        if (optionValue && optionValue.isAvailable === false) {
          return `ตัวเลือก "${selectedValue}" ของ "${option.name}" หมดแล้ว กรุณาเลือกตัวเลือกอื่น`;
        }
      }
    }

    if (quantity < 1) {
      return 'กรุณาเลือกจำนวนสินค้าอย่างน้อย 1 ชิ้น';
    }

    return 'สินค้าพร้อมสั่งซื้อ';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p>กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">{error || 'ไม่พบสินค้า'}</h1>
        <Link href="/shop" className="text-blue-600 underline">กลับหน้าร้าน</Link>
      </div>
    );
  }

  const totalPrice = selectedPrice * quantity;

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden relative">
        {/* ปุ่มปิด */}
        <button
          onClick={() => router.push('/shop')}
          className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200 shadow-lg"
          aria-label="ปิดหน้ารายละเอียดสินค้า"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col lg:flex-row">
          {/* รูปภาพสินค้า - Mobile Enhanced */}
          <div className="lg:w-1/2">
            <div className="relative h-64 sm:h-80 lg:h-full">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          {/* ข้อมูลสินค้า - Mobile Enhanced */}
          <div className="lg:w-1/2 p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{product.name}</h1>
            
            {product.category && (
              <p className="text-sm sm:text-base text-gray-500 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              หมวดหมู่: {product.category}
            </p>
            )}
            
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-4 sm:mb-6 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                              <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  ฿{selectedPrice.toLocaleString()} {selectedUnit !== 'หน่วย' ? `/ ${selectedUnit}` : ''}
                </span>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* เลือกหน่วย */}
            {product.units && product.units.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกหน่วย <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedUnit} 
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !selectedUnit || selectedUnit === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- เลือกหน่วย --</option>
                  {product.units.map((unit) => (
                    <option key={unit.label} value={unit.label}>
                      {unit.label} - ฿{unit.price.toLocaleString()}
                    </option>
                  ))}
                </select>
                {!selectedUnit || selectedUnit === '' ? (
                  <p className="text-sm text-red-500 mt-1">กรุณาเลือกหน่วยสินค้าก่อนเพิ่มลงตะกร้า</p>
                ) : null}
              </div>
            )}

            {/* ตัวเลือกสินค้า */}
            {product.options && product.options.map((option) => (
              <div key={option.name} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {option.name} <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedOptions[option.name] || ''} 
                  onChange={(e) => handleOptionChange(option.name, e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !selectedOptions[option.name] || selectedOptions[option.name] === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- เลือก{option.name} --</option>
                  {option.values.map((value) => (
                    <option key={value.label} value={value.label}>
                      {value.label}
                    </option>
                  ))}
                </select>
                {!selectedOptions[option.name] || selectedOptions[option.name] === '' ? (
                  <p className="text-sm text-red-500 mt-1">กรุณาเลือก {option.name} ก่อนเพิ่มลงตะกร้า</p>
                ) : null}
              </div>
            ))}

            {/* ช่องใส่จำนวน */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวน <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 p-3 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600"
                >
                  +
                </button>
              </div>
              {quantity < 1 ? (
                <p className="text-sm text-red-500 mt-1">กรุณาเลือกจำนวนสินค้าอย่างน้อย 1 ชิ้น</p>
              ) : null}
            </div>

            {/* ราคารวม */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">ราคารวม:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ฿{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ปุ่มเพิ่มลงตะกร้า */}
            <motion.button
              onClick={handleAddToCart}
              disabled={addingToCart || !isFormValid()}
              className={`add-to-cart-btn w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                addingToCart || !isFormValid()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              whileHover={!addingToCart && isFormValid() ? { scale: 1.02 } : {}}
              whileTap={!addingToCart && isFormValid() ? { scale: 0.98 } : {}}
            >
              {addingToCart ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังเพิ่ม...</span>
                </div>
              ) : !isFormValid() ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{getValidationMessage()}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5m6 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                  <span>เพิ่มลงตะกร้า</span>
                </div>
              )}
            </motion.button>

            {/* ปุ่มอื่นๆ */}
            <div className="mt-6 flex space-x-4">
              <Link href="/cart" className="flex-1 text-center bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                ดูตะกร้า
              </Link>
              <Link href="/shop" className="flex-1 text-center bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                กลับหน้าร้าน
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 