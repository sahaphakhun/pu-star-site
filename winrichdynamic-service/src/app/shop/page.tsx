'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { IProduct } from '@/models/Product';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';

interface ProductWithId extends IProduct { _id: string; }
interface CartItem { product: ProductWithId; quantity: number; }

const OrderForm = dynamic(() => import('./components/OrderForm'), { ssr: false });

const ShopPage = () => {
	const [products, setProducts] = useState<ProductWithId[]>([]);
	const [cart, setCart] = useState<{ [id: string]: CartItem }>({});
	const [showCart, setShowCart] = useState(false);
	const [showOrderForm, setShowOrderForm] = useState(false);
	const [quantities, setQuantities] = useState<{ [id: string]: number }>({});
	const [customerName, setCustomerName] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
	const [categories, setCategories] = useState<string[]>(['ทั้งหมด']);
	const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [loading, setLoading] = useState(true);

	// ดึงข้อมูลหมวดหมู่
	useEffect(() => {
		fetch('/api/categories')
			.then((res) => res.json())
			.then((data) => {
				if (data.success && Array.isArray(data.data) && data.data.length > 0) {
					const names = ['ทั้งหมด', ...data.data.map((c: any) => c.name).filter(Boolean)];
					setCategories(Array.from(new Set(names)));
				}
			})
			.catch((error) => {
				console.error('Error fetching categories:', error);
			});
	}, []);

	// ดึงข้อมูลสินค้า
	useEffect(() => {
		setLoading(true);
		const params = new URLSearchParams();
		if (selectedCategory && selectedCategory !== 'ทั้งหมด') params.set('category', selectedCategory);
		if (searchTerm) params.set('search', searchTerm);
		params.set('isAvailable', 'true'); // แสดงเฉพาะสินค้าที่มีในสต็อก

		fetch('/api/products' + (params.toString() ? `?${params.toString()}` : ''))
			.then((res) => res.json())
			.then((data) => {
				if (data.success && Array.isArray(data.data)) {
					setProducts(data.data);
				} else if (Array.isArray(data)) {
					setProducts(data);
				} else {
					setProducts([]);
				}
			})
			.catch((error) => {
				console.error('Error fetching products:', error);
				setProducts([]);
				toast.error('เกิดข้อผิดพลาดในการโหลดสินค้า');
			})
			.finally(() => {
				setLoading(false);
			});
	}, [selectedCategory, searchTerm]);

	const getQuantityForProduct = (id: string) => quantities[id] || 1;
	const setQuantityForProduct = (id: string, qty: number) =>
		setQuantities((prev) => ({ ...prev, [id]: Math.max(1, qty) }));

	const handleAddToCart = (
		product: ProductWithId,
		_options?: any,
		_unit?: any,
		quantity: number = 1
	) => {
		setCart((prev) => {
			const existing = prev[product._id];
			const newQuantity = existing ? existing.quantity + quantity : quantity;
			
			toast.success(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`);
			
			return {
				...prev,
				[product._id]: {
					product,
					quantity: newQuantity,
				},
			};
		});
	};

	const removeFromCart = (id: string) => {
		setCart((prev) => {
			const existing = prev[id];
			if (!existing) return prev;
			const newQty = existing.quantity - 1;
			if (newQty <= 0) {
				const { [id]: _, ...rest } = prev;
				toast.success(`ลบ ${existing.product.name} ออกจากตะกร้าแล้ว`);
				return rest;
			}
			return { ...prev, [id]: { product: existing.product, quantity: newQty } };
		});
	};

	const deleteFromCart = (id: string) => {
		setCart((prev) => {
			const existing = prev[id];
			if (existing) {
				toast.success(`ลบ ${existing.product.name} ออกจากตะกร้าแล้ว`);
			}
			const { [id]: _, ...rest } = prev;
			return rest;
		});
	};

	const getTotalItems = () =>
		Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
	
	const calculateTotal = () =>
		Object.values(cart).reduce(
			(sum, item) => sum + (item.product.price || 0) * item.quantity,
			0
		);
	
	const calculateShippingFee = () => 0; // ฟรีค่าจัดส่งสำหรับ B2B
	const calculateGrandTotal = () => calculateTotal() + calculateShippingFee();

	const handleSubmitOrder = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		if (!customerName.trim() || !customerPhone.trim()) {
			toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
			return;
		}

		try {
			const items = Object.values(cart).map((item) => ({
				productId: item.product._id,
				name: item.product.name,
				price: item.product.price,
				quantity: item.quantity,
			}));

			const res = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerName: customerName.trim(),
					customerPhone: customerPhone.trim(),
					items,
					shippingFee: calculateShippingFee(),
					discount: 0,
					paymentMethod,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				toast.error(errorData.error || 'สั่งซื้อไม่สำเร็จ');
			} else {
				toast.success('สั่งซื้อสำเร็จ! เราจะติดต่อกลับในเร็วๆ นี้');
				setShowOrderForm(false);
				setCart({});
				setCustomerName('');
				setCustomerPhone('');
				setPaymentMethod('cod');
			}
		} catch (error) {
			console.error('Error submitting order:', error);
			toast.error('เกิดข้อผิดพลาดในการสั่งซื้อ');
		}
	};

	const clearCart = () => {
		setCart({});
		toast.success('ล้างตะกร้าแล้ว');
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow-sm border-b">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">ร้านค้า B2B</h1>
							<p className="text-gray-600">สินค้าคุณภาพสำหรับธุรกิจ</p>
						</div>
						<div className="flex items-center space-x-4">
							{getTotalItems() > 0 && (
								<button
									onClick={clearCart}
									className="text-sm text-gray-500 hover:text-red-600 transition-colors"
								>
									ล้างตะกร้า
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-8">
				{/* Search Bar */}
				<div className="mb-6">
					<div className="relative">
						<input
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="ค้นหาสินค้า..."
							className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
					</div>
				</div>

				{/* Loading State */}
				{loading && (
					<div className="flex justify-center items-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					</div>
				)}

				{/* Product List */}
				{!loading && (
					<ProductList
						products={products}
						categories={categories}
						selectedCategory={selectedCategory}
						setSelectedCategory={setSelectedCategory}
						searchTerm={searchTerm}
						getQuantityForProduct={getQuantityForProduct}
						setQuantityForProduct={setQuantityForProduct}
						handleProductClick={() => {}}
						handleAddToCart={handleAddToCart}
					/>
				)}

				{/* Empty State */}
				{!loading && products.length === 0 && (
					<div className="text-center py-12">
						<div className="text-gray-400 mb-4">
							<svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบสินค้า</h3>
						<p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
					</div>
				)}
			</div>

			{/* Cart Drawer */}
			<CartDrawer
				cart={cart}
				showCart={showCart}
				setShowCart={setShowCart}
				removeFromCart={removeFromCart}
				handleAddToCart={handleAddToCart}
				deleteFromCart={deleteFromCart}
				calculateShippingFee={calculateShippingFee}
				calculateGrandTotal={calculateGrandTotal}
				getTotalItems={getTotalItems}
				handleShowOrderForm={() => setShowOrderForm(true)}
			/>

			{/* Order Form */}
			{showOrderForm && (
				<OrderForm
					showOrderForm={showOrderForm}
					setShowOrderForm={setShowOrderForm}
					handleSubmitOrder={handleSubmitOrder}
					customerName={customerName}
					setCustomerName={setCustomerName}
					customerPhone={customerPhone}
					setCustomerPhone={setCustomerPhone}
					cart={cart}
					calculateTotal={calculateTotal}
					calculateShippingFee={calculateShippingFee}
					calculateGrandTotal={calculateGrandTotal}
					paymentMethod={paymentMethod}
					setPaymentMethod={setPaymentMethod}
				/>
			)}
		</div>
	);
};

export default ShopPage;


