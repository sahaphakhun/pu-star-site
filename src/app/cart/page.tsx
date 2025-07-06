"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
  unitPrice?: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        setCart(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    updateCart(newCart);
  };

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
  };

  const clearCart = () => {
    if (confirm('คุณต้องการล้างตะกร้าสินค้าทั้งหมดหรือไม่?')) {
      updateCart([]);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p>กำลังโหลดตะกร้าสินค้า...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">ตะกร้าสินค้า</h1>
          {cart.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {getTotalItems()} รายการ
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {cart.length === 0 ? (
          /* ตะกร้าว่าง */
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 11-4 0v-5m4 0V9a2 2 0 10-4 0v4.01" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ตะกร้าสินค้าว่าง</h2>
            <p className="text-gray-500 mb-6">ยังไม่มีสินค้าในตะกร้า เลือกสินค้าที่ต้องการซื้อได้เลย</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          /* มีสินค้าในตะกร้า */
          <div className="space-y-6">
            {/* รายการสินค้า */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">รายการสินค้า</h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    ล้างตะกร้า
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {cart.map((item, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* รูปภาพสินค้า (placeholder) */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        
                        {/* ตัวเลือกสินค้า */}
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            {Object.entries(item.selectedOptions).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* หน่วย */}
                        {item.unitLabel && item.unitLabel !== 'หน่วย' && (
                          <div className="mt-1 text-xs text-gray-500">
                            หน่วย: {item.unitLabel}
                          </div>
                        )}

                        {/* ราคา */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">
                            ฿{item.price.toLocaleString()}
                          </div>
                          
                          {/* ปุ่มปรับจำนวน */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* ราคารวมและปุ่มลบ */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm font-bold text-blue-600">
                            รวม: ฿{(item.price * item.quantity).toLocaleString()}
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* สรุปยอดรวม */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปคำสั่งซื้อ</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">จำนวนสินค้า</span>
                  <span className="font-medium">{getTotalItems()} รายการ</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ราคารวม</span>
                  <span className="font-medium">฿{getTotalPrice().toLocaleString()}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>ยอดรวมทั้งหมด</span>
                    <span className="text-blue-600">฿{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ปุ่มยืนยันคำสั่งซื้อ - Fixed Bottom Bar สำหรับมือถือ */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 md:relative md:bg-transparent md:border-0 md:shadow-none md:p-0 md:mt-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 text-center bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                เลือกซื้อเพิ่ม
              </Link>
              <button
                onClick={() => alert('ฟีเจอร์ชำระเงินจะเพิ่มในอนาคต')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                ยืนยันคำสั่งซื้อ (฿{getTotalPrice().toLocaleString()})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* เพิ่มพื้นที่ด้านล่างสำหรับมือถือ เพื่อให้เนื้อหาไม่ถูกปุ่มบัง */}
      {cart.length > 0 && (
        <div className="h-20 md:h-0"></div>
      )}
    </div>
  );
} 