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
			<div className="sticky top-16 bg-gray-50 z-10 py-3 mb-4 -mx-4 px-4 shadow-sm">
				<div className="flex overflow-x-auto space-x-3 scrollbar-hide pb-2">
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() => setSelectedCategory(cat)}
							className={`flex-shrink-0 px-6 py-3 sm:px-4 sm:py-2 rounded-full border text-base sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
								selectedCategory === cat
									? 'bg-blue-600 text-white border-blue-600'
									: 'bg-white text-gray-700 border-gray-300'
							}`}
						>
							{cat}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
				{filtered.map((product) => (
					<motion.div
						key={product._id}
						whileHover={{ y: -5 }}
						transition={{ duration: 0.2 }}
						className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl"
					>
						<div
							className="relative aspect-square cursor-pointer"
							onClick={() => handleProductClick(product._id)}
						>
							                                                <Image
                                                    src={product.imageUrl || '/placeholder-image.jpg'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
						</div>
						<div className="p-4">
							<h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm md:text-base">
								{product.name}
							</h3>
							<p className="text-blue-600 font-bold text-lg mb-3 text-sm md:text-base">
								฿{product.price?.toLocaleString()}
							</p>
							<div className="flex items-center space-x-2 mb-3">
								<button
									onClick={() =>
										setQuantityForProduct(
											product._id,
											getQuantityForProduct(product._id) - 1
										)
									}
									className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center"
								>
									-
								</button>
								<span className="w-8 text-center text-sm">
									{getQuantityForProduct(product._id)}
								</span>
								<button
									onClick={() =>
										setQuantityForProduct(
											product._id,
											getQuantityForProduct(product._id) + 1
										)
									}
									className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center"
								>
									+
								</button>
							</div>
							<button
								onClick={() =>
									handleAddToCart(
										product,
										undefined,
										undefined,
										getQuantityForProduct(product._id)
									)
								}
								className="w-full bg-blue-600 text-white py-2 rounded-lg"
							>
								เพิ่มลงตะกร้า
							</button>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
};

export default ProductList;


