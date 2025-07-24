"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category?: string;
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
    }[];
  }[];
}

export default function ProductDetail() {
  const params = useParams();
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
    
    setAddingToCart(true);
    
    try {
      const cartItem = {
        productId: product._id,
        name: product.name,
        price: selectedPrice,
        quantity: quantity,
        selectedOptions: selectedOptions,
        unitLabel: selectedUnit,
        unitPrice: selectedPrice,
      };

      // บันทึกลงตะกร้าใน localStorage สำหรับเว็บไซต์
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingIndex = existingCart.findIndex((item: any) => 
        item.productId === cartItem.productId && 
        item.unitLabel === cartItem.unitLabel &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(cartItem.selectedOptions)
      );

      if (existingIndex > -1) {
        existingCart[existingIndex].quantity += cartItem.quantity;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      alert('เพิ่มสินค้าลงตะกร้าแล้ว!');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า');
    } finally {
      setAddingToCart(false);
    }
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* รูปภาพสินค้า */}
          <div className="md:w-1/2">
            <div className="relative h-96 md:h-full">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          {/* ข้อมูลสินค้า */}
          <div className="md:w-1/2 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {product.category && (
              <p className="text-sm text-gray-500 mb-2">หมวดหมู่: {product.category}</p>
            )}
            
            <div className="text-2xl font-bold text-blue-600 mb-6">
              ฿{selectedPrice.toLocaleString()} {selectedUnit !== 'หน่วย' ? `/ ${selectedUnit}` : ''}
            </div>

            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* เลือกหน่วย */}
            {product.units && product.units.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกหน่วย
                </label>
                <select 
                  value={selectedUnit} 
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {product.units.map((unit) => (
                    <option key={unit.label} value={unit.label}>
                      {unit.label} - ฿{unit.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ตัวเลือกสินค้า */}
            {product.options && product.options.map((option) => (
              <div key={option.name} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {option.name}
                </label>
                <select 
                  value={selectedOptions[option.name] || ''} 
                  onChange={(e) => handleOptionChange(option.name, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {option.values.map((value) => (
                    <option key={value.label} value={value.label}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* ช่องใส่จำนวน */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวน
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
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
                  className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  +
                </button>
              </div>
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
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {addingToCart ? 'กำลังเพิ่ม...' : 'เพิ่มลงตะกร้า'}
            </button>

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
    </div>
  );
} 