'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import React from 'react';
import { IProduct } from '@/models/Product';

interface ProductWithId extends IProduct { _id: string; }

interface ProductListProps {
	products: ProductWithId[];
	categories: string[];
	selectedCategory: string;
	setSelectedCategory: (cat: string) => void;
	searchTerm: string;
	getQuantityForProduct: (id: string) => number;
	setQuantityForProduct: (id: string, qty: number) => void;
	handleProductClick: (id: string) => void;
	handleAddToCart: (product: ProductWithId, options?: any, unit?: any, quantity?: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({
	products,
	categories,
	selectedCategory,
	setSelectedCategory,
	searchTerm,
	getQuantityForProduct,
	setQuantityForProduct,
	handleProductClick,
	handleAddToCart,
}) => {
	const filtered = (selectedCategory === 'ทั้งหมด'
		? products
		: products.filter((p) => (p.category || 'ทั่วไป') === selectedCategory)
	).filter((product) =>
		searchTerm === '' ||
		product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	return (
		<div className="mb-8">
			{/* Category Filter */}
			<div className="sticky top-16 bg-gray-50 z-10 py-4 mb-6 -mx-4 px-4 shadow-sm border-b">
				<div className="flex overflow-x-auto space-x-3 scrollbar-hide pb-2">
					{categories.map((cat) => (
						<motion.button
							key={cat}
							onClick={() => setSelectedCategory(cat)}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`flex-shrink-0 px-6 py-3 sm:px-4 sm:py-2 rounded-full border text-base sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
								selectedCategory === cat
									? 'bg-blue-600 text-white border-blue-600 shadow-lg'
									: 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
							}`}
						>
							{cat}
						</motion.button>
					))}
				</div>
			</div>

			{/* Products Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
				{filtered.map((product, index) => (
					<motion.div
						key={product._id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: index * 0.1 }}
						whileHover={{ y: -8, scale: 1.02 }}
						className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
					>
						{/* Product Image */}
						<div
							className="relative aspect-square cursor-pointer group"
							onClick={() => handleProductClick(product._id)}
						>
							<Image
								src={product.imageUrl || '/placeholder-image.jpg'}
								alt={product.name}
								fill
								className="object-cover group-hover:scale-110 transition-transform duration-300"
							/>
							{/* Overlay on hover */}
							<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
								<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
								</div>
							</div>
						</div>

						{/* Product Info */}
						<div className="p-4">
							{/* Category Badge */}
							<div className="mb-2">
								<span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
									{product.category || 'ทั่วไป'}
								</span>
							</div>

							{/* Product Name */}
							<h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm md:text-base leading-tight">
								{product.name}
							</h3>

							{/* Product Description */}
							{product.description && (
								<p className="text-gray-600 text-sm mb-3 line-clamp-2">
									{product.description}
								</p>
							)}

							{/* Price */}
							<div className="mb-4">
								<p className="text-blue-600 font-bold text-lg mb-1">
									฿{product.price?.toLocaleString()}
								</p>
								{product.shippingFee && product.shippingFee > 0 && (
									<p className="text-xs text-gray-500">
										ค่าจัดส่ง: ฿{product.shippingFee.toLocaleString()}
									</p>
								)}
							</div>

							{/* Quantity Controls */}
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-2">
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() =>
											setQuantityForProduct(
												product._id,
												getQuantityForProduct(product._id) - 1
											)
										}
										className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
										</svg>
									</motion.button>
									<span className="w-8 text-center text-sm font-medium">
										{getQuantityForProduct(product._id)}
									</span>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() =>
											setQuantityForProduct(
												product._id,
												getQuantityForProduct(product._id) + 1
											)
										}
										className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
									</motion.button>
								</div>
							</div>

							{/* Add to Cart Button */}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() =>
									handleAddToCart(
										product,
										undefined,
										undefined,
										getQuantityForProduct(product._id)
									)
								}
								className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
								</svg>
								<span>เพิ่มลงตะกร้า</span>
							</motion.button>
						</div>
					</motion.div>
				))}
			</div>

			{/* No Products Found */}
			{filtered.length === 0 && (
				<div className="text-center py-12">
					<div className="text-gray-400 mb-4">
						<svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบสินค้าในหมวดหมู่นี้</h3>
					<p className="text-gray-500">ลองเปลี่ยนหมวดหมู่หรือคำค้นหา</p>
				</div>
			)}
		</div>
	);
};

export default ProductList;


