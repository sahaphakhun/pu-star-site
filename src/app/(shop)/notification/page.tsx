'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type TabKey = 'all' | 'orders' | 'quotes';

interface OrderItem {
  _id: string;
  totalAmount: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'ready'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'claimed'
    | 'failed'
    | 'claim_approved'
    | 'claim_rejected';
  orderDate?: string | Date;
  updatedAt?: string | Date;
  trackingNumber?: string;
}

interface QuoteItem {
  _id: string;
  totalAmount: number;
  status: 'pending' | 'quoted' | 'approved' | 'rejected';
  requestDate?: string | Date; // API แปลงเป็น string ไทยแล้ว
  updatedAt?: string | Date; // จาก timestamps
}

interface NotificationItem {
  id: string; // unique composite id สำหรับ mark-as-read
  sourceId: string; // orderId หรือ quoteId
  category: 'orders' | 'quotes' | 'system';
  title: string;
  message: string;
  date: Date;
  dateText: string;
  status: string;
}

const READ_KEY = 'userNotificationReadIds:v1';

function formatCurrencyTHB(amount: number): string {
  try {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `฿${amount.toLocaleString('th-TH')}`;
  }
}

function formatDateTH(date: Date): string {
  try {
    return date.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  } catch {
    return date.toLocaleString();
  }
}

function mapOrderStatusTH(status: OrderItem['status']): string {
  const map: Record<OrderItem['status'], string> = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันแล้ว',
    ready: 'กำลังเตรียม',
    shipped: 'จัดส่งแล้ว',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    claimed: 'เคลม',
    failed: 'ล้มเหลว',
    claim_approved: 'อนุมัติเคลม',
    claim_rejected: 'ปฏิเสธการเคลม',
  };
  return map[status] ?? status;
}

function mapQuoteStatusTH(status: QuoteItem['status']): string {
  const map: Record<QuoteItem['status'], string> = {
    pending: 'รอใบเสนอราคา',
    quoted: 'ได้รับใบเสนอราคา',
    approved: 'อนุมัติแล้ว',
    rejected: 'ถูกปฏิเสธ',
  };
  return map[status] ?? status;
}

