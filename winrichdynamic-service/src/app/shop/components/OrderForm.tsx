'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { IProduct } from '@/models/Product';

interface ProductWithId extends IProduct { _id: string; }
interface CartItem { product: ProductWithId; quantity: number; }

interface OrderFormProps {
	showOrderForm: boolean;
	setShowOrderForm: (v: boolean) => void;
	handleSubmitOrder: (e: React.FormEvent<HTMLFormElement>) => void;
	customerName: string;
	setCustomerName: (v: string) => void;
	customerPhone: string;
	setCustomerPhone: (v: string) => void;
	cart: { [id: string]: CartItem };
	calculateTotal: () => number;
	calculateShippingFee: () => number;
	calculateGrandTotal: () => number;
	paymentMethod: 'cod' | 'transfer';
	setPaymentMethod: (m: 'cod' | 'transfer') => void;
}

export default function OrderForm({
	setShowOrderForm,
	handleSubmitOrder,
	customerName,
	setCustomerName,
	customerPhone,
	setCustomerPhone,
	cart,
	calculateTotal,
	calculateShippingFee,
	calculateGrandTotal,
	paymentMethod,
	setPaymentMethod,
}: OrderFormProps) {
	const cartItems = Object.values(cart);

	return (
		<motion.div
			className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={() => setShowOrderForm(false)}
		>
			<motion.div
				className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
				initial={{ scale: 0.9, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.9, opacity: 0, y: 20 }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-2xl font-bold">ข้อมูลการสั่งซื้อ</h3>
							<p className="text-blue-100 text-sm mt-1">กรอกข้อมูลเพื่อดำเนินการสั่งซื้อ</p>
						</div>
						<motion.button 
							onClick={() => setShowOrderForm(false)}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</motion.button>
					</div>
				</div>

				{/* Form Content */}
				<div className="p-6">
					<form onSubmit={handleSubmitOrder} className="space-y-6">
						{/* Customer Information */}
						<div className="bg-gray-50 rounded-xl p-6">
							<h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
								<svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								ข้อมูลลูกค้า
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										ชื่อ-นามสกุล <span className="text-red-500">*</span>
									</label>
									<input 
										value={customerName} 
										onChange={(e) => setCustomerName(e.target.value)} 
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
										placeholder="กรอกชื่อ-นามสกุล"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										เบอร์โทรศัพท์ <span className="text-red-500">*</span>
									</label>
									<input 
										value={customerPhone} 
										onChange={(e) => setCustomerPhone(e.target.value)} 
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
										placeholder="กรอกเบอร์โทรศัพท์"
										required
									/>
								</div>
							</div>
						</div>

						{/* Payment Method */}
						<div className="bg-gray-50 rounded-xl p-6">
							<h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
								<svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
								</svg>
								วิธีการชำระเงิน
							</h4>
							<div className="space-y-3">
								<motion.label 
									className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
										paymentMethod === 'cod' 
											? 'border-blue-500 bg-blue-50' 
											: 'border-gray-200 hover:border-gray-300'
									}`}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									<input 
										type="radio" 
										value="cod" 
										checked={paymentMethod === 'cod'} 
										onChange={() => setPaymentMethod('cod')} 
										className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<div className="font-medium text-gray-900">เก็บเงินปลายทาง (COD)</div>
										<div className="text-sm text-gray-500">ชำระเงินเมื่อได้รับสินค้า</div>
									</div>
								</motion.label>
								
								<motion.label 
									className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
										paymentMethod === 'transfer' 
											? 'border-blue-500 bg-blue-50' 
											: 'border-gray-200 hover:border-gray-300'
									}`}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									<input 
										type="radio" 
										value="transfer" 
										checked={paymentMethod === 'transfer'} 
										onChange={() => setPaymentMethod('transfer')} 
										className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<div className="font-medium text-gray-900">โอนเงินผ่านธนาคาร</div>
										<div className="text-sm text-gray-500">โอนเงินก่อนจัดส่งสินค้า</div>
									</div>
								</motion.label>
							</div>
						</div>

						{/* Order Summary */}
						<div className="bg-gray-50 rounded-xl p-6">
							<h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
								<svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								สรุปคำสั่งซื้อ
							</h4>
							
							{/* Order Items */}
							<div className="space-y-3 mb-6">
								{cartItems.map((item, index) => (
									<motion.div 
										key={index}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 }}
										className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
									>
										<div className="flex-1">
											<div className="font-medium text-gray-900">{item.product.name}</div>
											<div className="text-sm text-gray-500">
												{item.product.category || 'ทั่วไป'} • จำนวน {item.quantity}
											</div>
										</div>
										<div className="text-right">
											<div className="font-semibold text-gray-900">
												฿{((item.product.price || 0) * item.quantity).toLocaleString()}
											</div>
											<div className="text-sm text-gray-500">
												฿{item.product.price?.toLocaleString()} / ชิ้น
											</div>
										</div>
									</motion.div>
								))}
							</div>

							{/* Price Summary */}
							<div className="border-t border-gray-200 pt-4 space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">ยอดสินค้า:</span>
									<span className="font-medium">฿{calculateTotal().toLocaleString()}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">ค่าจัดส่ง:</span>
									<span className="font-medium text-green-600">
										{calculateShippingFee() === 0 ? 'ฟรี' : `฿${calculateShippingFee().toLocaleString()}`}
									</span>
								</div>
								<div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
									<span>ยอดรวมทั้งสิ้น:</span>
									<span className="text-blue-600 text-xl">฿{calculateGrandTotal().toLocaleString()}</span>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex space-x-4 pt-4">
							<motion.button 
								type="button" 
								onClick={() => setShowOrderForm(false)} 
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="flex-1 bg-white text-gray-700 border-2 border-gray-300 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
							>
								ยกเลิก
							</motion.button>
							<motion.button 
								type="submit" 
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
								<span>ยืนยันการสั่งซื้อ</span>
							</motion.button>
						</div>
					</form>
				</div>
			</motion.div>
		</motion.div>
	);
}


