'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import * as ReactDOM from 'react-dom';
import { ChevronDown, Search, X, List } from 'lucide-react';
import { cn } from '@/components/ui/cn';

export interface SearchableSelectOption {
    value: string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange: (value: string) => void;
    options: SearchableSelectOption[];
    disabled?: boolean;
    emptyMessage?: string;
    className?: string;
    required?: boolean;
}

export default function SearchableSelect({
    label,
    placeholder = 'เลือก...',
    value,
    onChange,
    options,
    disabled = false,
    emptyMessage = 'ไม่พบข้อมูล',
    className,
    required = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [isMounted, setIsMounted] = useState(false);

    // Get selected option label
    const selectedOption = useMemo(() => {
        return options.find(opt => opt.value === value);
    }, [options, value]);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const lowerSearch = search.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearch) ||
            (opt.sublabel && opt.sublabel.toLowerCase().includes(lowerSearch))
        );
    }, [options, search]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Update dropdown position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const dropdownHeight = 320; // max height estimate

            // Determine if dropdown should open upward or downward
            const shouldOpenUpward = spaceBelow < dropdownHeight && rect.top > spaceBelow;

            setDropdownStyle({
                position: 'fixed',
                ...(shouldOpenUpward
                    ? { bottom: viewportHeight - rect.top + 4 }
                    : { top: rect.bottom + 4 }),
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });

            // Focus search input when dropdown opens
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Handle click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

            if (isOutsideTrigger && isOutsideDropdown) {
                setIsOpen(false);
                setSearch('');
            }
        };

        // Use setTimeout to avoid immediate trigger from the click that opened dropdown
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const dropdownContent = isOpen && !disabled && isMounted ? ReactDOM.createPortal(
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border rounded-lg shadow-xl max-h-80 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
            {/* Search input */}
            <div className="p-2 border-b sticky top-0 bg-white z-10">
                <div className="relative">
                    <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="พิมพ์เพื่อค้นหา..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearch('');
                            }}
                            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-64">
                {filteredOptions.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">
                        <List size={24} className="mx-auto mb-2 text-gray-300" />
                        {emptyMessage}
                    </div>
                ) : (
                    filteredOptions.map((option) => {
                        const isSelected = value === option.value;
                        return (
                            <div
                                key={option.value}
                                className={cn(
                                    'px-3 py-2.5 text-sm cursor-pointer transition-all duration-100',
                                    'hover:bg-blue-50 hover:text-blue-700',
                                    isSelected && 'bg-blue-100 text-blue-700 font-medium'
                                )}
                                onClick={() => handleSelect(option.value)}
                            >
                                <div className="font-medium">{option.label}</div>
                                {option.sublabel && (
                                    <div className="text-xs text-gray-500 mt-0.5">{option.sublabel}</div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div
                ref={triggerRef}
                className={cn(
                    'w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-all duration-150',
                    disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'hover:border-blue-400 hover:shadow-sm',
                    isOpen && 'ring-2 ring-blue-500 border-blue-500 shadow-sm'
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-gray-900 truncate flex-1' : 'text-gray-400 truncate flex-1'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-1 ml-2">
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={cn('transition-transform duration-200 text-gray-400', isOpen && 'rotate-180 text-blue-500')} />
                </div>
            </div>
            {dropdownContent}
        </div>
    );
}
