'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AppHeaderProps {
  showSearch?: boolean;
  onSearchToggle?: (isOpen: boolean) => void;
}

export default function AppHeader({ showSearch = true, onSearchToggle }: AppHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();

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
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  // เมนูตามสิทธิ์ผู้ใช้
  const menuItems = [
    { href: '/shop', label: 'หน้าร้าน', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, show: true },
    { href: '/profile', label: 'ข้อมูลส่วนตัว', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, show: isLoggedIn },
    { href: '/admin', label: 'ระบบแอดมิน', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, show: isLoggedIn && user?.role === 'admin' },
    { href: '/contact', label: 'ติดต่อเรา', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>, show: true },
    { href: '/articles', label: 'บทความ', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, show: true },
  ].filter(item => item.show);

  return (
    <>
      {/* Top App Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
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
              <div className="text-sm font-medium text-slate-600 leading-tight text-center">DYNAMIC</div>
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
        <div className="bg-white border-b border-gray-200 px-4 py-3">
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

             {/* Menu Overlay */}
       <AnimatePresence>
         {isMenuOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="fixed inset-0 bg-black bg-opacity-30 z-50 backdrop-blur-sm" 
             onClick={() => setIsMenuOpen(false)}
           >
             <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ 
                 type: 'spring', 
                 stiffness: 300, 
                 damping: 30 
               }}
               className="bg-white w-80 h-full shadow-xl overflow-y-auto ml-auto"
               onClick={e => e.stopPropagation()}
             >
             {/* Header */}
             <div className="flex justify-between items-center p-6 border-b border-gray-200">
               <div>
                 <h2 className="text-xl font-bold text-gray-900">เมนูหลัก</h2>
                 {isLoggedIn && user?.name && (
                   <p className="text-sm text-gray-600 mt-1">สวัสดี, {user.name}</p>
                 )}
               </div>
               <button
                 onClick={() => setIsMenuOpen(false)}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             {/* Menu Items */}
             <div className="p-4">
               <nav className="space-y-2">
                 {menuItems.map((item) => (
                   <Link
                     key={item.href}
                     href={item.href}
                     onClick={handleMenuItemClick}
                     className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                   >
                     <span className="text-xl">{item.icon}</span>
                     <span className="font-medium">{item.label}</span>
                   </Link>
                 ))}
               </nav>
               
               {/* Auth Section */}
               <div className="mt-6 pt-6 border-t border-gray-200">
                 {isLoggedIn ? (
                   <div className="space-y-2">
                     <div className="px-4 py-2 bg-gray-50 rounded-lg">
                       <p className="text-sm text-gray-600">เข้าสู่ระบบแล้ว</p>
                       <p className="text-sm font-medium text-gray-900">{user?.phoneNumber}</p>
                       {user?.role === 'admin' && (
                         <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                           ผู้ดูแลระบบ
                         </span>
                       )}
                     </div>
                     <button
                       onClick={handleLogout}
                       className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                       <span className="font-medium">ออกจากระบบ</span>
                     </button>
                   </div>
                 ) : (
                   <Link
                     href="/login"
                     onClick={handleMenuItemClick}
                     className="w-full flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7l2 2" />
                </svg>
                     <span>เข้าสู่ระบบ</span>
                   </Link>
                 )}
               </div>
               
               {/* App Info */}
               <div className="mt-6 pt-6 border-t border-gray-200">
                 <div className="px-4 py-2 text-center">
                   <div className="flex items-center justify-center space-x-2 mb-2">
                     <div className="w-6 h-6 relative">
                       <div className="absolute inset-0 border-2 border-slate-700" 
                            style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
                       </div>
                       <div className="absolute inset-1 bg-slate-700" 
                            style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}>
                       </div>
                     </div>
                     <div className="text-sm font-bold text-slate-800">WINRICH DYNAMIC</div>
                   </div>
                   <p className="text-xs text-gray-500">เวอร์ชัน 1.0.0</p>
                 </div>
               </div>
             </div>
           </motion.div>
         </motion.div>
         )}
       </AnimatePresence>
    </>
  );
}