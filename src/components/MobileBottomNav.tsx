"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";

interface MobileBottomNavProps {
  /** Hide the bar when pathname starts with this prefix (e.g. "/admin") */
  hideOnPrefix?: string[];
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ hideOnPrefix = ["/admin"] }) => {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { totalUnread } = useNotificationCounts();

  // ซ่อนในหน้าแอดมิน หรือบนเดสก์ท็อป (ใช้ class ซ่อนไว้บน md ขึ้นไป)
  if (hideOnPrefix.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const items = [
    {
      href: "/shop",
      label: "หน้าหลัก",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v8a2 2 0 01-2 2h-4a2 2 0 01-2-2V12H9v6a2 2 0 01-2 2H3a2 2 0 01-2-2v-8z" />
        </svg>
      ),
      show: true,
    },
    {
      href: "/catalog",
      label: "CATALOG",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h6m0-14l2-2h5a2 2 0 012 2v12a2 2 0 01-2 2h-7m0-14v14" />
        </svg>
      ),
      show: true,
    },
    {
      href: "/notification",
      label: "แจ้งเตือน",
      icon: (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-[14px] min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
      ),
      show: true,
    },
    {
      href: isLoggedIn ? "/profile" : "/login?returnUrl=/profile",
      label: "ข้อมูลส่วนตัว",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      show: true,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <ul className="grid grid-cols-4 text-xs">
        {items.filter((i) => i.show).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 ${
                isActive(item.href) ? "text-blue-600" : "text-gray-700"
              }`}
              aria-label={item.label}
            >
              <span className="mb-1">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;


