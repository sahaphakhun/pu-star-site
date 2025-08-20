'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
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

	useEffect(() => {
		fetch('/api/products')
			.then((res) => res.json())
			.then((data) => setProducts(Array.isArray(data) ? data : []))
			.catch(() => setProducts([]));
	}, []);

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
			return {
				...prev,
				[product._id]: {
					product,
					quantity: existing ? existing.quantity + quantity : quantity,
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
				return rest;
			}
			return { ...prev, [id]: { product: existing.product, quantity: newQty } };
		});
	};

	const deleteFromCart = (id: string) => {
		setCart((prev) => {
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
	const calculateShippingFee = () => 0;
	const calculateGrandTotal = () => calculateTotal() + calculateShippingFee();

	const handleSubmitOrder = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			const items = Object.values(cart).map((item) => ({
				productId: (item.product as any)._id,
				name: item.product.name,
				price: item.product.price,
				quantity: item.quantity,
			}));
			await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerName,
					customerPhone,
					items,
					shippingFee: calculateShippingFee(),
					discount: 0,
					paymentMethod,
				}),
			});
		} finally {
			setShowOrderForm(false);
			setCart({});
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<ProductList
					products={products}
					categories={['ทั้งหมด']}
					selectedCategory={'ทั้งหมด'}
					setSelectedCategory={() => {}}
					searchTerm={''}
					getQuantityForProduct={getQuantityForProduct}
					setQuantityForProduct={setQuantityForProduct}
					handleProductClick={() => {}}
					handleAddToCart={handleAddToCart}
				/>
			</div>

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


