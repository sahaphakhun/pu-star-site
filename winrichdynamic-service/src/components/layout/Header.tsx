"use client"

import { useEffect, useState } from 'react';
import { Bell, User, ChevronDown, MessageSquare, Calendar, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useRouter } from 'next/navigation';
import { useTokenManager } from '@/utils/tokenManager';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();
  const { getValidToken, logout } = useTokenManager();

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const token = await getValidToken();
        if (!token) return;

        const res = await fetch('/api/adminb2b/profile', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data?.success) {
          setProfile({
            name: data.data?.name || 'ผู้ใช้งาน',
            role: data.data?.role || '-',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [getValidToken]);

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
  const avatarLetter = (profile?.name || 'P').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-3 md:px-6">
      <div className="flex items-center gap-2 md:gap-6">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden hover:bg-slate-100"
          onClick={onMenuToggle}
        >
          <Menu className="h-6 w-6 text-slate-600" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-sky-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-base md:text-lg shadow-sm">
            W
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800">Winrich</h1>
          </div>
        </div>
        
        {/* Language Selector - Hidden on mobile */}
        <div className="ml-2 md:ml-4 hidden sm:block">
          <select className="bg-white border border-slate-200 rounded px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400">
            <option>ภาษา: ไทย</option>
            <option>Language: EN</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Notification Icons with Badges */}
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 h-8 w-8 md:h-10 md:w-10">
          <Bell className="h-4 w-4 md:h-5 md:w-5 text-slate-600" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 md:h-5 bg-red-500 rounded-full text-white text-[10px] md:text-xs flex items-center justify-center font-bold px-[2px]">
              {displayNotificationCount}
            </span>
          )}
        </Button>
        
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
          <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-slate-600" />
        </Button>

        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
          <Calendar className="h-4 w-4 md:h-5 md:w-5 text-slate-600" />
        </Button>

        {/* WINR Button - Hidden on small mobile */}
        <div className="bg-slate-900 rounded px-2 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-semibold text-white shadow-sm cursor-pointer hover:bg-slate-800 hidden xs:block">
          WINR
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 md:gap-2 bg-white rounded-lg px-2 md:px-3 py-1.5 md:py-2 cursor-pointer hover:bg-slate-50 border border-slate-200"
            >
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-sky-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                {avatarLetter}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold text-slate-800">{profile?.name || 'PU STAR Office'}</p>
                <p className="text-xs text-slate-500">{profile?.role || 'Admin'}</p>
              </div>
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-slate-600 hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">{profile?.name || 'ผู้ใช้งาน'}</span>
                <span className="text-xs text-slate-500">{profile?.role || '-'}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                router.push('/adminb2b/profile');
              }}
            >
              <User className="h-4 w-4" />
              โปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700"
              onSelect={(event) => {
                event.preventDefault();
                logout();
              }}
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
