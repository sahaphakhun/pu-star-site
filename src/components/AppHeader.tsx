'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  showSearch?: boolean;
  onSearchToggle?: (isOpen: boolean) => void;
}

export default function AppHeader({ showSearch = true, onSearchToggle }: AppHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearchToggle = () => {
    const newState = !isSearchOpen;
    setIsSearchOpen(newState);
    onSearchToggle?.(newState);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    // TODO: เพิ่มฟังก์ชันเมนูหลักในภายหลัง
  };

  return (
    <>
      {/* Top App Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-3">
        <div className="flex items-center justify-between p-4">
          {/* Logo and Company Name */}
          <div className="flex items-center space-x-3">
            {/* Triangle Logo Symbol */}
            <div className="relative">
              <div className="w-8 h-8 relative">
                {/* Outer triangle */}
                <div className="absolute inset-0 border-2 border-slate-700 transform rotate-0" 
                     style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
                </div>
                {/* Inner triangle */}
                <div className="absolute inset-1 bg-slate-700 transform rotate-0" 
                     style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
                </div>
              </div>
            </div>
            
            {/* Company Name */}
            <div className="flex flex-col">
              <div className="text-lg font-bold text-slate-800 leading-tight">WINRICH</div>
              <div className="text-sm font-medium text-slate-600 leading-tight">DYNAMIC</div>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3">
            {/* Search Icon */}
            {showSearch && (
              <button 
                onClick={handleSearchToggle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="ค้นหาสินค้า"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            
            {/* Hamburger Menu Icon */}
            <button 
              onClick={handleMenuToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="เมนูหลัก"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - แสดงเมื่อเปิด */}
      {isSearchOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-3 p-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="ค้นหาสินค้าจากชื่อ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ค้นหา
              </button>
              <button
                type="button"
                onClick={handleSearchToggle}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ปิด
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Overlay - สำหรับเมนูหลักในอนาคต */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white w-80 h-full shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">เมนูหลัก</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 text-center py-8">เมนูจะพัฒนาเพิ่มเติมในอนาคต</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}