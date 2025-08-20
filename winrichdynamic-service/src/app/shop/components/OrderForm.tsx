'use client';

import React from 'react';
import { IProduct } from '@/models/Product';

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

const OrderForm: React.FC<OrderFormProps> = ({
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
}) => {
	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
			onClick={() => setShowOrderForm(false)}
		>
			<div
				className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-xl font-bold">ข้อมูลการสั่งซื้อ</h3>
					<button onClick={() => setShowOrderForm(false)} className="p-2">
						✕
					</button>
				</div>
				<form onSubmit={handleSubmitOrder} className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
						<input
							value={customerName}
							onChange={(e) => setCustomerName(e.target.value)}
							className="w-full border px-3 py-2 rounded"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
						<input
							value={customerPhone}
							onChange={(e) => setCustomerPhone(e.target.value)}
							className="w-full border px-3 py-2 rounded"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-2">วิธีการชำระเงิน</label>
						<div className="space-y-2">
							<label className="flex items-center">
								<input
									type="radio"
									value="cod"
									checked={paymentMethod === 'cod'}
									onChange={() => setPaymentMethod('cod')}
									className="mr-2"
								/>
								เก็บเงินปลายทาง
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="transfer"
									checked={paymentMethod === 'transfer'}
									onChange={() => setPaymentMethod('transfer')}
									className="mr-2"
								/>
								โอนเงินผ่านธนาคาร
							</label>
						</div>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-medium mb-2">สรุปคำสั่งซื้อ</h4>
						<div className="space-y-1 text-sm">
							{Object.values(cart).map((item, index) => (
								<div key={index} className="flex justify-between">
									<span>
										{item.product.name} x{item.quantity}
									</span>
									<span>
										฿{((item.product.price || 0) * item.quantity).toLocaleString()}
									</span>
								</div>
							))}
						</div>
						<div className="border-t pt-2 mt-2 space-y-1 text-sm">
							<div className="flex justify-between">
								<span>ยอดสินค้า:</span>
								<span>฿{calculateTotal().toLocaleString()}</span>
							</div>
							<div className="flex justify-between">
								<span>ค่าจัดส่ง:</span>
								<span>
									{calculateShippingFee() === 0
										? 'ฟรี'
										: `฿${calculateShippingFee().toLocaleString()}`}
								</span>
							</div>
							<div className="flex justify-between font-bold text;base pt-1 border-t">
								<span>ยอดรวม:</span>
								<span className="text-blue-600">
									฿{calculateGrandTotal().toLocaleString()}
								</span>
							</div>
						</div>
					<div className="flex space-x-3">
						<button
							type="button"
							onClick={() => setShowOrderForm(false)}
							className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-lg"
						>
							ยกเลิก
						</button>
						<button
							type="submit"
							className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
						>
							ยืนยัน
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default OrderForm;


