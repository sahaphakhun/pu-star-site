'use client';

import React from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
} from '@/components/ui/AppModal';

interface ProductWithId extends IProduct { _id: string; }
interface CartItem { product: ProductWithId; quantity: number; }

interface CartDrawerProps {
  cart: { [id: string]: CartItem };
  showCart: boolean;
  setShowCart: (v: boolean) => void;
  removeFromCart: (id: string) => void;
  handleAddToCart: (product: ProductWithId) => void;
  deleteFromCart: (id: string) => void;
  calculateShippingFee: () => number;
  calculateGrandTotal: () => number;
  getTotalItems: () => number;
  handleShowOrderForm: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  cart,
  showCart,
  setShowCart,
  removeFromCart,
  handleAddToCart,
  deleteFromCart,
  calculateShippingFee,
  calculateGrandTotal,
  getTotalItems,
  handleShowOrderForm,
}) => {
  const cartItems = Object.entries(cart);

  return (
    <>
      {getTotalItems() > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-blue-600 p-4 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:scale-110"
        >
          <div className="relative">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
            </svg>
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {getTotalItems()}
            </span>
          </div>
        </button>
      )}

      {showCart && (
        <AppModal open onOpenChange={(open) => !open && setShowCart(false)}>
          <AppModalContent size="md" align="screen">
            <AppModalHeader>
              <AppModalTitle>ตะกร้าสินค้า</AppModalTitle>
              <p className="text-sm text-slate-500">{getTotalItems()} รายการ</p>
            </AppModalHeader>
            <AppModalBody>
              {cartItems.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mb-4 text-gray-400">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">ตะกร้าว่าง</h3>
                  <p className="text-gray-500">เพิ่มสินค้าลงตะกร้าเพื่อเริ่มต้น</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(([id, item]) => (
                    <div key={id} className="flex items-center space-x-4 rounded-lg bg-gray-50 p-4">
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={item.product.imageUrl || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate font-medium text-gray-900">
                          {item.product.name}
                        </h4>
                        <p className="text-sm font-semibold text-blue-600">
                          ฿{item.product.price?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.product.category || 'ทั่วไป'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="min-w-[32px] text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleAddToCart(item.product)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => deleteFromCart(id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </AppModalBody>
            {cartItems.length > 0 && (
              <AppModalFooter className="flex-col items-stretch">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ค่าจัดส่ง:</span>
                    <span className="font-medium">
                      {calculateShippingFee() === 0 ? 'ฟรี' : `฿${calculateShippingFee().toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-bold text-gray-900">
                    <span>รวมทั้งสิ้น:</span>
                    <span className="text-blue-600">฿{calculateGrandTotal().toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    handleShowOrderForm();
                  }}
                  className="mt-4 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>ดำเนินการสั่งซื้อ</span>
                  </div>
                </button>
              </AppModalFooter>
            )}
          </AppModalContent>
        </AppModal>
      )}
    </>
  );
};

export default CartDrawer;
