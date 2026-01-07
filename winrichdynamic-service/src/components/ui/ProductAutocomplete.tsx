'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Package } from 'lucide-react';
import { cn } from '@/components/ui/cn';

interface Product {
    _id: string;
    name: string;
    sku: string;
    price?: number;
    units?: Array<{
        label: string;
        price: number;
        sku?: string;
    }>;
    category?: string;
    imageUrl?: string;
}

interface ProductAutocompleteProps {
    value?: Product | null;
    onChange: (product: Product | null) => void;
    onProductSelect?: (product: Product) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function ProductAutocomplete({
    value,
    onChange,
    onProductSelect,
    placeholder = 'พิมพ์ชื่อสินค้าหรือรหัส SKU...',
    className,
    disabled = false,
}: ProductAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search products with debounce
    const searchProducts = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setProducts([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `/api/products/search?q=${encodeURIComponent(query)}&limit=10`,
                { credentials: 'include' }
            );
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || data || []);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearch(query);
        setIsOpen(true);

        // Debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            searchProducts(query);
        }, 300);
    };

    // Handle product selection
    const handleSelect = (product: Product) => {
        onChange(product);
        onProductSelect?.(product);
        setSearch('');
        setIsOpen(false);
        setProducts([]);
    };

    // Clear selection
    const handleClear = () => {
        onChange(null);
        setSearch('');
        inputRef.current?.focus();
    };

    // Format price
    const formatPrice = (price?: number) => {
        if (!price) return '-';
        return price.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    };

    // Get display price for product
    const getDisplayPrice = (product: Product) => {
        if (product.price !== undefined) return formatPrice(product.price);
        if (product.units && product.units.length > 0) {
            return formatPrice(product.units[0].price);
        }
        return '-';
    };

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            {/* Input field */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

                {value ? (
                    // Selected product display
                    <div className={cn(
                        'w-full pl-9 pr-10 py-2 border rounded-lg bg-blue-50 flex items-center gap-2',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}>
                        <Package size={16} className="text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{value.name}</div>
                            <div className="text-xs text-gray-500">SKU: {value.sku}</div>
                        </div>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 hover:bg-blue-100 rounded-full"
                            >
                                <X size={14} className="text-gray-500" />
                            </button>
                        )}
                    </div>
                ) : (
                    // Search input
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        onFocus={() => search.length >= 2 && setIsOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            'w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
                            disabled && 'bg-gray-100 cursor-not-allowed'
                        )}
                    />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && !value && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            กำลังค้นหา...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            {search.length < 2 ? 'พิมพ์อย่างน้อย 2 ตัวอักษร' : 'ไม่พบสินค้า'}
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-60">
                            {products.map((product) => (
                                <div
                                    key={product._id}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0"
                                    onClick={() => handleSelect(product)}
                                >
                                    <div className="flex items-start gap-2">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <Package size={16} className="text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{product.name}</div>
                                            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                            {product.category && (
                                                <div className="text-xs text-blue-600">{product.category}</div>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-semibold text-gray-900">
                                                ฿{getDisplayPrice(product)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
