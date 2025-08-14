"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AddressForm from "@/components/AddressForm";
import DeliveryMethodSelector, { DeliveryMethod } from "@/components/DeliveryMethodSelector";
import { DeliveryLocation } from "@/schemas/order";

// Address interface for the new format
interface Address {
  _id?: string;
  label: string;
  name: string;
  phone: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  houseNumber: string;
  lane: string;
  moo: string;
  road: string;
  isDefault: boolean;
}

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
    customerAddress: {
      label: '',
      name: '',
      phone: '',
      province: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      houseNumber: '',
      lane: '',
      moo: '',
      road: '',
      isDefault: false
    } as Address,
    paymentMethod: 'cod' as 'cod' | 'transfer',
    deliveryMethod: 'standard' as DeliveryMethod,
    deliveryLocation: undefined as DeliveryLocation | undefined,
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
    // ตรวจสอบข้อมูลที่จำเป็นให้เข้มงวดขึ้น
    if (!orderForm.customerAddress.name || !orderForm.customerAddress.name.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!orderForm.customerAddress.phone || !orderForm.customerAddress.phone.trim()) {
      alert('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!orderForm.customerAddress.province || !orderForm.customerAddress.province.trim()) {
      alert('กรุณากรอกจังหวัด');
      return;
    }
    if (!orderForm.customerAddress.houseNumber || !orderForm.customerAddress.houseNumber.trim()) {
      alert('กรุณากรอกบ้านเลขที่');
      return;
    }
    
    // ตรวจสอบว่าชื่อไม่ใช่ค่าเริ่มต้นที่ไม่เหมาะสม
    if (orderForm.customerAddress.name.trim() === 'ลูกค้า' || orderForm.customerAddress.name.trim() === '') {
      alert('กรุณากรอกชื่อจริง ไม่ใช่ชื่อทั่วไป');
      return;
    }

    // Helper function to format address for API
    const formatAddressForAPI = (address: Address): string => {
      const parts = [
        address.houseNumber,
        address.lane ? `ซ.${address.lane}` : '',
        address.moo ? `หมู่ ${address.moo}` : '',
        address.road ? `ถ.${address.road}` : '',
        address.subDistrict ? `ต.${address.subDistrict}` : '',
        address.district ? `อ.${address.district}` : '',
        address.province,
        address.postalCode
      ].filter(Boolean);
      return parts.join(' ');
    };

    // Validate address - check if essential fields are filled
    const isAddressValid = (address: Address): boolean => {
      return !!(
        address.name && 
        address.name.trim() && 
        address.phone && 
        address.phone.trim() && 
        address.province && 
        address.province.trim() && 
        address.houseNumber && 
        address.houseNumber.trim()
      );
    };

    if (!isAddressValid(orderForm.customerAddress)) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน:\n- ชื่อ-นามสกุล\n- เบอร์โทรศัพท์\n- จังหวัด\n- บ้านเลขที่');
      return;
    }

    setSubmitting(true);
    try {
      // ดึงข้อมูล user ปัจจุบัน (ถ้ามี)
      let currentUser = null;
      try {
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            currentUser = userData.user;
          }
        }
      } catch (error) {
        console.log('ไม่สามารถดึงข้อมูล user ได้:', error);
      }

      const orderData = {
        customerName: orderForm.customerAddress.name,
        customerPhone: orderForm.customerAddress.phone,
        customerAddress: formatAddressForAPI(orderForm.customerAddress),
        paymentMethod: orderForm.paymentMethod,
        deliveryMethod: orderForm.deliveryMethod,
        ...(orderForm.deliveryLocation && { deliveryLocation: orderForm.deliveryLocation }),
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
        discount: orderForm.discount,
        // เพิ่มข้อมูล orderedBy เพื่อบันทึกข้อมูลผู้สั่งซื้อ
        ...(currentUser && {
          orderedBy: {
            userId: currentUser._id,
            name: currentUser.name || orderForm.customerAddress.name,
            phone: currentUser.phoneNumber || orderForm.customerAddress.phone
          }
        })
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
          customerAddress: {
            label: '',
            name: '',
            phone: '',
            province: '',
            district: '',
            subDistrict: '',
            postalCode: '',
            houseNumber: '',
            lane: '',
            moo: '',
            road: '',
            isDefault: false
          },
          paymentMethod: 'cod',
          deliveryMethod: 'standard',
          deliveryLocation: undefined,
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
      <div className="max-w-4xl mx-auto px-4 py-6">        
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          ตะกร้าสินค้า
        </h1>
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
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                ล้างทั้งหมด
              </button>
            )}
          </div>
        </div>
        {cart.length === 0 ? (
          /* ตะกร้าว่าง - Mobile Enhanced */
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center mx-4 sm:mx-0">
            <div className="text-gray-400 mb-6">
              <div className="text-gray-400 mb-4">
          <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </div>
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
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
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
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>หมายเหตุ:</strong> ข้อมูลชื่อและเบอร์โทรศัพท์จะถูกดึงมาจากฟอร์มที่อยู่ด้านล่าง
                    </p>
                  </div>
                </div>

                {/* Address Form */}
                <div>
                  <AddressForm
                    onAddressChange={(address) => setOrderForm({
                      ...orderForm, 
                      customerAddress: address
                    })}
                    initialAddress={orderForm.customerAddress}
                  />
                </div>

                {/* Delivery Method */}
                <div>
                  <DeliveryMethodSelector
                    selectedMethod={orderForm.deliveryMethod}
                    deliveryLocation={orderForm.deliveryLocation}
                    onMethodChange={(method) => setOrderForm({
                      ...orderForm,
                      deliveryMethod: method
                    })}
                    onLocationChange={(location) => setOrderForm({
                      ...orderForm,
                      deliveryLocation: location
                    })}
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
                  
                  {/* ข้อมูลลูกค้า */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>ชื่อ:</strong> {orderForm.customerAddress.name || 'ยังไม่ได้กรอก'}</div>
                      <div><strong>เบอร์โทร:</strong> {orderForm.customerAddress.phone || 'ยังไม่ได้กรอก'}</div>
                      <div><strong>ที่อยู่:</strong> {orderForm.customerAddress.houseNumber ? 
                        `${orderForm.customerAddress.houseNumber} ${orderForm.customerAddress.lane ? `ซ.${orderForm.customerAddress.lane}` : ''} ${orderForm.customerAddress.moo ? `หมู่ ${orderForm.customerAddress.moo}` : ''} ${orderForm.customerAddress.road ? `ถ.${orderForm.customerAddress.road}` : ''} ${orderForm.customerAddress.subDistrict ? `ต.${orderForm.customerAddress.subDistrict}` : ''} ${orderForm.customerAddress.district ? `อ.${orderForm.customerAddress.district}` : ''} ${orderForm.customerAddress.province} ${orderForm.customerAddress.postalCode}` : 'ยังไม่ได้กรอก'}</div>
                    </div>
                  </div>
                  
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