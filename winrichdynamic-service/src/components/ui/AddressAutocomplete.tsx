'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import {
    provinces,
    getDistrictsByProvince,
    getSubdistrictsByDistrict,
    searchProvinces,
    searchDistricts,
    searchSubdistricts,
    getProvinceByName,
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

    // Refs for click outside
    const provinceRef = useRef<HTMLDivElement>(null);
    const districtRef = useRef<HTMLDivElement>(null);
    const subdistrictRef = useRef<HTMLDivElement>(null);

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
    };

    // Dropdown component
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
    }) => (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div
                className={cn(
                    'w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-colors',
                    disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-400',
                    state.isOpen && 'ring-2 ring-blue-500 border-blue-500'
                )}
                onClick={() => !disabled && setState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            >
                <span className={selectedValue ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedValue || placeholder}
                </span>
                <ChevronDown size={16} className={cn('transition-transform', state.isOpen && 'rotate-180')} />
            </div>

            {state.isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
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
                </div>
            )}
        </div>
    );

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
            {showZipcode && value.zipcode && (
                <div>
                    <label className="block text-sm font-medium mb-1">รหัสไปรษณีย์</label>
                    <input
                        type="text"
                        value={value.zipcode}
                        readOnly
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                    />
                </div>
            )}
        </div>
    );
}
