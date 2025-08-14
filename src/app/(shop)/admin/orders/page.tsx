'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import PackingImageGallery from '@/components/PackingImageGallery';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import SlipVerificationButton from '@/components/SlipVerificationButton';
import SlipVerificationDisplay from '@/components/SlipVerificationDisplay';
import BatchSlipVerification from '@/components/BatchSlipVerification';
import OrderMappingManager from '@/components/OrderMappingManager';
import UserOrderHistory from '@/components/UserOrderHistory';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { [key: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

interface TaxInvoice {
  requestTaxInvoice: boolean;
  companyName?: string;
  taxId?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

interface ClaimInfo {
  claimDate: string;
  claimReason: string;
  claimImages: string[];
  claimStatus: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  responseDate?: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'cod' | 'transfer';
  slipUrl?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  discount?: number;
  status: 'pending' | 'confirmed' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'claimed' | 'failed' | 'claim_approved' | 'claim_rejected';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingProvider?: string;
  taxInvoice?: TaxInvoice;
  packingProofs?: Array<{
    url: string;
    type: 'image' | 'video';
    addedAt: Date;
  }>;
  claimInfo?: ClaimInfo;
  slipVerification?: {
    verified: boolean;
    verifiedAt: Date;
    verificationType: 'manual' | 'automatic' | 'batch';
    verifiedBy: string;
    slip2GoData?: {
      bank: string;
      amount: number;
      date: string;
      time: string;
      transaction_id: string;
      sender_name: string;
      sender_account: string;
      receiver_name: string;
      receiver_account: string;
      slip_type: string;
      confidence: number;
    };
    error?: string;
    confidence: number;
  };
  wmsData?: {
    stockCheckStatus?: 'pending' | 'checked' | 'insufficient' | 'error';
    stockCheckResults?: Array<{
      productId: string;
      productCode: string;
      requestedQuantity: number;
      availableQuantity: number;
      status: 'available' | 'insufficient' | 'not_found' | 'error';
      message?: string;
    }>;
    lastStockCheck?: string;
    pickingOrderNumber?: string;
    pickingStatus?: 'pending' | 'completed' | 'incomplete' | 'not_found' | 'error';
    lastPickingCheck?: string;
  };
  userId?: string; // เพิ่ม userId เพื่อเชื่อมต่อกับระบบลูกค้า
}

// เพิ่ม interface สำหรับข้อมูลลูกค้าจากระบบ
interface SystemCustomer {
  _id: string;
  name: string;
  phoneNumber: string;
  customerType?: 'new' | 'regular' | 'target' | 'inactive';
}

const AdminOrdersPage = () => {
  const { hasPermission, isAdmin } = usePermissions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');
  const [dateFilter, setDateFilter] = useState<'all'|'today'|'week'|'month'|'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [cutoffTime, setCutoffTime] = useState('16:00'); // เวลาตัดออเดอร์ (ชั่วโมง:นาที)
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    totalAmount: '',
    shippingFee: '0',
    discount: '0'
  });
  
  // States for order editing
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    trackingNumber: '',
    shippingProvider: ''
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  // States for slip verification
  const [showSlipVerification, setShowSlipVerification] = useState(false);
  const [showBatchVerification, setShowBatchVerification] = useState(false);
  
  // States for order mapping
  const [showOrderMapping, setShowOrderMapping] = useState(false);
  const [showUserHistory, setShowUserHistory] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-orange-100 text-orange-800 border-orange-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    claimed: 'bg-pink-100 text-pink-800 border-pink-200',
    failed: 'bg-gray-100 text-gray-800 border-gray-200',
    claim_approved: 'bg-teal-100 text-teal-800 border-teal-200',
    claim_rejected: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };

  const statusLabels = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันออเดอร์แล้ว',
    ready: 'พร้อมส่ง',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    claimed: 'เคลมสินค้า',
    failed: 'ส่งไม่สำเร็จ',
    claim_approved: 'เคลมสำเร็จ',
    claim_rejected: 'เคลมถูกปฏิเสธ',
  };

  const statusIcons = {
    pending: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    confirmed: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    ready: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    shipped: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    delivered: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    cancelled: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    claimed: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    failed: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
    claim_approved: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    claim_rejected: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  };

  // WMS Status Colors and Labels
  const wmsStockStatusColors = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    checked: 'bg-green-100 text-green-800 border-green-200',
    insufficient: 'bg-red-100 text-red-800 border-red-200',
    error: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const wmsStockStatusLabels = {
    pending: 'รอตรวจสอบ',
    checked: 'สต็อกเพียงพอ',
    insufficient: 'สต็อกไม่เพียงพอ',
    error: 'เกิดข้อผิดพลาด'
  };

  // Picking status UI helpers
  const wmsPickingStatusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    incomplete: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    not_found: 'bg-gray-100 text-gray-800 border-gray-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  const wmsPickingStatusLabels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    completed: 'เก็บครบแล้ว',
    incomplete: 'ยังไม่ครบ',
    not_found: 'ไม่พบ',
    error: 'ผิดพลาด',
  };

  const [expandedStockRows, setExpandedStockRows] = useState<Record<string, boolean>>({});

  // เพิ่ม state สำหรับเก็บข้อมูลลูกค้าจากระบบ
  const [systemCustomers, setSystemCustomers] = useState<Map<string, SystemCustomer>>(new Map());

  // Function to handle slip verification completion
  const handleSlipVerificationComplete = (verification: any) => {
    // Update the order in the local state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === selectedOrder?._id 
          ? { ...order, slipVerification: verification }
          : order
      )
    );
    
    // Update selected order if it's currently selected
    if (selectedOrder) {
      setSelectedOrder(prev => prev ? { ...prev, slipVerification: verification } : null);
    }
  };

  // Function to handle batch verification completion
  const handleBatchVerificationComplete = (results: any[]) => {
    // Update orders based on verification results
    setOrders(prevOrders => 
      prevOrders.map(order => {
        const result = results.find(r => r.orderId === order._id);
        if (result && result.success) {
          return { ...order, slipVerification: result.verification };
        }
        return order;
      })
    );
    
    // Refresh orders to get latest data
    fetchOrders();
  };

  const checkWMSPicking = async (orderId: string) => {
    const pickingOrderNumber = window.prompt('กรอกเลขที่ใบเบิก (Picking Order):')?.trim();
    if (!pickingOrderNumber) return;
    const adminUsername = window.prompt('กรอก Admin Username:')?.trim();
    if (!adminUsername) return;

    try {
      const startedAt = performance.now();
      console.groupCollapsed('[WMS] Picking Status - Request');
      console.log('Request', { endpoint: '/api/wms/picking-status', orderId, pickingOrderNumber, adminUsername });
      const res = await fetch('/api/wms/picking-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, pickingOrderNumber, adminUsername }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'เช็คสถานะ Picking ล้มเหลว' }));
        console.warn('[WMS] Picking Status - Response (non-OK)', err);
        console.log('DurationMs', Math.round(performance.now() - startedAt));
        console.groupEnd();
        toast.error(err.error || 'เช็คสถานะ Picking ล้มเหลว');
        return;
      }
      const data = await res.json();
      console.log('[WMS] Picking Status - Response', data);
      console.log('DurationMs', Math.round(performance.now() - startedAt));
      console.groupEnd();
      toast.success(`เช็ค Picking: ${data.message || data.pickingStatus}`);
      await fetchOrders();
    } catch (e) {
      console.error('[WMS] Picking Status - Error', e);
      toast.error('เกิดข้อผิดพลาดในการเช็ค Picking');
    }
  };

  // Function to check WMS stock for an order
  const checkWMSStock = async (orderId: string) => {
    try {
      const startedAt = performance.now();
      console.groupCollapsed('[WMS] Stock Check - Request');
      console.log('Request', { endpoint: '/api/wms/stock-check', orderId });
      const response = await fetch('/api/wms/stock-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[WMS] Stock Check - Response', result);
        if (Array.isArray(result?.results)) {
          try {
            const table = result.results.map((r: any) => ({ productId: r.productId, productCode: r.productCode, reqQty: r.requestedQuantity, availQty: r.availableQuantity, status: r.status, message: r.message }));
            console.table(table);
          } catch {}
        }
        console.log('DurationMs', Math.round(performance.now() - startedAt));
        console.groupEnd();
        toast.success(`ตรวจสอบสต็อก WMS เรียบร้อย: ${result.message}`);
        fetchOrders(); // Refresh orders list
      } else {
        const error = await response.json();
        console.warn('[WMS] Stock Check - Response (non-OK)', error);
        console.log('DurationMs', Math.round(performance.now() - startedAt));
        console.groupEnd();
        toast.error(`เกิดข้อผิดพลาด: ${error.error}`);
      }
    } catch (error) {
      console.error('[WMS] Stock Check - Error', error);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบสต็อก WMS');
    }
  };

  // ฟังก์ชันคำนวณหาเวลาหลัง cutoff ล่าสุด
  const getLatestCutoffDate = (cutoffTimeStr: string) => {
    const now = new Date();
    const bangkokTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
    
    const [hours, minutes] = cutoffTimeStr.split(':').map(Number);
    const todayCutoff = new Date(bangkokTime);
    todayCutoff.setHours(hours, minutes, 0, 0);
    
    // ถ้าเวลาปัจจุบันยังไม่ถึงเวลาตัดของวันนี้ ให้ใช้เวลาตัดของเมื่อวาน
    if (bangkokTime < todayCutoff) {
      const yesterdayCutoff = new Date(todayCutoff);
      yesterdayCutoff.setDate(todayCutoff.getDate() - 1);
      return yesterdayCutoff;
    }
    
    return todayCutoff;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      // แปลงเวลาออเดอร์เป็นเวลาประเทศไทย
      const orderDate = new Date(order.createdAt);
      const orderBangkokTime = new Date(orderDate.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
      
      const now = new Date();
      const bangkokTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
      const [hours, minutes] = cutoffTime.split(':').map(Number);
      
      switch (dateFilter) {
        case 'today':
          const latestCutoff = getLatestCutoffDate(cutoffTime);
          matchesDate = orderBangkokTime >= latestCutoff;
          break;
        case 'week':
          // 7 วันย้อนหลัง นับจากเวลาตัดออเดอร์ของ 7 วันก่อน
          const weekAgoCutoff = new Date(bangkokTime);
          weekAgoCutoff.setDate(bangkokTime.getDate() - 7);
          weekAgoCutoff.setHours(hours, minutes, 0, 0);
          matchesDate = orderBangkokTime >= weekAgoCutoff;
          break;
        case 'month':
          // เดือนนี้ นับจากเวลาตัดออเดอร์ของวันสุดท้ายเดือนก่อน
          const thisMonth = new Date(bangkokTime.getFullYear(), bangkokTime.getMonth(), 1);
          const monthStartCutoff = new Date(thisMonth);
          monthStartCutoff.setDate(0); // วันสุดท้ายเดือนก่อน
          monthStartCutoff.setHours(hours, minutes, 0, 0);
          matchesDate = orderBangkokTime >= monthStartCutoff;
          break;
        case 'custom':
          if (customStart && customEnd) {
            // Custom range ใช้เวลาตัดออเดอร์เป็นตัวกำหนด (ใช้เวลาประเทศไทย)
            const startDate = new Date(customStart + 'T00:00:00+07:00'); // เพิ่ม timezone Thailand
            const start = new Date(startDate.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
            start.setHours(hours, minutes, 0, 0);
            
            const endDate = new Date(customEnd + 'T23:59:59+07:00'); // เพิ่ม timezone Thailand
            const end = new Date(endDate.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
            
            matchesDate = orderBangkokTime >= start && orderBangkokTime <= end;
          }
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = filteredOrders.reduce((acc, order) => {
    acc.total = filteredOrders.length;
    acc[order.status] = (acc[order.status] || 0) + 1;
    if (order.status === 'delivered') {
      acc.totalRevenue += order.totalAmount;
    }
    if (order.taxInvoice?.requestTaxInvoice) {
      acc.taxInvoiceRequests = (acc.taxInvoiceRequests || 0) + 1;
    }
    return acc;
  }, {
    total: 0,
    pending: 0,
    confirmed: 0,
    ready: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    claimed: 0,
    failed: 0,
    claim_approved: 0,
    claim_rejected: 0,
    totalRevenue: 0,
    taxInvoiceRequests: 0,
  });

  const filteredAndSortedOrders = filteredOrders
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        
        // ดึงข้อมูลลูกค้าจากระบบสำหรับออเดอร์ที่มี userId
        await fetchSystemCustomers(data.orders || []);
      } else {
        console.error('Failed to fetch orders');
        toast.error('ไม่สามารถโหลดข้อมูลออเดอร์ได้');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลออเดอร์');
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันสำหรับดึงข้อมูลลูกค้าจากระบบ
  const fetchSystemCustomers = async (orders: Order[]) => {
    try {
      // รวบรวม userId ที่ไม่ซ้ำกันจากออเดอร์
      const userIds = [...new Set(orders
        .filter(order => order.userId)
        .map(order => order.userId!)
      )];

      if (userIds.length === 0) return;

      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getCustomersByIds',
          userIds 
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.customers) {
          const customerMap = new Map<string, SystemCustomer>();
          data.customers.forEach((customer: SystemCustomer) => {
            customerMap.set(customer._id, customer);
          });
          setSystemCustomers(customerMap);
        }
      }
    } catch (error) {
      console.error('Error fetching system customers:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const exportToCSV = (orders: Order[]) => {
    const csvContent = [
      ['รหัสออเดอร์', 'ลูกค้า', 'เบอร์โทร', 'วันที่', 'รายการ', 'ยอดรวม', 'สถานะ', 'การชำระเงิน'].join(','),
      ...orders.map(order => [
        `#${order._id.slice(-8).toUpperCase()}`,
        order.customerName,
        order.customerPhone,
        new Date(order.createdAt).toLocaleDateString('th-TH'),
        `${order.items.length} รายการ`,
        order.totalAmount,
        statusLabels[order.status],
        order.paymentMethod === 'cod' ? 'เก็บเงินปลายทาง' : 'โอนเงิน'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const createOrder = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.totalAmount) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          totalAmount: Number(formData.totalAmount),
          shippingFee: Number(formData.shippingFee),
          discount: Number(formData.discount),
          paymentMethod: 'cod',
          items: [{
            productId: 'manual',
            name: 'สินค้าที่สร้างด้วยตนเอง',
            price: Number(formData.totalAmount),
            quantity: 1
          }]
        }),
        credentials: 'include'
      });

      if (res.ok) {
        toast.success('สร้างออเดอร์สำเร็จ');
        setShowCreate(false);
        setFormData({
          customerName: '',
          customerPhone: '',
          totalAmount: '',
          shippingFee: '0',
          discount: '0'
        });
        fetchOrders();
      } else {
        const d = await res.json();
        toast.error(d.error || 'ผิดพลาด');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้างออเดอร์');
    }
  };

  const uploadPackingImages = async (orderId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    try {
      const res = await fetch(`/api/orders/${orderId}/upload-packing-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (res.ok) {
        const result = await res.json();
        return result;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัพโหลด');
      }
    } catch (error) {
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, updates: any) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include'
      });
      
      if (res.ok) {
        const updatedOrder = await res.json();
        return updatedOrder;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการอัพเดท');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;

    try {
      setLoading(true);
      
      // อัพโหลดรูปก่อน (ถ้ามี)
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        toast.loading('กำลังอัพโหลดรูปภาพ...');
        await uploadPackingImages(editingOrder._id, imageFiles);
        setUploadingImages(false);
      }

      // อัพเดทข้อมูลออเดอร์
      const updates: any = {};
      if (editForm.status && editForm.status !== editingOrder.status) {
        updates.status = editForm.status;
      }
      if (editForm.trackingNumber && editForm.trackingNumber !== editingOrder.trackingNumber) {
        updates.trackingNumber = editForm.trackingNumber;
      }
      if (editForm.shippingProvider && editForm.shippingProvider !== editingOrder.shippingProvider) {
        updates.shippingProvider = editForm.shippingProvider;
      }

      if (Object.keys(updates).length > 0) {
        await updateOrderStatus(editingOrder._id, updates);
      }

      toast.success('อัพเดทออเดอร์สำเร็จ');
      
      // รีเซ็ตฟอร์มและรีเฟรชข้อมูล
      setEditingOrder(null);
      setEditForm({ status: '', trackingNumber: '', shippingProvider: '' });
      setImageFiles([]);
      setSelectedOrder(null);
      await fetchOrders();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const startEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      shippingProvider: order.shippingProvider || ''
    });
    setImageFiles([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImageCount = editingOrder?.packingProofs?.length || 0;
    
    if (currentImageCount + files.length > 10) {
      toast.error(`สามารถอัพโหลดได้สูงสุด ${10 - currentImageCount} รูป`);
      return;
    }
    
    setImageFiles(files);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.ORDERS_VIEW}>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการออเดอร์</h1>
            <p className="text-gray-600">ติดตามและจัดการคำสั่งซื้อทั้งหมด</p>
          </div>
          <div className="flex gap-3">
            {(isAdmin || hasPermission(PERMISSIONS.ORDERS_CREATE)) && (
              <button 
                onClick={() => setShowCreate(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                + สร้างออเดอร์
              </button>
            )}
            {(isAdmin || hasPermission(PERMISSIONS.ORDERS_EXPORT)) && (
              <button 
                onClick={() => exportToCSV(filteredAndSortedOrders)} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Quick Status Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              ทั้งหมด ({stats.total})
            </button>
            
            {Object.entries(statusLabels).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {statusIcons[status as keyof typeof statusIcons]} {label} ({stats[status as keyof typeof stats] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">ออเดอร์ทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">รอดำเนินการ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <div className="text-sm text-gray-600">จัดส่งแล้ว</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-gray-600">ส่งสำเร็จ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-pink-600">{stats.claimed}</div>
            <div className="text-sm text-gray-600">เคลมสินค้า</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">฿{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">ยอดขายรวม</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ชื่อลูกค้า, เบอร์โทร, หรือรหัสออเดอร์"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เรียงลำดับ</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">ใหม่สุด</option>
                <option value="oldest">เก่าสุด</option>
                <option value="amount-high">ยอดสูงสุด</option>
                <option value="amount-low">ยอดต่ำสุด</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงวันที่</label>
              <select 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value as any)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทุกเวลา</option>
                <option value="today">หลัง {cutoffTime} ล่าสุด</option>
                <option value="week">7 วันย้อนหลัง</option>
                <option value="month">เดือนนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เวลาตัดออเดอร์</label>
              <input
                type="time"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
                <input 
                  type="date" 
                  value={customStart} 
                  onChange={e => setCustomStart(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                <input 
                  type="date" 
                  value={customEnd} 
                  onChange={e => setCustomEnd(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Order Mapping Management Section */}
        {hasPermission(PERMISSIONS.ORDERS_VIEW) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">จัดการการเชื่อมโยงออเดอร์</h3>
              <button
                onClick={() => setShowOrderMapping(!showOrderMapping)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showOrderMapping ? 'ซ่อน' : 'แสดง'} จัดการการเชื่อมโยง
              </button>
            </div>
            {showOrderMapping && (
              <OrderMappingManager onMappingComplete={fetchOrders} />
            )}
          </div>
        )}

        {/* Batch Slip Verification Section */}
        {hasPermission(PERMISSIONS.ORDERS_VIEW) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">ตรวจสอบสลิปแบบกลุ่ม</h3>
              <button
                onClick={() => setShowBatchVerification(!showBatchVerification)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showBatchVerification ? 'ซ่อน' : 'แสดง'} ตรวจสอบแบบกลุ่ม
              </button>
            </div>
            
            {showBatchVerification && (
              <BatchSlipVerification
                orders={orders}
                onVerificationComplete={handleBatchVerificationComplete}
                className="mb-6"
              />
            )}
          </div>
        )}

        {/* Orders List/Cards - Responsive Design */}
        <div className="space-y-4">
          {filteredAndSortedOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบออเดอร์</h3>
                <p className="text-gray-600">ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ออเดอร์
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ลูกค้า
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          รายการ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          WMS
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedOrders.map((order) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                #{order._id.slice(-8).toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('th-TH')}
                              </span>
                              {order.taxInvoice?.requestTaxInvoice && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ใบกำกับฯ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {/* ชื่อลูกค้าจากฟอร์มสั่งซื้อ */}
                              <div className="text-sm font-medium text-gray-900">
                                {order.customerName}
                              </div>
                              {/* ชื่อลูกค้าจากระบบ (หากมี) */}
                              {order.userId && systemCustomers.has(order.userId) && (
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {systemCustomers.get(order.userId)?.name || 'ลูกค้า'}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedUserId(order.userId!);
                                      setShowUserHistory(true);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    title="ดูประวัติออเดอร์"
                                  >
                                    ดูประวัติ
                                  </button>
                                </div>
                              )}
                              {/* เบอร์โทรศัพท์ */}
                              <div className="text-xs text-gray-500">
                                📱 {order.customerPhone}
                              </div>
                              {/* ที่อยู่จัดส่ง (ย่อ) */}
                              {order.customerAddress && (
                                <div className="text-xs text-gray-500 max-w-xs truncate" title={order.customerAddress}>
                                  📍 {order.customerAddress.length > 30 ? 
                                    order.customerAddress.substring(0, 30) + '...' : 
                                    order.customerAddress
                                  }
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              {/* จำนวนรายการและยอดรวม */}
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">
                                  {order.items.length} รายการ
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                  ฿{order.totalAmount.toLocaleString()}
                                </span>
                              </div>
                              
                              {/* รายการสินค้าสำคัญ */}
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item, index) => (
                                  <div key={item.productId} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium truncate max-w-32">
                                        {item.name}
                                      </span>
                                      <span className="text-green-600 font-semibold">
                                        ฿{item.price.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>จำนวน: {item.quantity}</span>
                                      {item.unitLabel && (
                                        <span className="text-blue-600">({item.unitLabel})</span>
                                      )}
                                    </div>
                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                      <div className="text-xs text-purple-600">
                                        ⚙️ มีตัวเลือก
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <div className="text-xs text-gray-500 text-center bg-gray-100 px-2 py-1 rounded">
                                    + อีก {order.items.length - 2} รายการ
                                  </div>
                                )}
                              </div>
                              
                              {/* ข้อมูลเพิ่มเติม */}
                              <div className="flex flex-wrap gap-1">
                                {/* ใบกำกับภาษี */}
                                {order.taxInvoice?.requestTaxInvoice && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    ใบกำกับฯ
                                  </span>
                                )}
                                
                                {/* หลักฐานการแพ็ค */}
                                {order.packingProofs && order.packingProofs.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    แพ็ค {order.packingProofs.length}
                                  </span>
                                )}
                                
                                {/* วิธีชำระเงิน */}
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                  order.paymentMethod === 'cod' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {order.paymentMethod === 'cod' ? (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                      </svg>
                                      COD
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      โอนเงิน
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ฿{order.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              {/* สถานะหลัก */}
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                {statusIcons[order.status] || ''} {statusLabels[order.status] || ''}
                              </span>
                              
                              {/* วันที่สั่งซื้อ */}
                              <div className="text-xs text-gray-500">
                                📅 {new Date(order.createdAt).toLocaleDateString('th-TH')}
                              </div>
                              
                              {/* ข้อมูลเพิ่มเติม */}
                              <div className="space-y-1">
                                {/* ใบกำกับภาษี */}
                                {order.taxInvoice?.requestTaxInvoice && (
                                  <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full inline-block">
                                    📋 ใบกำกับฯ
                                  </div>
                                )}
                                
                                {/* หลักฐานการแพ็ค */}
                                {order.packingProofs && order.packingProofs.length > 0 && (
                                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                                    📦 แพ็ค {order.packingProofs.length}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              {order.wmsData?.stockCheckStatus && (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${wmsStockStatusColors[order.wmsData.stockCheckStatus]}`}>
                                  {wmsStockStatusLabels[order.wmsData.stockCheckStatus]}
                                </span>
                              )}
                              {order.wmsData?.pickingStatus && (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${wmsPickingStatusColors[order.wmsData.pickingStatus]}`}>
                                  Picking: {wmsPickingStatusLabels[order.wmsData.pickingStatus]}
                                </span>
                              )}
                              <button
                                onClick={() => checkWMSStock(order._id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                ตรวจสอบสต็อก
                              </button>
                              <button
                                onClick={() => checkWMSPicking(order._id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                เช็ค Picking
                              </button>
                              {!!order.wmsData?.stockCheckResults?.length && (
                                <>
                                  <button
                                    onClick={() => setExpandedStockRows(prev => ({ ...prev, [order._id]: !prev[order._id] }))}
                                    className="text-xs text-gray-600 hover:text-gray-800"
                                  >
                                    {expandedStockRows[order._id] ? 'ซ่อนผลตรวจ' : 'ดูผลตรวจ'}
                                  </button>
                                  {expandedStockRows[order._id] && (
                                    <div className="mt-1 space-y-1">
                                      {order.wmsData!.stockCheckResults!.map((r, idx) => (
                                        <div key={idx} className="text-[11px] text-gray-700">
                                          {r.productCode} ต้องการ {r.requestedQuantity} มี {r.availableQuantity} → {r.status === 'available' ? 'พร้อม' : r.status === 'insufficient' ? 'ไม่พอ' : r.status === 'not_found' ? 'ไม่มีตั้งค่า' : 'ผิดพลาด'}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  startEditOrder(order);
                                }}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                              >
                                จัดการ
                              </button>
                              {order.paymentMethod === 'transfer' && order.slipUrl && (
                                <SlipVerificationButton
                                  orderId={order._id}
                                  slipUrl={order.slipUrl}
                                  onVerificationComplete={handleSlipVerificationComplete}
                                  size="sm"
                                  variant="outline"
                                />
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                {filteredAndSortedOrders.map((order) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {statusIcons[order.status] || ''} {statusLabels[order.status] || ''}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(order.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ฿{order.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod === 'cod' ? (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    COD
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    โอนเงิน
                  </span>
                )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* ชื่อลูกค้า */}
                          <div className="space-y-1 mb-3">
                            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                            {/* ชื่อลูกค้าจากระบบ (หากมี) */}
                            {order.userId && systemCustomers.has(order.userId) && (
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {systemCustomers.get(order.userId)?.name || 'ลูกค้า'}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">📱 {order.customerPhone}</div>
                            {order.customerAddress && (
                              <div className="text-xs text-gray-500 max-w-xs truncate" title={order.customerAddress}>
                                📍 {order.customerAddress.length > 25 ? 
                                  order.customerAddress.substring(0, 25) + '...' : 
                                  order.customerAddress
                                }
                              </div>
                            )}
                          </div>
                          
                          {/* รายการสินค้า */}
                          <div className="text-sm text-gray-500 mb-2">
                            {order.items.length} รายการ
                          </div>
                          
                          {/* รายการสินค้าสำคัญ */}
                          <div className="space-y-1 mb-3">
                            {order.items.slice(0, 1).map(item => (
                              <div key={item.productId} className="text-xs bg-gray-50 px-2 py-1 rounded">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-gray-500">
                                  ฿{item.price.toLocaleString()} x {item.quantity}
                                  {item.unitLabel && <span className="text-blue-600"> ({item.unitLabel})</span>}
                                </div>
                                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                  <div className="text-purple-600">⚙️ มีตัวเลือก</div>
                                )}
                              </div>
                            ))}
                            {order.items.length > 1 && (
                              <div className="text-xs text-gray-500 text-center bg-gray-100 px-2 py-1 rounded">
                                + อีก {order.items.length - 1} รายการ
                              </div>
                            )}
                          </div>
                          
                          {/* ข้อมูลเพิ่มเติม */}
                          <div className="flex flex-wrap gap-1">
                            {/* ใบกำกับภาษี */}
                            {order.taxInvoice?.requestTaxInvoice && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                📋 ใบกำกับฯ
                              </span>
                            )}
                            
                            {/* หลักฐานการแพ็ค */}
                            {order.packingProofs && order.packingProofs.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                📦 แพ็ค {order.packingProofs.length}
                              </span>
                            )}
                            
                            {/* วิธีชำระเงิน */}
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              order.paymentMethod === 'cod' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.paymentMethod === 'cod' ? '💳 COD' : '🏦 โอนเงิน'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              startEditOrder(order);
                            }}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                          >
                            จัดการ
                          </button>
                          {order.paymentMethod === 'transfer' && order.slipUrl && (
                            <SlipVerificationButton
                              orderId={order._id}
                              slipUrl={order.slipUrl}
                              onVerificationComplete={handleSlipVerificationComplete}
                              size="sm"
                              variant="outline"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">สร้างออเดอร์ใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดรวม</label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={createOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  สร้างออเดอร์
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">จัดการออเดอร์ #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setEditingOrder(null);
                    setEditForm({ status: '', trackingNumber: '', shippingProvider: '' });
                    setImageFiles([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ข้อมูลออเดอร์ */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">ข้อมูลออเดอร์</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ลูกค้า</label>
                        <div className="space-y-2">
                          {/* ชื่อลูกค้าจากฟอร์มสั่งซื้อ */}
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-500 mb-1">ชื่อจากฟอร์มสั่งซื้อ</div>
                            <div className="text-lg font-semibold text-gray-900">{selectedOrder.customerName}</div>
                          </div>
                          
                          {/* ชื่อลูกค้าจากระบบ (หากมี) */}
                          {selectedOrder.userId && systemCustomers.has(selectedOrder.userId) && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="text-sm text-blue-600 mb-1">ชื่อในระบบ</div>
                              <div className="text-lg font-semibold text-blue-800">
                                {systemCustomers.get(selectedOrder.userId)?.name || 'ลูกค้า'}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                ประเภท: {systemCustomers.get(selectedOrder.userId)?.customerType || 'ไม่ระบุ'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">เบอร์โทร</label>
                        <p className="text-gray-900">{selectedOrder.customerPhone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
                        <p className="text-gray-900">{selectedOrder.customerAddress}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">การชำระเงิน</label>
                        <p className="text-gray-900">
                          {selectedOrder.paymentMethod === 'cod' ? (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    เก็บเงินปลายทาง
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    โอนเงิน
                  </span>
                )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ค่าจัดส่ง</label>
                        <p className="text-gray-900">฿{selectedOrder.shippingFee.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ส่วนลด</label>
                        <p className="text-gray-900">฿{(selectedOrder.discount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ยอดรวม</label>
                        <p className="text-gray-900 font-bold">฿{selectedOrder.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่สั่งซื้อ</label>
                        <p className="text-gray-900">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'Asia/Bangkok'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* แสดงข้อมูลใบกำกับภาษี ถ้ามี */}
                    {selectedOrder.taxInvoice?.requestTaxInvoice && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">ข้อมูลใบกำกับภาษี</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">ชื่อบริษัท</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">เลขประจำตัวผู้เสียภาษี</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.taxId}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500">ที่อยู่บริษัท</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyAddress}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">เบอร์โทร</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyPhone}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">อีเมล</label>
                            <p className="text-gray-900">{selectedOrder.taxInvoice.companyEmail}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* แสดงข้อมูลการตรวจสอบสลิป ถ้ามี */}
                    {selectedOrder.paymentMethod === 'transfer' && selectedOrder.slipUrl && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">ข้อมูลสลิปการโอนเงิน</h4>
                          <SlipVerificationButton
                            orderId={selectedOrder._id}
                            slipUrl={selectedOrder.slipUrl}
                            onVerificationComplete={handleSlipVerificationComplete}
                            size="sm"
                            variant="primary"
                          />
                        </div>
                        
                        {/* แสดงสลิป */}
                        <div className="mb-3">
                          <img 
                            src={selectedOrder.slipUrl} 
                            alt="สลิปการโอนเงิน" 
                            className="max-w-full h-auto rounded-lg border"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>

                        {/* แสดงข้อมูลการตรวจสอบสลิป */}
                        {selectedOrder.slipVerification && (
                          <SlipVerificationDisplay 
                            verification={selectedOrder.slipVerification}
                            className="mt-3"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* แสดงรายการสินค้าอย่างละเอียด */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">รายการสินค้า</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={item.productId} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                <h5 className="text-lg font-semibold text-gray-900">{item.name}</h5>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500">ราคาต่อหน่วย</label>
                                  <p className="text-gray-900 font-semibold">฿{item.price.toLocaleString()}</p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500">จำนวน</label>
                                  <p className="text-gray-900">{item.quantity}</p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500">ยอดรวม</label>
                                  <p className="text-gray-900 font-semibold">฿{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                                {item.unitLabel && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500">หน่วย</label>
                                    <p className="text-gray-900">{item.unitLabel}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* แสดงตัวเลือกสินค้า (หากมี) */}
                              {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <label className="block text-xs font-medium text-gray-500 mb-2">ตัวเลือกที่เลือก</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(item.selectedOptions).map(([key, value]) => (
                                      <div key={key} className="bg-white px-3 py-2 rounded border border-gray-200">
                                        <span className="text-xs font-medium text-gray-500">{key}:</span>
                                        <span className="text-sm text-gray-900 ml-2">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* สรุปยอดรวม */}
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between text-lg font-semibold text-green-800">
                        <span>ยอดรวมทั้งหมด</span>
                        <span>฿{selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        รวมค่าจัดส่ง: ฿{selectedOrder.shippingFee.toLocaleString()}
                        {selectedOrder.discount && selectedOrder.discount > 0 && (
                          <span className="ml-4">ส่วนลด: -฿{selectedOrder.discount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* รูปหลักฐานการแพ็ก */}
                  <div>
                    <PackingImageGallery
                      orderId={selectedOrder._id}
                      packingProofs={selectedOrder.packingProofs || []}
                      isAdmin={true}
                      onImagesUpdated={(updatedProofs) => {
                        setSelectedOrder(prev => prev ? { ...prev, packingProofs: updatedProofs } : null);
                        // รีเฟรชข้อมูลออเดอร์
                        fetchOrders();
                      }}
                    />
                  </div>

                  {/* ข้อมูลการเคลม (ถ้ามี) */}
                  {selectedOrder.claimInfo && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    ข้อมูลการเคลม
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เคลม</label>
                            <p className="text-gray-900 bg-white p-2 rounded border">
                              {new Date(selectedOrder.claimInfo.claimDate).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Bangkok'
                              })}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการเคลม</label>
                            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                              selectedOrder.claimInfo.claimStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              selectedOrder.claimInfo.claimStatus === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {selectedOrder.claimInfo.claimStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            รอดำเนินการ
                          </span>
                        ) :
                               selectedOrder.claimInfo.claimStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            ไม่อนุมัติ
                          </span>
                        )}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผลในการเคลม</label>
                          <div className="bg-white p-3 rounded border border-red-200">
                            <p className="text-gray-900">{selectedOrder.claimInfo.claimReason}</p>
                          </div>
                        </div>

                        {/* รูปภาพการเคลมจากลูกค้า */}
                        {selectedOrder.claimInfo.claimImages && selectedOrder.claimInfo.claimImages.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              รูปภาพประกอบการเคลม ({selectedOrder.claimInfo.claimImages.length} รูป)
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {selectedOrder.claimInfo.claimImages.map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`รูปประกอบการเคลม ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-red-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  คลิกที่รูปเพื่อดูขนาดเต็ม
                </p>
                          </div>
                        )}

                        {/* การตอบกลับจากแอดมิน */}
                        {selectedOrder.claimInfo.adminResponse && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">การตอบกลับของแอดมิน</label>
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                              <p className="text-gray-900">{selectedOrder.claimInfo.adminResponse}</p>
                              {selectedOrder.claimInfo.responseDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  ตอบกลับเมื่อ: {new Date(selectedOrder.claimInfo.responseDate).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Bangkok'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ฟอร์มแก้ไข */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">แก้ไขสถานะออเดอร์</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะปัจจุบัน</label>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[selectedOrder.status]}`}>
                          {statusIcons[selectedOrder.status]} {statusLabels[selectedOrder.status]}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">เปลี่ยนสถานะ</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- เลือกสถานะใหม่ --</option>
                          <option value="pending">รอดำเนินการ</option>
                          <option value="confirmed">ยืนยันออเดอร์แล้ว</option>
                          <option value="ready">พร้อมส่ง</option>
                          <option value="shipped">จัดส่งแล้ว</option>
                          <option value="delivered">ส่งสำเร็จ</option>
                          <option value="cancelled">ยกเลิก</option>
                          <option value="claimed">เคลมสินค้า</option>
                          <option value="failed">ส่งไม่สำเร็จ</option>
                          <option value="claim_approved">เคลมสำเร็จ</option>
                          <option value="claim_rejected">เคลมถูกปฏิเสธ</option>
                        </select>
                      </div>

                      {/* Enhanced Shipping Information Section */}
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          ข้อมูลการจัดส่ง
                        </h4>
                        
                        {/* Current Values Display */}
                        {(selectedOrder.trackingNumber || selectedOrder.shippingProvider) && (
                          <div className="mb-3 p-2 bg-white rounded border">
                            <p className="text-xs text-gray-600 mb-1">ข้อมูลปัจจุบัน:</p>
                            {selectedOrder.shippingProvider && (
                              <p className="text-sm"><span className="font-medium">ขนส่ง:</span> {selectedOrder.shippingProvider}</p>
                            )}
                            {selectedOrder.trackingNumber && (
                              <p className="text-sm"><span className="font-medium">เลขแทรค:</span> {selectedOrder.trackingNumber}</p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              บริษัทขนส่ง
                              <span className="text-xs text-gray-500 ml-1">(เช่น Kerry Express, Flash Express, J&T Express, DHL)</span>
                            </label>
                            <input
                              type="text"
                              value={editForm.shippingProvider}
                              onChange={(e) => setEditForm(prev => ({ ...prev, shippingProvider: e.target.value }))}
                              placeholder="ระบุชื่อบริษัทขนส่ง"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              list="shipping-providers"
                            />
                            <datalist id="shipping-providers">
                              <option value="Kerry Express" />
                              <option value="Flash Express" />
                              <option value="J&T Express" />
                              <option value="DHL" />
                              <option value="Thailand Post" />
                              <option value="Best Express" />
                              <option value="Ninja Van" />
                              <option value="SCG Express" />
                            </datalist>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              หมายเลขติดตาม (Tracking Number)
                              <span className="text-xs text-gray-500 ml-1">(เลขพัสดุสำหรับติดตาม)</span>
                            </label>
                            <input
                              type="text"
                              value={editForm.trackingNumber}
                              onChange={(e) => setEditForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                              placeholder="ใส่เลขติดตามพัสดุ"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                            />
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        {editForm.status === 'shipped' && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800 mb-2">
                              <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            เมื่อเปลี่ยนสถานะเป็น "จัดส่งแล้ว" ควรระบุข้อมูลการจัดส่งด้วย
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>



                  {/* ปุ่มบันทึก */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setEditingOrder(null);
                        setEditForm({ status: '', trackingNumber: '', shippingProvider: '' });
                        setImageFiles([]);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveOrder}
                      disabled={loading || uploadingImages}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading || uploadingImages ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal แสดงประวัติออเดอร์ของผู้ใช้ */}
      {showUserHistory && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ประวัติออเดอร์ของผู้ใช้</h3>
              <button
                onClick={() => {
                  setShowUserHistory(false);
                  setSelectedUserId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <UserOrderHistory userId={selectedUserId} />
          </div>
        </div>
      )}
      </div>
    </PermissionGate>
  );
};

export default AdminOrdersPage;