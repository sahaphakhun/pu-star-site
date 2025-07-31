"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AddressForm from "@/components/AddressForm";

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
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'cod' as 'cod' | 'transfer',
    shippingFee: 0,
    discount: 0
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmitOrder = async () => {
    if (!orderForm.customerName.trim()) {
      alert('กรุณากรอกชื่อ');
      return;
    }
    if (!orderForm.customerPhone.trim()) {
      alert('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!orderForm.customerAddress.trim()) {
      alert('กรุณากรอกที่อยู่');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        paymentMethod: orderForm.paymentMethod,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice
        })),
        totalAmount: getTotalPrice() + orderForm.shippingFee - orderForm.discount,
        shippingFee: orderForm.shippingFee,
        discount: orderForm.discount
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('สั่งซื้อสำเร็จ! หมายเลขคำสั่งซื้อ: ' + result._id.slice(-8).toUpperCase());
        updateCart([]);
        setShowCheckout(false);
        setOrderForm({
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          paymentMethod: 'cod',
          shippingFee: 0,
          discount: 0
        });
      } else {
        const error = await response.json();
        alert('เกิดข้อผิดพลาด: ' + (error.error || 'ไม่สามารถสั่งซื้อได้'));
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ');
    } finally {
      setSubmitting(false);
    }
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
      {/* Header - Mobile Enhanced */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🛒 ตะกร้าสินค้า</h1>
              {cart.length > 0 && (
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  {getTotalItems()} รายการ • ฿{getTotalPrice().toLocaleString()}
                </p>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                🗑️ ล้างทั้งหมด
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {cart.length === 0 ? (
          /* ตะกร้าว่าง - Mobile Enhanced */
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center mx-4 sm:mx-0">
            <div className="text-gray-400 mb-6">
              <div className="text-6xl sm:text-8xl mb-4">🛒</div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">ตะกร้าสินค้าว่าง</h2>
            <p className="text-base sm:text-lg text-gray-500 mb-8 leading-relaxed">
              ยังไม่มีสินค้าในตะกร้า<br className="sm:hidden" />
              เลือกสินค้าที่ต้องการซื้อได้เลย
            </p>
            <Link
              href="/shop"
              className="inline-block bg-blue-600 text-white px-8 py-4 sm:px-6 sm:py-3 rounded-xl font-semibold text-lg sm:text-base hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
            >
              🏪 เลือกซื้อสินค้า
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
                  <div key={`${item.productId}-${index}-${item.quantity}`} className="p-4">
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
      {!loading && cart && cart.length > 0 && (
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
                onClick={() => setShowCheckout(true)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                ยืนยันคำสั่งซื้อ (฿{getTotalPrice().toLocaleString()})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* เพิ่มพื้นที่ด้านล่างสำหรับมือถือ เพื่อให้เนื้อหาไม่ถูกปุ่มบัง */}
      {!loading && cart && cart.length > 0 && (
        <div className="h-20 md:h-0"></div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">ยืนยันคำสั่งซื้อ</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">ข้อมูลลูกค้า</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อ-นามสกุล
                      </label>
                      <input
                        type="text"
                        value={orderForm.customerName}
                        onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="กรอกชื่อ-นามสกุล"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        value={orderForm.customerPhone}
                        onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="กรอกเบอร์โทรศัพท์"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Form */}
                <div>
                  <AddressForm
                    onAddressChange={(address) => setOrderForm({...orderForm, customerAddress: address})}
                    initialAddress={orderForm.customerAddress}
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">วิธีการชำระเงิน</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={orderForm.paymentMethod === 'cod'}
                        onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value as 'cod' | 'transfer'})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">
                        เก็บเงินปลายทาง (COD)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="transfer"
                        name="paymentMethod"
                        value="transfer"
                        checked={orderForm.paymentMethod === 'transfer'}
                        onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value as 'cod' | 'transfer'})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="transfer" className="ml-3 block text-sm font-medium text-gray-700">
                        โอนเงินผ่านธนาคาร
                      </label>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">สรุปคำสั่งซื้อ</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ราคาสินค้า</span>
                      <span>฿{getTotalPrice().toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ค่าจัดส่ง</span>
                      <span>฿{orderForm.shippingFee.toLocaleString()}</span>
                    </div>
                    
                    {orderForm.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>ส่วนลด</span>
                        <span>-฿{orderForm.discount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>ยอดรวมทั้งหมด</span>
                        <span className="text-blue-600">
                          ฿{(getTotalPrice() + orderForm.shippingFee - orderForm.discount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    disabled={submitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'กำลังสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 