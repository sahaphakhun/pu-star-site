'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as ReactDOM from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
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

    // Refs for click outside
    const provinceRef = useRef<HTMLDivElement>(null);
    const districtRef = useRef<HTMLDivElement>(null);
    const subdistrictRef = useRef<HTMLDivElement>(null);
    const zipcodeRef = useRef<HTMLDivElement>(null);

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

    // Filtered provinces for search
    const filteredProvinces = useMemo(() => {
        return searchProvinces(provinceState.search);
    }, [provinceState.search]);

    // Filtered districts for search
    const filteredDistricts = useMemo(() => {
        if (districtState.search) {
            return searchDistricts(districtState.search, selectedProvince?.id);
        }
        return availableDistricts;
    }, [districtState.search, availableDistricts, selectedProvince?.id]);

    // Filtered subdistricts for search
    const filteredSubdistricts = useMemo(() => {
        if (subdistrictState.search) {
            return searchSubdistricts(subdistrictState.search, selectedDistrict?.id);
        }
        return availableSubdistricts;
    }, [subdistrictState.search, availableSubdistricts, selectedDistrict?.id]);

    const filteredZipResults = useMemo(() => {
        if (!zipcodeState.search || zipcodeState.search.length < 2) return [];
        return searchSubdistricts(zipcodeState.search).slice(0, 50);
    }, [zipcodeState.search]);

    useEffect(() => {
        if (value.zipcode !== undefined && value.zipcode !== zipcodeState.search) {
            setZipcodeState(prev => ({ ...prev, search: value.zipcode || '' }));
        }
    }, [value.zipcode, zipcodeState.search]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
                setProvinceState(prev => ({ ...prev, isOpen: false }));
            }
            if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
                setDistrictState(prev => ({ ...prev, isOpen: false }));
            }
            if (subdistrictRef.current && !subdistrictRef.current.contains(event.target as Node)) {
                setSubdistrictState(prev => ({ ...prev, isOpen: false }));
            }
            if (zipcodeRef.current && !zipcodeRef.current.contains(event.target as Node)) {
                setZipcodeState(prev => ({ ...prev, isOpen: false }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle province selection
    const handleProvinceSelect = (province: Province) => {
        onChange({
            province: province.name,
            district: '',
            subdistrict: '',
            zipcode: '',
        });
        setProvinceState({ isOpen: false, search: '' });
        setDistrictState({ isOpen: true, search: '' });
        setSubdistrictState({ isOpen: false, search: '' });
        setZipcodeState(prev => ({ ...prev, search: '', isOpen: false }));
    };

    // Handle district selection
    const handleDistrictSelect = (district: District) => {
        onChange({
            province: value.province || '',
            district: district.name,
            subdistrict: '',
            zipcode: '',
        });
        setDistrictState({ isOpen: false, search: '' });
        if (showSubdistrict) {
            setSubdistrictState({ isOpen: true, search: '' });
        }
        setZipcodeState(prev => ({ ...prev, search: '', isOpen: false }));
    };

    // Handle subdistrict selection
    const handleSubdistrictSelect = (subdistrict: Subdistrict) => {
        onChange({
            province: value.province || '',
            district: value.district || '',
            subdistrict: subdistrict.name,
            zipcode: subdistrict.zipcode,
        });
        setSubdistrictState({ isOpen: false, search: '' });
        setProvinceState(prev => ({ ...prev, isOpen: false, search: '' }));
        setDistrictState(prev => ({ ...prev, isOpen: false, search: '' }));
        setSubdistrictState(prev => ({ ...prev, isOpen: false, search: '' }));
        setZipcodeState(prev => ({ ...prev, search: subdistrict.zipcode, isOpen: false }));
    };

    const applySubdistrictSelection = (subdistrict: Subdistrict) => {
        const district = getDistrictById(subdistrict.districtId);
        const province = district ? getProvinceById(district.provinceId) : undefined;

        onChange({
            province: province?.name || value.province || '',
            district: district?.name || value.district || '',
            subdistrict: subdistrict.name,
            zipcode: subdistrict.zipcode,
        });
        setZipcodeState(prev => ({ ...prev, search: subdistrict.zipcode, isOpen: false }));
    };

    const handleZipcodeInput = (rawValue: string) => {
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
    };

    // Dropdown component with Portal
    const Dropdown = ({
        label,
        placeholder,
        selectedValue,
        dropdownRef,
        state,
        setState,
        items,
        onSelect,
        disabled = false,
        getItemLabel,
    }: {
        label: string;
        placeholder: string;
        selectedValue?: string;
        dropdownRef: React.RefObject<HTMLDivElement>;
        state: DropdownState;
        setState: React.Dispatch<React.SetStateAction<DropdownState>>;
        items: any[];
        onSelect: (item: any) => void;
        disabled?: boolean;
        getItemLabel: (item: any) => string;
    }) => {
        const triggerRef = useRef<HTMLDivElement>(null);
        const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
        const [isMounted, setIsMounted] = useState(false);

        useEffect(() => {
            setIsMounted(true);
        }, []);

        // Update dropdown position when opened
        useEffect(() => {
            if (state.isOpen && triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setDropdownStyle({
                    position: 'fixed',
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    zIndex: 9999,
                });
            }
        }, [state.isOpen]);

        const handleClick = () => {
            if (!disabled) {
                setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
            }
        };

        const dropdownContent = state.isOpen && !disabled && isMounted ? ReactDOM.createPortal(
            <div
                style={dropdownStyle}
                className="bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden"
            >
                {/* Search input */}
                <div className="p-2 border-b sticky top-0 bg-white">
                    <div className="relative">
                        <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="พิมพ์เพื่อค้นหา..."
                            value={state.search}
                            onChange={(e) => setState(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-8 pr-8 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                        {state.search && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setState(prev => ({ ...prev, search: '' }));
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Options list */}
                <div className="overflow-y-auto max-h-48">
                    {items.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            ไม่พบข้อมูล
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors',
                                    selectedValue === getItemLabel(item) && 'bg-blue-100 text-blue-700'
                                )}
                                onClick={() => onSelect(item)}
                            >
                                {getItemLabel(item)}
                            </div>
                        ))
                    )}
                </div>
            </div>,
            document.body
        ) : null;

        return (
            <div ref={dropdownRef}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <div
                    ref={triggerRef}
                    className={cn(
                        'w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-colors',
                        disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-400',
                        state.isOpen && 'ring-2 ring-blue-500 border-blue-500'
                    )}
                    onClick={handleClick}
                >
                    <span className={selectedValue ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedValue || placeholder}
                    </span>
                    <ChevronDown size={16} className={cn('transition-transform', state.isOpen && 'rotate-180')} />
                </div>
                {dropdownContent}
            </div>
        );
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Province */}
            <Dropdown
                label="จังหวัด"
                placeholder="โปรดเลือกจังหวัด"
                selectedValue={value.province}
                dropdownRef={provinceRef as React.RefObject<HTMLDivElement>}
                state={provinceState}
                setState={setProvinceState}
                items={filteredProvinces}
                onSelect={handleProvinceSelect}
                getItemLabel={(p: Province) => p.name}
            />

            {/* District */}
            <Dropdown
                label="อำเภอ/เขต"
                placeholder="โปรดเลือกอำเภอ/เขต"
                selectedValue={value.district}
                dropdownRef={districtRef as React.RefObject<HTMLDivElement>}
                state={districtState}
                setState={setDistrictState}
                items={filteredDistricts}
                onSelect={handleDistrictSelect}
                disabled={!value.province}
                getItemLabel={(d: District) => d.name}
            />

            {/* Subdistrict */}
            {showSubdistrict && (
                <Dropdown
                    label="ตำบล/แขวง"
                    placeholder="โปรดเลือกตำบล/แขวง"
                    selectedValue={value.subdistrict}
                    dropdownRef={subdistrictRef as React.RefObject<HTMLDivElement>}
                    state={subdistrictState}
                    setState={setSubdistrictState}
                    items={filteredSubdistricts}
                    onSelect={handleSubdistrictSelect}
                    disabled={!value.district}
                    getItemLabel={(s: Subdistrict) => s.name}
                />
            )}

            {/* Zipcode */}
            {showZipcode && (
                <div className="relative" ref={zipcodeRef}>
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
                            className="w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {zipcodeState.search && (
                            <button
                                type="button"
                                onClick={() => handleZipcodeInput('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {zipcodeState.isOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden z-[9999]">
                            {filteredZipResults.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500 text-center">
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
                                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors border-b last:border-b-0"
                                                onClick={() => applySubdistrictSelection(subdistrict)}
                                            >
                                                <div className="font-medium text-gray-900">
                                                    {subdistrict.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {district?.name || '-'} • {province?.name || '-'} • {subdistrict.zipcode}
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
