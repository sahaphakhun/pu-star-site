'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as ReactDOM from 'react-dom';
import { ChevronDown, Search, X, MapPin } from 'lucide-react';
import {
    provinces,
    getDistrictsByProvince,
    getSubdistrictsByDistrict,
    searchProvinces,
    searchDistricts,
    searchSubdistricts,
    getProvinceByName,
    getDistrictById,
    getProvinceById,
    Province,
    District,
    Subdistrict
} from '@/data/thaiAddressData';
import { cn } from '@/components/ui/cn';

interface AddressAutocompleteProps {
    value?: {
        province?: string;
        district?: string;
        subdistrict?: string;
        zipcode?: string;
    };
    onChange: (address: {
        province: string;
        district: string;
        subdistrict: string;
        zipcode: string;
    }) => void;
    showSubdistrict?: boolean;
    showZipcode?: boolean;
    className?: string;
}

interface DropdownState {
    isOpen: boolean;
    search: string;
}

// Standalone Dropdown component - ย้ายออกมานอก AddressAutocomplete เพื่อป้องกัน re-create
interface DropdownProps<T> {
    label: string;
    placeholder: string;
    selectedValue?: string;
    isOpen: boolean;
    search: string;
    onToggle: () => void;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    items: T[];
    onSelect: (item: T) => void;
    disabled?: boolean;
    getItemLabel: (item: T) => string;
    getItemKey: (item: T) => string | number;
    renderItem?: (item: T) => React.ReactNode;
    emptyMessage?: string;
}

function AddressDropdown<T>({
    label,
    placeholder,
    selectedValue,
    isOpen,
    search,
    onToggle,
    onSearchChange,
    onClearSearch,
    items,
    onSelect,
    disabled = false,
    getItemLabel,
    getItemKey,
    renderItem,
    emptyMessage = 'ไม่พบข้อมูล',
}: DropdownProps<T>) {
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Update dropdown position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const dropdownHeight = 300; // max height estimate

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
                onToggle();
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
    }, [isOpen, onToggle]);

    const handleItemClick = (item: T) => {
        onSelect(item);
    };

    const dropdownContent = isOpen && !disabled && isMounted ? ReactDOM.createPortal(
        <div
            ref={dropdownRef}
            data-address-dropdown
            style={dropdownStyle}
            className="bg-white border rounded-lg shadow-xl max-h-72 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
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
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-8 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearSearch();
                            }}
                            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-56">
                {items.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">
                        <MapPin size={24} className="mx-auto mb-2 text-gray-300" />
                        {emptyMessage}
                    </div>
                ) : (
                    items.map((item) => {
                        const itemLabel = getItemLabel(item);
                        const isSelected = selectedValue === itemLabel;
                        return (
                            <div
                                key={getItemKey(item)}
                                className={cn(
                                    'px-3 py-2.5 text-sm cursor-pointer transition-all duration-100',
                                    'hover:bg-blue-50 hover:text-blue-700',
                                    isSelected && 'bg-blue-100 text-blue-700 font-medium'
                                )}
                                onClick={() => handleItemClick(item)}
                            >
                                {renderItem ? renderItem(item) : itemLabel}
                            </div>
                        );
                    })
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div
                ref={triggerRef}
                className={cn(
                    'w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-all duration-150',
                    disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'hover:border-blue-400 hover:shadow-sm',
                    isOpen && 'ring-2 ring-blue-500 border-blue-500 shadow-sm'
                )}
                onClick={() => !disabled && onToggle()}
            >
                <span className={selectedValue ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedValue || placeholder}
                </span>
                <ChevronDown size={16} className={cn('transition-transform duration-200 text-gray-400', isOpen && 'rotate-180 text-blue-500')} />
            </div>
            {dropdownContent}
        </div>
    );
}

