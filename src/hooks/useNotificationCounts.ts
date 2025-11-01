'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type OrderStatus =
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

type QuoteStatus = 'pending' | 'quoted' | 'approved' | 'rejected';

interface OrderItem {
  _id: string;
  totalAmount: number;
  status: OrderStatus;
  orderDate?: string | Date;
  updatedAt?: string | Date;
  trackingNumber?: string;
}

interface QuoteItem {
  _id: string;
  totalAmount: number;
  status: QuoteStatus;
  requestDate?: string | Date;
  updatedAt?: string | Date;
}

interface NotificationItemLite {
  id: string;
  category: 'orders' | 'quotes';
}

const READ_KEY = 'userNotificationReadIds:v1';

function toDateSafe(input: string | Date | undefined): Date {
  if (!input) return new Date(0);
  if (input instanceof Date) return input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function buildOrderEventId(order: OrderItem): string {
  const updatedAt = toDateSafe((order as any).updatedAt || order.orderDate);
  return `order:${order._id}:${order.status}:${updatedAt.getTime()}`;
}

function buildQuoteEventId(quote: QuoteItem): string {
  const updatedAt = toDateSafe((quote as any).updatedAt || quote.requestDate);
  const ts = toDateSafe((quote as any).updatedAt).getTime() || updatedAt.getTime();
  return `quote:${quote._id}:${quote.status}:${ts}`;
}

export function useNotificationCounts() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [ordersUnread, setOrdersUnread] = useState<number>(0);
  const [quotesUnread, setQuotesUnread] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const totalUnread = useMemo(() => ordersUnread + quotesUnread, [ordersUnread, quotesUnread]);

  const refresh = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const [ordersRes, quotesRes] = await Promise.all([
        fetch('/api/orders/my-orders', { credentials: 'include', signal: ac.signal }),
        fetch('/api/quote-requests/my-quotes', { credentials: 'include', signal: ac.signal }),
      ]);

      if (ordersRes.status === 401 || quotesRes.status === 401) {
        setOrdersUnread(0);
        setQuotesUnread(0);
        setLoading(false);
        return;
      }

      const orders: OrderItem[] = ordersRes.ok ? await ordersRes.json() : [];
      const quotes: any[] = quotesRes.ok ? await quotesRes.json() : [];

      // สร้าง event ids
      const items: NotificationItemLite[] = [
        ...orders.map((o) => ({ id: buildOrderEventId(o), category: 'orders' as const })),
        ...quotes.map((q) => ({ id: buildQuoteEventId(q), category: 'quotes' as const })),
      ];

      // โหลด readIds จาก localStorage
      let readSet = new Set<string>();
      try {
        const raw = localStorage.getItem(READ_KEY);
        if (raw) readSet = new Set<string>(JSON.parse(raw));
      } catch {
        // ignore
      }

      // รวมกับข้อมูลจากเซิร์ฟเวอร์ถ้าล็อกอิน
      if (isLoggedIn) {
        try {
          const res = await fetch('/api/notifications/user/read', { credentials: 'include', signal: ac.signal });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && Array.isArray(data?.data?.eventIds)) {
              for (const id of data.data.eventIds) readSet.add(id);
              try {
                localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readSet)));
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // เงียบไว้
        }
      }

      const ordersCount = items.filter((it) => it.category === 'orders' && !readSet.has(it.id)).length;
      const quotesCount = items.filter((it) => it.category === 'quotes' && !readSet.has(it.id)).length;

      setOrdersUnread(ordersCount);
      setQuotesUnread(quotesCount);
    } catch {
      // หากดึงไม่ได้ ให้ไม่รบกวน UI
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!authLoading) {
      refresh();
    }
    // sync เมื่อ localStorage เปลี่ยน (multi-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === READ_KEY) refresh();
    };
    const onLocalReadChanged = () => refresh();
    const onFocus = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('notifications:read-changed', onLocalReadChanged as EventListener);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('notifications:read-changed', onLocalReadChanged as EventListener);
      window.removeEventListener('focus', onFocus);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [authLoading, refresh]);

  return { loading, totalUnread, ordersUnread, quotesUnread, refresh };
}


