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
	const cartItems = Object.entries(cart);

	return (
		<>
			{/* Floating Cart Button */}
			{getTotalItems() > 0 && (
				<motion.button
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0, opacity: 0 }}
					onClick={() => setShowCart(true)}
					className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-40 transition-all duration-200 hover:scale-110"
				>
					<div className="relative">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
						</svg>
						<motion.span 
							className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							key={getTotalItems()}
						>
							{getTotalItems()}
						</motion.span>
					</div>
				</motion.button>
			)}

			{/* Cart Drawer Modal */}
			<AnimatePresence>
				{showCart && (
					<motion.div
						className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setShowCart(false)}
					>
						<motion.div
							className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
								<div>
									<h3 className="text-xl font-bold">ตะกร้าสินค้า</h3>
									<p className="text-blue-100 text-sm">
										{getTotalItems()} รายการ
									</p>
								</div>
								<motion.button 
									onClick={() => setShowCart(false)}
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									className="p-2 hover:bg-white/20 rounded-full transition-colors"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</motion.button>
							</div>

							{/* Cart Items */}
							<div className="flex-1 overflow-y-auto p-6">
								{cartItems.length === 0 ? (
									<div className="text-center py-12">
										<div className="text-gray-400 mb-4">
											<svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
											</svg>
										</div>
										<h3 className="text-lg font-medium text-gray-900 mb-2">ตะกร้าว่าง</h3>
										<p className="text-gray-500">เพิ่มสินค้าลงตะกร้าเพื่อเริ่มต้น</p>
									</div>
								) : (
									<div className="space-y-4">
										{cartItems.map(([id, item]) => (
											<motion.div
												key={id}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: 20 }}
												className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
											>
												{/* Product Image */}
												<div className="relative w-16 h-16 flex-shrink-0">
													<Image 
														src={item.product.imageUrl || '/placeholder-image.jpg'} 
														alt={item.product.name} 
														fill 
														className="object-cover rounded-lg" 
													/>
												</div>

												{/* Product Info */}
												<div className="flex-1 min-w-0">
													<h4 className="font-medium text-gray-900 truncate">
														{item.product.name}
													</h4>
													<p className="text-sm text-blue-600 font-semibold">
														฿{item.product.price?.toLocaleString()}
													</p>
													{/* Category */}
													<p className="text-xs text-gray-500">
														{item.product.category || 'ทั่วไป'}
													</p>
												</div>

												{/* Quantity Controls */}
												<div className="flex items-center space-x-2">
													<motion.button
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														onClick={() => removeFromCart(id)}
														className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
														</svg>
													</motion.button>
													
													<span className="w-8 text-center text-sm font-medium">
														{item.quantity}
													</span>
													
													<motion.button
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														onClick={() => handleAddToCart(item.product)}
														className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
														</svg>
													</motion.button>
													
													<motion.button
														whileHover={{ scale: 1.1 }}
														whileTap={{ scale: 0.9 }}
														onClick={() => deleteFromCart(id)}
														className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</motion.button>
												</div>
											</motion.div>
										))}
									</div>
								)}
							</div>

							{/* Footer */}
							{cartItems.length > 0 && (
								<div className="border-t border-gray-100 p-6 bg-gray-50">
									{/* Summary */}
									<div className="space-y-3 mb-6">
										<div className="flex justify-between text-sm">
											<span className="text-gray-600">ค่าจัดส่ง:</span>
											<span className="font-medium">
												{calculateShippingFee() === 0 ? 'ฟรี' : `฿${calculateShippingFee().toLocaleString()}`}
											</span>
										</div>
										<div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
											<span>รวมทั้งสิ้น:</span>
											<span className="text-blue-600">฿{calculateGrandTotal().toLocaleString()}</span>
										</div>
									</div>

									{/* Checkout Button */}
									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => {
											setShowCart(false);
											handleShowOrderForm();
										}}
										className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center justify-center space-x-2"
									>
										<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
										</svg>
										<span>ดำเนินการสั่งซื้อ</span>
									</motion.button>
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default CartDrawer;
