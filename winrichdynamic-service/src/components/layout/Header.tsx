"use client"

import { useEffect, useState } from 'react';
import { Bell, User, ChevronDown, Anchor, Gift, MessageSquare, Calendar, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?limit=5', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setNotificationCount(data?.unreadCount ?? 0);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60_000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const displayNotificationCount =
    notificationCount > 99 ? '99+' : notificationCount.toString();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-6">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden hover:bg-gray-100"
          onClick={onMenuToggle}
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-base md:text-lg shadow-md">
            W
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">Winrich</h1>
          </div>
        </div>
        
        {/* Language Selector - Hidden on mobile */}
        <div className="ml-2 md:ml-4 hidden sm:block">
          <select className="bg-white border border-gray-300 rounded px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>ภาษา: ไทย</option>
            <option>Language: EN</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Notification Icons with Badges */}
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 h-8 w-8 md:h-10 md:w-10">
          <Bell className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 md:h-5 bg-red-500 rounded-full text-white text-[10px] md:text-xs flex items-center justify-center font-bold px-[2px]">
              {displayNotificationCount}
            </span>
          )}
        </Button>
        
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
          <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
        </Button>

        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
          <Calendar className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
        </Button>

        {/* WINR Button - Hidden on small mobile */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded px-2 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-bold text-white shadow-md cursor-pointer hover:from-purple-600 hover:to-pink-600 hidden xs:block">
          WINR
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-1 md:gap-2 bg-gray-50 rounded-lg px-2 md:px-3 py-1.5 md:py-2 cursor-pointer hover:bg-gray-100 border border-gray-200">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
            P
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-semibold text-gray-800">PU STAR Office</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-600 hidden md:block" />
        </div>
      </div>
    </header>
  );
}
