'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { IProduct } from '@/models/Product';

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
	return (
		<>
			{getTotalItems() > 0 && (
				<motion.button
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					onClick={() => setShowCart(true)}
					className="cart-icon fixed bottom-20 md:bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg"
				>
					<div className="relative">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
						</svg>
						<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
							{getTotalItems()}
						</span>
					</div>
				</motion.button>
			)}

			<AnimatePresence>
				{showCart && (
					<motion.div
						className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setShowCart(false)}
					>
						<motion.div
							className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col"
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex justify-between items-center p-4 border-b">
								<h3 className="font-bold">ตะกร้า</h3>
								<button onClick={() => setShowCart(false)}>✕</button>
							</div>
							<div className="p-4 space-y-4 flex-1 overflow-y-auto">
								{Object.entries(cart).map(([id, item]) => (
									<div key={id} className="flex items-center space-x-4">
										<div className="relative w-16 h-16">
											<Image src={item.product.imageUrl || '/placeholder-image.jpg'} alt={item.product.name} fill className="object-cover rounded" />
										</div>
										<div className="flex-1">
											<h4 className="font-medium">{item.product.name}</h4>
											<p className="text-sm text-blue-600">฿{item.product.price?.toLocaleString()}</p>
										</div>
										<div className="flex items-center space-x-2">
											<button onClick={() => removeFromCart(id)} className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">-</button>
											<span className="w-4 text-center text-sm">{item.quantity}</span>
											<button onClick={() => handleAddToCart(item.product)} className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">+</button>
											<button onClick={() => deleteFromCart(id)} className="text-red-500">✕</button>
										</div>
									</div>
								))}
							</div>
							<div className="border-t p-4 space-y-2">
								<div className="flex justify-between text-sm">
									<span>ค่าส่ง</span>
									<span>฿{calculateShippingFee().toLocaleString()}</span>
								</div>
								<div className="flex justify-between text-lg font-semibold">
									<span>รวมทั้งสิ้น</span>
									<span>฿{calculateGrandTotal().toLocaleString()}</span>
								</div>
								<button
									onClick={() => {
										setShowCart(false);
										handleShowOrderForm();
									}}
									className="w-full bg-blue-600 text-white py-2 rounded-md mt-2"
								>
									ดำเนินการสั่งซื้อ
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default CartDrawer;