function toDateSafe(input: string | Date | undefined): Date {
  if (!input) return new Date(0);
  if (input instanceof Date) return input;
  const d = new Date(input);
  // ถ้า parse ไม่ได้ จะได้ Invalid Date → fallback epoch
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export default function UserNotificationPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // โหลดสถานะที่อ่านแล้วจาก localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        setReadIds(new Set(parsed));
      }
    } catch {
      // ignore
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === READ_KEY && e.newValue) {
        try {
          const parsed: string[] = JSON.parse(e.newValue);
          setReadIds(new Set(parsed));
        } catch {/* ignore */}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ดึงข้อมูลคำสั่งซื้อและใบเสนอราคาเพื่อสร้าง feed การแจ้งเตือน
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, quotesRes] = await Promise.all([
        fetch('/api/orders/my-orders', { credentials: 'include' }),
        fetch('/api/quote-requests/my-quotes', { credentials: 'include' }),
      ]);

      if (ordersRes.status === 401 || quotesRes.status === 401) {
        setItems([]);
        setLoading(false);
        return;
      }

      const orders: OrderItem[] = ordersRes.ok ? await ordersRes.json() : [];
      const quotes: any[] = quotesRes.ok ? await quotesRes.json() : [];

      const orderItems: NotificationItem[] = (orders || []).flatMap((o) => {
        const updatedAt = toDateSafe((o as any).updatedAt || o.orderDate);
        const id = `order:${o._id}:${o.status}:${updatedAt.getTime()}`;
        const title = `ออเดอร์ของคุณ • ${mapOrderStatusTH(o.status)}`;
        const messageParts = [
          `เลขออเดอร์: ${o._id.slice(-6)}`,
          `ยอดรวม: ${formatCurrencyTHB(o.totalAmount)}`,
        ];
        if (o.trackingNumber && o.status !== 'delivered') {
          messageParts.push(`เลขพัสดุ: ${o.trackingNumber}`);
        }
        const base: NotificationItem = {
          id,
          sourceId: o._id,
          category: 'orders',
          title,
          message: messageParts.join(' • '),
          date: updatedAt,
          dateText: formatDateTH(updatedAt),
          status: mapOrderStatusTH(o.status),
        } as NotificationItem;

        const extra: NotificationItem[] = [];
        // แจ้งเตือนกรณีมีหลักฐานแพ็คสินค้าใหม่
        const proofs = (o as any).packingProofs as Array<{ url: string; addedAt: string | Date }> | undefined;
        if (Array.isArray(proofs) && proofs.length > 0) {
          const lastAdded = proofs[proofs.length - 1]?.addedAt;
          if (lastAdded) {
            const ts = toDateSafe(lastAdded);
            extra.push({
              id: `order:${o._id}:packing:${ts.getTime()}`,
              sourceId: o._id,
              category: 'orders',
              title: 'อัปเดตการแพ็คสินค้า',
              message: 'มีหลักฐานแพ็คสินค้าใหม่ สามารถเปิดดูรูป/วิดีโอได้',
              date: ts,
              dateText: formatDateTH(ts),
              status: 'อัปเดตแพ็คสินค้า',
            });
          }
        }
        // แจ้งเตือนกรณีสต็อกไม่พอหลังสร้างออเดอร์
        const stockStatus = (o as any).wmsData?.stockCheckStatus as string | undefined;
        if (stockStatus === 'insufficient') {
          const ts = updatedAt;
          extra.push({
            id: `order:${o._id}:stock_insufficient:${ts.getTime()}`,
            sourceId: o._id,
            category: 'orders',
            title: 'สินค้าไม่พอในคลัง',
            message: 'บางรายการสต็อกไม่พอ ทีมงานจะติดต่อเพื่อเสนอทางเลือก/กำหนดส่งใหม่',
            date: ts,
            dateText: formatDateTH(ts),
            status: 'สต็อกไม่พอ',
          });
        }

        return [base, ...extra];
      });

      const quoteItems: NotificationItem[] = (quotes || []).map((q) => {
        const updatedAt = toDateSafe(q.updatedAt || q.requestDate);
        const id = `quote:${q._id}:${q.status}:${toDateSafe(q.updatedAt).getTime() || updatedAt.getTime()}`;
        const title = `ใบเสนอราคาของคุณ • ${mapQuoteStatusTH(q.status)}`;
        const message = `เลขคำขอ: ${String(q._id).slice(-6)} • ยอดรวม: ${formatCurrencyTHB(q.totalAmount)}`;
        return {
          id,
          sourceId: q._id,
          category: 'quotes',
          title,
          message,
          date: updatedAt,
          dateText: formatDateTH(updatedAt),
          status: mapQuoteStatusTH(q.status),
        } as NotificationItem;
      });

      const merged = [...orderItems, ...quoteItems].sort((a, b) => b.date.getTime() - a.date.getTime());
      setItems(merged);
    } catch (err) {
      setError('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      fetchData();
    }
  }, [authLoading, isLoggedIn, fetchData]);

  // โหลดสถานะที่อ่านแล้วจากฐานข้อมูลเมื่อผู้ใช้ล็อกอิน
  const loadServerReadIds = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/user/read', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data?.eventIds)) {
        const serverSet = new Set<string>(data.data.eventIds);
        // รวมกับ local เพื่อคง UX multi-tab และ offline
        setReadIds((prev) => {
          const combined = new Set<string>([...prev, ...serverSet]);
          try {
            localStorage.setItem(READ_KEY, JSON.stringify(Array.from(combined)));
          } catch {/* ignore */}
          return combined;
        });
      }
    } catch {
      // เงียบไว้ ไม่ทำลาย UX
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      loadServerReadIds();
    }
  }, [authLoading, isLoggedIn, loadServerReadIds]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter((it) => it.category === activeTab);
  }, [items, activeTab]);

  const unreadCountAll = useMemo(
    () => items.filter((it) => !readIds.has(it.id)).length,
    [items, readIds]
  );
  const unreadCountOrders = useMemo(
    () => items.filter((it) => it.category === 'orders' && !readIds.has(it.id)).length,
    [items, readIds]
  );
  const unreadCountQuotes = useMemo(
    () => items.filter((it) => it.category === 'quotes' && !readIds.has(it.id)).length,
    [items, readIds]
  );

  const persistReadIds = (next: Set<string>) => {
    setReadIds(new Set(next));
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(next)));
      // แจ้ง global listeners ให้รีเฟรช badge
      try {
        window.dispatchEvent(new Event('notifications:read-changed'));
      } catch {}
    } catch {
      // ignore
    }
  };

  const postMarkRead = async (ids: string[]) => {
    try {
      await fetch('/api/notifications/user/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventIds: ids }),
      });
    } catch {
      // เงียบไว้เพื่อไม่ทำลาย UX; local จะยังคงสถานะอ่าน
    }
  };

  const markAsRead = (id: string) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    persistReadIds(next);
    // อัปเดตฐานข้อมูลแบบ optimistic
    if (isLoggedIn) postMarkRead([id]);
  };

  const markAllVisibleAsRead = () => {
    const next = new Set(readIds);
    const idsToMark: string[] = [];
    for (const it of filteredItems) {
      if (!next.has(it.id)) idsToMark.push(it.id);
      next.add(it.id);
    }
    persistReadIds(next);
    if (isLoggedIn && idsToMark.length > 0) postMarkRead(idsToMark);
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center">
        <h1 className="text-xl font-bold mb-2">ศูนย์การแจ้งเตือน</h1>
        <p className="text-gray-600 mb-4">กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือนของคุณ</p>
        <Link
          href="/login?returnUrl=/notification"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">ศูนย์การแจ้งเตือน</h1>
        {filteredItems.some((it) => !readIds.has(it.id)) && (
          <button
            onClick={markAllVisibleAsRead}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="sticky top-[56px] z-10 bg-gray-100 -mx-4 px-4 pb-2">
        <div className="inline-flex bg-white border rounded-lg overflow-hidden">
          {(
            [
              { key: 'all', label: 'ทั้งหมด', count: unreadCountAll },
              { key: 'orders', label: 'ออเดอร์', count: unreadCountOrders },
              { key: 'quotes', label: 'ใบเสนอราคา', count: unreadCountQuotes },
            ] as Array<{ key: TabKey; label: string; count: number }>
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-r last:border-r-0 transition-colors ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-white border rounded-lg animate-pulse h-20" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-6 p-8 text-center bg-white border rounded-lg text-gray-600">
          ยังไม่มีการแจ้งเตือน
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {filteredItems.map((it) => {
            const isRead = readIds.has(it.id);
            const isOrder = it.category === 'orders';
            return (
              <li key={it.id} className={`p-4 bg-white border rounded-lg ${!isRead ? 'border-blue-200' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center ${
                    isOrder ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`} aria-hidden>
                    {isOrder ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 7l9 6 9-6M4 19h16" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!isRead && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" aria-label="ยังไม่ได้อ่าน" />}
                          <h3 className="font-medium text-gray-900 truncate">{it.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 break-words">{it.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{it.dateText}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {!isRead && (
                        <button
                          onClick={() => markAsRead(it.id)}
                          className="text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          ทำเครื่องหมายว่าอ่านแล้ว
                        </button>
                      )}

                      {isOrder ? (
                        <Link
                          href="/my-orders"
                          className="text-xs px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          ดูออเดอร์ของฉัน
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