export default function AddressAutocomplete({
    value = {},
    onChange,
    showSubdistrict = true,
    showZipcode = true,
    className,
}: AddressAutocompleteProps) {
    // State for dropdowns
    const [provinceState, setProvinceState] = useState<DropdownState>({ isOpen: false, search: '' });
    const [districtState, setDistrictState] = useState<DropdownState>({ isOpen: false, search: '' });
    const [subdistrictState, setSubdistrictState] = useState<DropdownState>({ isOpen: false, search: '' });
    const [zipcodeState, setZipcodeState] = useState<DropdownState>({ isOpen: false, search: '' });

    // Get selected province ID
    const selectedProvince = useMemo(() => {
        return getProvinceByName(value.province || '');
    }, [value.province]);

    // Get districts for selected province
    const availableDistricts = useMemo(() => {
        if (!selectedProvince) return [];
        return getDistrictsByProvince(selectedProvince.id);
    }, [selectedProvince]);

    // Get selected district
    const selectedDistrict = useMemo(() => {
        return availableDistricts.find(d => d.name === value.district);
    }, [availableDistricts, value.district]);

    // Get subdistricts for selected district
    const availableSubdistricts = useMemo(() => {
        if (!selectedDistrict) return [];
        return getSubdistrictsByDistrict(selectedDistrict.id);
    }, [selectedDistrict]);

    // Filtered provinces for search - แสดงทั้งหมดถ้าไม่ได้พิมพ์ค้นหา
    const filteredProvinces = useMemo(() => {
        if (!provinceState.search.trim()) return provinces;
        return searchProvinces(provinceState.search);
    }, [provinceState.search]);

    // Filtered districts for search - แสดงทั้งหมดถ้าไม่ได้พิมพ์ค้นหา
    const filteredDistricts = useMemo(() => {
        if (!districtState.search.trim()) return availableDistricts;
        return searchDistricts(districtState.search, selectedProvince?.id);
    }, [districtState.search, availableDistricts, selectedProvince?.id]);

    // Filtered subdistricts for search - แสดงทั้งหมดถ้าไม่ได้พิมพ์ค้นหา
    const filteredSubdistricts = useMemo(() => {
        if (!subdistrictState.search.trim()) return availableSubdistricts;
        return searchSubdistricts(subdistrictState.search, selectedDistrict?.id);
    }, [subdistrictState.search, availableSubdistricts, selectedDistrict?.id]);

    // Filtered zipcode results
    const filteredZipResults = useMemo(() => {
        if (!zipcodeState.search || zipcodeState.search.length < 2) return [];
        return searchSubdistricts(zipcodeState.search).slice(0, 50);
    }, [zipcodeState.search]);

    useEffect(() => {
        if (value.zipcode !== undefined && value.zipcode !== zipcodeState.search) {
            setZipcodeState(prev => ({ ...prev, search: value.zipcode || '' }));
        }
    }, [value.zipcode, zipcodeState.search]);

    // Close all other dropdowns when one opens
    const closeAllDropdowns = useCallback(() => {
        setProvinceState(prev => ({ ...prev, isOpen: false }));
        setDistrictState(prev => ({ ...prev, isOpen: false }));
        setSubdistrictState(prev => ({ ...prev, isOpen: false }));
        setZipcodeState(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Handle province selection
    const handleProvinceSelect = useCallback((province: Province) => {
        onChange({
            province: province.name,
            district: '',
            subdistrict: '',
            zipcode: '',
        });
        setProvinceState({ isOpen: false, search: '' });
        // Auto open district dropdown
        setTimeout(() => {
            setDistrictState({ isOpen: true, search: '' });
        }, 100);
    }, [onChange]);

    // Handle district selection
    const handleDistrictSelect = useCallback((district: District) => {
        onChange({
            province: value.province || '',
            district: district.name,
            subdistrict: '',
            zipcode: '',
        });
        setDistrictState({ isOpen: false, search: '' });
        // Auto open subdistrict dropdown if enabled
        if (showSubdistrict) {
            setTimeout(() => {
                setSubdistrictState({ isOpen: true, search: '' });
            }, 100);
        }
    }, [onChange, value.province, showSubdistrict]);

    // Handle subdistrict selection
    const handleSubdistrictSelect = useCallback((subdistrict: Subdistrict) => {
        onChange({
            province: value.province || '',
            district: value.district || '',
            subdistrict: subdistrict.name,
            zipcode: subdistrict.zipcode,
        });
        setSubdistrictState({ isOpen: false, search: '' });
        setZipcodeState(prev => ({ ...prev, search: subdistrict.zipcode, isOpen: false }));
    }, [onChange, value.province, value.district]);

    const applySubdistrictSelection = useCallback((subdistrict: Subdistrict) => {
        const district = getDistrictById(subdistrict.districtId);
        const province = district ? getProvinceById(district.provinceId) : undefined;

        onChange({
            province: province?.name || value.province || '',
            district: district?.name || value.district || '',
            subdistrict: subdistrict.name,
            zipcode: subdistrict.zipcode,
        });
        setZipcodeState(prev => ({ ...prev, search: subdistrict.zipcode, isOpen: false }));
    }, [onChange, value.province, value.district]);

    const handleZipcodeInput = useCallback((rawValue: string) => {
        const nextValue = rawValue.replace(/\D/g, '').slice(0, 5);
        const shouldOpen = nextValue.length >= 2;

        setZipcodeState({ isOpen: shouldOpen, search: nextValue });

        if (!nextValue) {
            onChange({
                province: value.province || '',
                district: value.district || '',
                subdistrict: value.subdistrict || '',
                zipcode: '',
            });
            return;
        }

        if (nextValue.length === 5) {
            const matches = searchSubdistricts(nextValue);
            if (matches.length === 1) {
                applySubdistrictSelection(matches[0]);
                return;
            }
        }

        onChange({
            province: value.province || '',
            district: value.district || '',
            subdistrict: value.subdistrict || '',
            zipcode: nextValue,
        });
    }, [onChange, value, applySubdistrictSelection]);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Province */}
            <AddressDropdown<Province>
                label="จังหวัด"
                placeholder="โปรดเลือกจังหวัด"
                selectedValue={value.province}
                isOpen={provinceState.isOpen}
                search={provinceState.search}
                onToggle={() => {
                    if (!provinceState.isOpen) closeAllDropdowns();
                    setProvinceState(prev => ({ ...prev, isOpen: !prev.isOpen, search: '' }));
                }}
                onSearchChange={(v) => setProvinceState(prev => ({ ...prev, search: v }))}
                onClearSearch={() => setProvinceState(prev => ({ ...prev, search: '' }))}
                items={filteredProvinces}
                onSelect={handleProvinceSelect}
                getItemLabel={(p) => p.name}
                getItemKey={(p) => p.id}
                emptyMessage="ไม่พบจังหวัดที่ค้นหา"
            />

            {/* District */}
            <AddressDropdown<District>
                label="อำเภอ/เขต"
                placeholder="โปรดเลือกอำเภอ/เขต"
                selectedValue={value.district}
                isOpen={districtState.isOpen}
                search={districtState.search}
                onToggle={() => {
                    if (!districtState.isOpen) closeAllDropdowns();
                    setDistrictState(prev => ({ ...prev, isOpen: !prev.isOpen, search: '' }));
                }}
                onSearchChange={(v) => setDistrictState(prev => ({ ...prev, search: v }))}
                onClearSearch={() => setDistrictState(prev => ({ ...prev, search: '' }))}
                items={filteredDistricts}
                onSelect={handleDistrictSelect}
                disabled={!value.province}
                getItemLabel={(d) => d.name}
                getItemKey={(d) => d.id}
                emptyMessage={!value.province ? "กรุณาเลือกจังหวัดก่อน" : "ไม่พบอำเภอ/เขตที่ค้นหา"}
            />

            {/* Subdistrict */}
            {showSubdistrict && (
                <AddressDropdown<Subdistrict>
                    label="ตำบล/แขวง"
                    placeholder="โปรดเลือกตำบล/แขวง"
                    selectedValue={value.subdistrict}
                    isOpen={subdistrictState.isOpen}
                    search={subdistrictState.search}
                    onToggle={() => {
                        if (!subdistrictState.isOpen) closeAllDropdowns();
                        setSubdistrictState(prev => ({ ...prev, isOpen: !prev.isOpen, search: '' }));
                    }}
                    onSearchChange={(v) => setSubdistrictState(prev => ({ ...prev, search: v }))}
                    onClearSearch={() => setSubdistrictState(prev => ({ ...prev, search: '' }))}
                    items={filteredSubdistricts}
                    onSelect={handleSubdistrictSelect}
                    disabled={!value.district}
                    getItemLabel={(s) => s.name}
                    getItemKey={(s) => s.id}
                    renderItem={(s) => (
                        <div className="flex justify-between items-center">
                            <span>{s.name}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.zipcode}</span>
                        </div>
                    )}
                    emptyMessage={!value.district ? "กรุณาเลือกอำเภอ/เขตก่อน" : "ไม่พบตำบล/แขวงที่ค้นหา"}
                />
            )}

            {/* Zipcode */}
            {showZipcode && (
                <div className="relative">
                    <label className="block text-sm font-medium mb-1">รหัสไปรษณีย์</label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            inputMode="numeric"
                            value={zipcodeState.search}
                            onChange={(e) => handleZipcodeInput(e.target.value)}
                            onFocus={() => {
                                if (zipcodeState.search.length >= 2) {
                                    setZipcodeState(prev => ({ ...prev, isOpen: true }));
                                }
                            }}
                            placeholder="พิมพ์รหัสไปรษณีย์เพื่อค้นหา"
                            className="w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        {zipcodeState.search && (
                            <button
                                type="button"
                                onClick={() => handleZipcodeInput('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {zipcodeState.isOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 w-full bg-white border rounded-lg shadow-xl max-h-60 overflow-hidden z-[9999] animate-in fade-in-0 zoom-in-95 duration-150">
                            {filteredZipResults.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                    <MapPin size={24} className="mx-auto mb-2 text-gray-300" />
                                    {zipcodeState.search.length < 2 ? 'พิมพ์อย่างน้อย 2 ตัวอักษร' : 'ไม่พบข้อมูล'}
                                </div>
                            ) : (
                                <div className="overflow-y-auto max-h-60">
                                    {filteredZipResults.map((subdistrict) => {
                                        const district = getDistrictById(subdistrict.districtId);
                                        const province = district ? getProvinceById(district.provinceId) : undefined;
                                        return (
                                            <div
                                                key={subdistrict.id}
                                                className="px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 transition-colors border-b last:border-b-0"
                                                onClick={() => applySubdistrictSelection(subdistrict)}
                                            >
                                                <div className="font-medium text-gray-900">
                                                    {subdistrict.name}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <span>{district?.name || '-'}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{province?.name || '-'}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="font-medium text-blue-600">{subdistrict.zipcode}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
