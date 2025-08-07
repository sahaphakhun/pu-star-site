'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import TaxInvoiceForm from '@/components/TaxInvoiceForm';
import ProfileImageUpload from '@/components/ProfileImageUpload';
import PackingImageGallery from '@/components/PackingImageGallery';
import DeliveryMethodSelector, { DeliveryMethod } from '@/components/DeliveryMethodSelector';
import { DeliveryLocation } from '@/schemas/order';

// Legacy address format from API
interface LegacyAddress {
  _id?: string;
  label: string;
  address: string; // Old format - single string
  isDefault: boolean;
}

// New address format
interface NewAddress {
  _id?: string;
  label: string;
  name: string;
  phone: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  houseNumber: string;
  lane: string;
  moo: string;
  road: string;
  isDefault: boolean;
}

// Combined type for backward compatibility
type Address = LegacyAddress | NewAddress;

interface TaxInvoiceInfo {
  companyName: string;
  taxId: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
}

interface Order {
  _id: string;
  customerName: string;
  totalAmount: number;
  orderDate: string;
  items: OrderItem[];
  paymentMethod?: 'cod' | 'transfer';
  status?: 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'claimed' | 'claim_approved' | 'claim_rejected';
  trackingNumber?: string;
  shippingProvider?: string;
  packingProofs?: Array<{
    url: string;
    type: 'image' | 'video';
    addedAt: string;
  }>;
  claimInfo?: {
    claimDate: string;
    claimReason: string;
    claimImages: string[];
    claimStatus: 'pending' | 'approved' | 'rejected';
    adminResponse?: string;
    responseDate?: string;
  };
}

interface QuoteRequest {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'quoted' | 'approved' | 'rejected';
  requestDate: string;
  quoteMessage?: string;
  quoteFileUrl?: string;
  quotedBy?: string;
  quotedAt?: string;
  taxInvoice?: {
    requestTaxInvoice: boolean;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
}

const ProfilePage = () => {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // States
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'quote-requests'>('profile');
  const [profileSubTab, setProfileSubTab] = useState<'info' | 'addresses' | 'tax-invoice'>('info');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedQuoteRequest, setSelectedQuoteRequest] = useState<QuoteRequest | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [currentQuoteForOrder, setCurrentQuoteForOrder] = useState<QuoteRequest | null>(null);
  const [orderFormData, setOrderFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'cash_on_delivery' as 'cash_on_delivery' | 'bank_transfer',
    deliveryMethod: 'standard' as DeliveryMethod,
    deliveryLocation: undefined as DeliveryLocation | undefined,
    deliveryAddress: {
      label: '',
      name: '',
      phone: '',
      province: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      houseNumber: '',
      lane: '',
      moo: '',
      road: ''
    }
  });
  
  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    profileImageUrl: ''
  });

  
  // Address states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    name: '',
    phone: '',
    province: '',
    district: '',
    subDistrict: '',
    postalCode: '',
    houseNumber: '',
    lane: '',
    moo: '',
    road: '',
    isDefault: false
  });
  
  // Claim states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimData, setClaimData] = useState({
    reason: '',
    images: [] as File[]
  });

  // Tax Invoice states
  const [taxInvoiceInfo, setTaxInvoiceInfo] = useState<TaxInvoiceInfo | null>(null);
  const [isEditingTaxInvoice, setIsEditingTaxInvoice] = useState(false);

  // States สำหรับการเลือกที่อยู่ในฟอร์มใบเสนอราคา
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);

  // Calculate real customer data from orders
  const calculateCustomerLevel = () => {
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    
    if (totalSpent >= 100000 || totalOrders >= 50) {
      return {
        level: 5,
        title: 'ลูกค้า VIP',
        discount: 10,
        nextLevel: 6,
        pointsToNext: 0,
        currentPoints: totalSpent,
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
        color: 'bg-purple-100 text-purple-800'
      };
    } else if (totalSpent >= 50000 || totalOrders >= 25) {
      return {
        level: 4,
        title: 'ลูกค้าเพชร',
        discount: 7,
        nextLevel: 5,
        pointsToNext: 100000 - totalSpent,
        currentPoints: totalSpent,
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/></svg>,
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (totalSpent >= 20000 || totalOrders >= 10) {
      return {
        level: 3,
        title: 'ลูกค้าทอง',
        discount: 5,
        nextLevel: 4,
        pointsToNext: 50000 - totalSpent,
        currentPoints: totalSpent,
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>,
        color: 'bg-yellow-100 text-yellow-800'
      };
    } else if (totalSpent >= 5000 || totalOrders >= 3) {
      return {
        level: 2,
        title: 'ลูกค้าเงิน',
        discount: 2,
        nextLevel: 3,
        pointsToNext: 20000 - totalSpent,
        currentPoints: totalSpent,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>,
        color: 'bg-gray-100 text-gray-800'
      };
    } else {
      return {
        level: 1,
        title: 'ลูกค้าใหม่',
        discount: 0,
        nextLevel: 2,
        pointsToNext: 5000 - totalSpent,
        currentPoints: totalSpent,
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>,
        color: 'bg-green-100 text-green-800'
      };
    }
  };

  const customerLevel = calculateCustomerLevel();

  const statusLabels = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันออเดอร์แล้ว',
    packing: 'กำลังแพ็คสินค้า',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    claimed: 'เคลมสินค้า',
    claim_approved: 'เคลมสำเร็จ',
    claim_rejected: 'เคลมถูกปฏิเสธ'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    packing: 'bg-orange-100 text-orange-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    claimed: 'bg-pink-100 text-pink-800',
    claim_approved: 'bg-teal-100 text-teal-800',
    claim_rejected: 'bg-orange-100 text-orange-800'
  };



  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?returnUrl=/profile');
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchProfile();
      fetchOrders();
      fetchAddresses();
      fetchTaxInvoiceInfo();
      fetchQuoteRequests();
    }
  }, [isLoggedIn, user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProfileData({
          name: data.data.name || '',
          phoneNumber: data.data.phoneNumber || '',
          email: data.data.email || '',
          profileImageUrl: data.data.profileImageUrl || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/my-orders', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/profile/addresses', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const fetchTaxInvoiceInfo = async () => {
    try {
      const res = await fetch('/api/profile/tax-invoice', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setTaxInvoiceInfo(data.data);
      }
    } catch (err) {
      console.error('Error fetching tax invoice info:', err);
    }
  };

  const fetchQuoteRequests = async () => {
    try {
      const res = await fetch('/api/quote-requests/my-quotes', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuoteRequests(data);
      }
    } catch (err) {
      console.error('Error fetching quote requests:', err);
    }
  };

  const handleUpdateTaxInvoice = async (taxData: TaxInvoiceInfo | null) => {
    if (!taxData || !taxData.companyName || !taxData.taxId) {
      toast.error('กรุณากรอกชื่อบริษัทและเลขประจำตัวผู้เสียภาษี');
      return;
    }

    try {
      const response = await fetch('/api/profile/tax-invoice', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taxData),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setTaxInvoiceInfo(data.data);
        setIsEditingTaxInvoice(false);
        toast.success('บันทึกข้อมูลใบกำกับภาษีสำเร็จ');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error updating tax invoice info:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setProfileData(prev => ({ ...prev, profileImageUrl: imageUrl }));
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('อัปเดตข้อมูลส่วนตัวสำเร็จ');
        setIsEditing(false);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    // Validate required fields
    if (!newAddress.label.trim() || !newAddress.name.trim() || !newAddress.phone.trim() || 
        !newAddress.province.trim() || !newAddress.houseNumber.trim()) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อที่อยู่, ชื่อ, เบอร์, จังหวัด, บ้านเลขที่)');
      return;
    }

    // Helper function to format address for API
    const formatAddressForAPI = (address: typeof newAddress): string => {
      const parts = [
        address.houseNumber,
        address.lane ? `ซ.${address.lane}` : '',
        address.moo ? `หมู่ ${address.moo}` : '',
        address.road ? `ถ.${address.road}` : '',
        address.subDistrict ? `ต.${address.subDistrict}` : '',
        address.district ? `อ.${address.district}` : '',
        address.province,
        address.postalCode
      ].filter(Boolean);
      return parts.join(' ');
    };

    try {
      const response = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: newAddress.label,
          address: formatAddressForAPI(newAddress),
          isDefault: newAddress.isDefault
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setAddresses(data.data || []);
        setNewAddress({
          label: '',
          name: '',
          phone: '',
          province: '',
          district: '',
          subDistrict: '',
          postalCode: '',
          houseNumber: '',
          lane: '',
          moo: '',
          road: '',
          isDefault: false
        });
        setShowAddressModal(false);
        toast.success('เพิ่มที่อยู่สำเร็จ');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการเพิ่มที่อยู่');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('เกิดข้อผิดพลาดในการเพิ่มที่อยู่');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('คุณต้องการลบที่อยู่นี้หรือไม่?')) {
      try {
        const response = await fetch(`/api/profile/addresses?id=${addressId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          setAddresses(data.data || []);
          toast.success('ลบที่อยู่สำเร็จ');
        } else {
          toast.error(data.error || 'เกิดข้อผิดพลาดในการลบที่อยู่');
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('เกิดข้อผิดพลาดในการลบที่อยู่');
      }
    }
  };

  // ฟังก์ชันตรวจสอบข้อมูลการจัดส่ง
  const validateDeliveryInfo = () => {
    // ตรวจสอบชื่อและเบอร์โทร
    if (!orderFormData.deliveryAddress.name.trim()) {
      toast.error('กรุณากรอกชื่อ-นามสกุล');
      return false;
    }
    
    if (!orderFormData.deliveryAddress.phone.trim()) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์');
      return false;
    }

    // ตรวจสอบที่อยู่
    if (selectedAddressId) {
      // ใช้ที่อยู่ที่บันทึกไว้ - ไม่ต้องตรวจสอบเพิ่มเติม
      return true;
    } else {
      // กรอกที่อยู่ใหม่ - ต้องตรวจสอบข้อมูลที่จำเป็น
      const { province, district, houseNumber, postalCode } = orderFormData.deliveryAddress;
      
      if (!province.trim()) {
        toast.error('กรุณากรอกจังหวัด');
        return false;
      }
      
      if (!district.trim()) {
        toast.error('กรุณากรอกเขต/อำเภอ');
        return false;
      }
      
      if (!houseNumber.trim()) {
        toast.error('กรุณากรอกบ้านเลขที่');
        return false;
      }
      
      if (!postalCode.trim()) {
        toast.error('กรุณากรอกรหัสไปรษณี');
        return false;
      }
      
      // ตรวจสอบรูปแบบรหัสไปรษณี
      if (!/^\d{5}$/.test(postalCode)) {
        toast.error('รหัสไปรษณีต้องเป็นตัวเลข 5 หลัก');
        return false;
      }
    }

    // ตรวจสอบการเลือกวิธีจัดส่งสำหรับ Lalamove
    if (orderFormData.deliveryMethod === 'lalamove' && !orderFormData.deliveryLocation) {
      toast.error('กรุณาเลือกตำแหน่งสำหรับการจัดส่งด้วย Lalamove');
      return false;
    }

    return true;
  };

  const handleCreateOrderFromQuote = async () => {
    // ตรวจสอบข้อมูลก่อนส่ง
    if (!validateDeliveryInfo()) {
      return;
    }
    if (!currentQuoteForOrder || !showOrderForm) {
      toast.error('ไม่พบข้อมูลใบเสนอราคา');
      return;
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    const requiredFields = {
      'ชื่อ': orderFormData.deliveryAddress.name,
      'เบอร์โทรศัพท์': orderFormData.deliveryAddress.phone,
      'บ้านเลขที่': orderFormData.deliveryAddress.houseNumber,
      'จังหวัด': orderFormData.deliveryAddress.province,
      'อำเภอ/เขต': orderFormData.deliveryAddress.district,
      'ตำบล/แขวง': orderFormData.deliveryAddress.subDistrict,
      'รหัสไปรษณีย์': orderFormData.deliveryAddress.postalCode
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        toast.error(`กรุณากรอก${field}`);
        return;
      }
    }

    try {
      // สร้างที่อยู่จัดส่งแบบเต็ม
      const fullAddress = [
        orderFormData.deliveryAddress.houseNumber,
        orderFormData.deliveryAddress.moo ? `หมู่ ${orderFormData.deliveryAddress.moo}` : '',
        orderFormData.deliveryAddress.lane ? `ซอย ${orderFormData.deliveryAddress.lane}` : '',
        orderFormData.deliveryAddress.road ? `ถนน ${orderFormData.deliveryAddress.road}` : '',
        orderFormData.deliveryAddress.subDistrict,
        orderFormData.deliveryAddress.district,
        orderFormData.deliveryAddress.province,
        orderFormData.deliveryAddress.postalCode
      ].filter(Boolean).join(' ');

      // เตรียมข้อมูลออเดอร์
      const orderData = {
        customerName: orderFormData.deliveryAddress.name,
        customerPhone: orderFormData.deliveryAddress.phone,
        customerAddress: fullAddress,
        paymentMethod: orderFormData.paymentMethod === 'cash_on_delivery' ? 'cod' : 'transfer',
        deliveryMethod: orderFormData.deliveryMethod,
        deliveryLocation: orderFormData.deliveryLocation,
        items: currentQuoteForOrder.items.map(item => ({
          productId: item.productId || 'quote-item',
          name: item.name,
          price: item.unitPrice || item.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice || item.price
        })),
        totalAmount: currentQuoteForOrder.totalAmount,
        shippingFee: 0, // ค่าจัดส่งจะคำนวณภายหลัง
        taxInvoice: currentQuoteForOrder.taxInvoice,
        fromQuoteRequest: true,
        quoteRequestId: currentQuoteForOrder._id,
        deliveryAddress: {
          name: orderFormData.deliveryAddress.name,
          phone: orderFormData.deliveryAddress.phone,
          address: fullAddress
        }
      };

      toast.loading('กำลังสร้างคำสั่งซื้อ...');

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.dismiss();
        toast.success('สร้างคำสั่งซื้อสำเร็จ!');
        
        // ปิด modal และรีเซ็ตข้อมูล
        setShowOrderForm(false);
        setOrderFormData({
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          paymentMethod: 'cash_on_delivery',
          deliveryMethod: 'standard',
          deliveryLocation: undefined,
          deliveryAddress: {
            label: '',
            name: '',
            phone: '',
            province: '',
            district: '',
            subDistrict: '',
            postalCode: '',
            houseNumber: '',
            lane: '',
            moo: '',
            road: ''
          }
        });
        
        // เปลี่ยนไปหน้าคำสั่งซื้อของฉัน
        router.push('/my-orders');
        
      } else {
        toast.dismiss();
        toast.error(result.error || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error creating order from quote:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleClaim = async () => {
    if (!selectedOrder || !claimData.reason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการเคลม');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('reason', claimData.reason);
      claimData.images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await fetch(`/api/orders/${selectedOrder._id}/claim`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev => prev.map(order => 
          order._id === selectedOrder._id ? updatedOrder : order
        ));
        setSelectedOrder(updatedOrder);
        setShowClaimModal(false);
        setClaimData({ reason: '', images: [] });
        toast.success('ส่งคำขอเคลมสำเร็จ');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'เกิดข้อผิดพลาดในการเคลม');
      }
    } catch (error) {
      console.error('Error claiming order:', error);
      toast.error('เกิดข้อผิดพลาดในการเคลม');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2 px-2 sm:px-3">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-3">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-0 flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            โปรไฟล์
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">จัดการข้อมูลส่วนตัวและคำสั่งซื้อของคุณ</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 mb-3 text-white">
          <div className="flex gap-6">
            {/* Left Section - 55% */}
            <div className="flex-1" style={{ flex: '0 0 55%' }}>
              {/* User Name */}
              <h2 className="text-xl sm:text-2xl font-bold mb-4">{user?.name || 'อนัญพร จินดา'}</h2>
              
              {/* Stats */}
              <div className="space-y-2">
                <div>
                  <p className="text-white text-opacity-90 text-xs sm:text-sm">ยอดรวมการสั่งซื้อ : ฿{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white text-opacity-90 text-xs sm:text-sm">ออเดอร์ทั้งหมด : {orders.length}</p>
                </div>
              </div>
            </div>
            
            {/* Right Section - 45% */}
            <div className="flex-1 flex flex-col justify-center items-center" style={{ flex: '0 0 45%' }}>
              {/* Level Badge */}
              <div className="bg-white bg-opacity-90 text-gray-800 px-3 py-2 rounded-full border border-gray-200 mb-3 text-center">
                <span className="text-xs sm:text-sm font-medium">ระดับ {customerLevel.level} – {customerLevel.title}</span>
              </div>
              
              {/* Progress Goal */}
              <div className="text-center">
                <p className="text-white text-opacity-90 text-xs sm:text-sm">
                  {customerLevel.pointsToNext > 0 ? 
                    `ไปอีก ฿${customerLevel.pointsToNext.toLocaleString()} ถึงระดับ ${customerLevel.nextLevel}` :
                    'ถึงระดับสูงสุดแล้ว'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Menu Grid - Minimal Design */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
          <div className="p-3 sm:p-4">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 xl:grid xl:grid-cols-5">
              {/* ข้อมูลส่วนตัว */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setProfileSubTab('info');
                }}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 touch-manipulation w-[30%] md:w-[30%] xl:w-auto ${
                  activeTab === 'profile' && profileSubTab === 'info'
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-center">ข้อมูลส่วนตัว</span>
              </button>

              {/* คำสั่งซื้อ */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 touch-manipulation relative w-[30%] md:w-[30%] xl:w-auto ${
                  activeTab === 'orders'
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-center">ค่าสั่งซื้อ</span>
                {orders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs sm:text-sm w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-semibold">
                    {orders.length}
                  </span>
                )}
              </button>

              {/* ใบเสนอราคา */}
              <button
                onClick={() => setActiveTab('quote-requests')}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 touch-manipulation relative w-[30%] md:w-[30%] xl:w-auto ${
                  activeTab === 'quote-requests'
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-center">ใบเสนอราคา</span>
                {quoteRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs sm:text-sm w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-semibold">
                    {quoteRequests.length}
                  </span>
                )}
              </button>

              {/* ที่อยู่ */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setProfileSubTab('addresses');
                }}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 touch-manipulation relative w-[30%] md:w-[30%] xl:w-auto ${
                  activeTab === 'profile' && profileSubTab === 'addresses'
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-center">ที่อยู่</span>
                {addresses.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs sm:text-sm w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-semibold">
                    {addresses.length}
                  </span>
                )}
              </button>

              {/* ใบกำกับภาษี */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setProfileSubTab('tax-invoice');
                }}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 touch-manipulation w-[30%] md:w-[30%] xl:w-auto ${
                  activeTab === 'profile' && profileSubTab === 'tax-invoice'
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-medium text-center">ใบกำกับภาษี</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-3">
                {/* Profile Content */}
                {profileSubTab === 'info' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">ข้อมูลส่วนตัว</h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-1 text-xs touch-manipulation"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>แก้ไขข้อมูล</span>
                        </button>
                      )}
                    </div>

                {/* Profile Image Section */}
                <div className="pb-3 border-b border-gray-200">
                  <div className="text-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  รูปโปรไฟล์
                </h4>
                  </div>
                  
                  <ProfileImageUpload
                    currentImageUrl={profileData.profileImageUrl}
                    onImageUpload={handleImageUpload}
                    isEditing={isEditing}
                    phoneNumber={user?.phoneNumber}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>ชื่อ</span>
                      </span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm touch-manipulation"
                        placeholder="กรุณาใส่ชื่อของคุณ"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-900 font-medium text-sm">{profileData.name || 'ไม่ระบุ'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>เบอร์โทรศัพท์</span>
                      </span>
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm touch-manipulation"
                        placeholder="เช่น 0812345678"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-900 font-medium text-sm">{profileData.phoneNumber || 'ไม่ระบุ'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span>อีเมล</span>
                      </span>
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm touch-manipulation"
                        placeholder="เช่น example@email.com"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-900 font-medium text-sm">{profileData.email || 'ไม่ระบุ'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span>ระดับลูกค้า</span>
                      </span>
                    </label>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded p-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${customerLevel.color}`}>
                        <span className="flex items-center">{customerLevel.icon}</span>
                        <span>ระดับ {customerLevel.level} - {customerLevel.title}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all duration-200 font-medium text-xs touch-manipulation"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md text-xs touch-manipulation"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                )}
                  </div>
                )}

                {/* Addresses Sub Tab */}
                {profileSubTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">ที่อยู่ของฉัน</h3>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        + เพิ่มที่อยู่
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(address => (
                        <div
                          key={address._id}
                          className="bg-gray-50 rounded-lg p-4 relative"
                        >
                          {address.isDefault && (
                            <span className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                              ค่าเริ่มต้น
                            </span>
                          )}
                          
                          <h3 className="font-medium text-gray-900 mb-2">{address.label}</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {'address' in address ? address.address : 
                              [
                                address.houseNumber,
                                address.lane ? `ซ.${address.lane}` : '',
                                address.moo ? `หมู่ ${address.moo}` : '',
                                address.road ? `ถ.${address.road}` : '',
                                address.subDistrict ? `ต.${address.subDistrict}` : '',
                                address.district ? `อ.${address.district}` : '',
                                address.province,
                                address.postalCode
                              ].filter(Boolean).join(' ')
                            }
                          </p>
                          
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleDeleteAddress(address._id!)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tax Invoice Sub Tab */}
                {profileSubTab === 'tax-invoice' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">ข้อมูลใบกำกับภาษี</h3>
                      {taxInvoiceInfo && !isEditingTaxInvoice && (
                        <button
                          onClick={() => setIsEditingTaxInvoice(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          แก้ไข
                        </button>
                      )}
                    </div>

                    {!taxInvoiceInfo && !isEditingTaxInvoice ? (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีข้อมูลใบกำกับภาษี</h3>
                        <p className="text-gray-600 mb-4">บันทึกข้อมูลใบกำกับภาษีเพื่อใช้ในการสั่งซื้อครั้งต่อไป</p>
                        <button
                          onClick={() => setIsEditingTaxInvoice(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          เพิ่มข้อมูลใบกำกับภาษี
                        </button>
                      </div>
                    ) : isEditingTaxInvoice ? (
                      <div className="space-y-6">
                        <TaxInvoiceForm
                          onTaxInvoiceChange={handleUpdateTaxInvoice}
                          className=""
                          initialRequestTaxInvoice={true}
                        />
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setIsEditingTaxInvoice(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : taxInvoiceInfo && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท/นิติบุคคล</label>
                            <p className="text-gray-900 font-medium">{taxInvoiceInfo.companyName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                            <p className="text-gray-900 font-mono">{taxInvoiceInfo.taxId}</p>
                          </div>
                          {taxInvoiceInfo.companyAddress && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                              <p className="text-gray-900">{taxInvoiceInfo.companyAddress}</p>
                            </div>
                          )}
                          {taxInvoiceInfo.companyPhone && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                              <p className="text-gray-900">{taxInvoiceInfo.companyPhone}</p>
                            </div>
                          )}
                          {taxInvoiceInfo.companyEmail && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                              <p className="text-gray-900">{taxInvoiceInfo.companyEmail}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                    คำสั่งซื้อของฉัน
                  </h2>
                  <p className="text-xs text-gray-500">{orders.length} รายการ</p>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-gray-400 mb-3">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">ยังไม่มีคำสั่งซื้อ</h3>
                    <p className="text-xs text-gray-600 mb-3">เริ่มต้นการช้อปปิ้งกับเราได้เลย</p>
                    <button
                      onClick={() => window.location.href = '/shop'}
                      className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-xs touch-manipulation"
                    >
                      เริ่มช้อปปิ้ง
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {orders.map(order => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-300 cursor-pointer touch-manipulation"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900 text-sm">#{order._id.slice(-8).toUpperCase()}</span>
                          <span className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        
                        {order.status && (
                          <div className="mb-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                              {statusLabels[order.status]}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-blue-600 font-bold text-base sm:text-lg mb-1">฿{order.totalAmount.toLocaleString()}</div>
                        <p className="text-xs sm:text-sm text-gray-600">{order.items.length} รายการ</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quote Requests Tab */}
            {activeTab === 'quote-requests' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ประวัติการขอใบเสนอราคา
                  </h2>
                  <p className="text-xs text-gray-500">{quoteRequests.length} รายการ</p>
                </div>

                {quoteRequests.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-gray-400 mb-3">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">ยังไม่มีการขอใบเสนอราคา</h3>
                    <p className="text-xs text-gray-600 mb-3">ไปที่หน้าเลือกสินค้าเพื่อขอใบเสนอราคา</p>
                    <button
                      onClick={() => window.location.href = '/shop'}
                      className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors text-xs touch-manipulation"
                    >
                      ขอใบเสนอราคา
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {quoteRequests.map(quote => (
                      <motion.div
                        key={quote._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-300 cursor-pointer touch-manipulation"
                        onClick={() => setSelectedQuoteRequest(quote)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900 text-sm">#{quote._id.slice(-8).toUpperCase()}</span>
                          <span className="text-xs text-gray-500">{new Date(quote.requestDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        
                        <div className="mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            quote.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                            quote.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {quote.status === 'pending' ? 'รอดำเนินการ' :
                             quote.status === 'quoted' ? 'ได้รับใบเสนอราคาแล้ว' :
                             quote.status === 'approved' ? 'อนุมัติแล้ว' :
                             'ปฏิเสธ'}
                          </span>
                        </div>
                        
                        <div className="text-purple-600 font-bold text-base sm:text-lg mb-1">฿{quote.totalAmount.toLocaleString()}</div>
                        <p className="text-xs sm:text-sm text-gray-600">{quote.items.length} รายการ</p>
                        
                        {quote.status === 'quoted' && (
                          <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            ใบเสนอราคาพร้อมแล้ว
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Quote Request Detail Modal */}
      <AnimatePresence>
        {selectedQuoteRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setSelectedQuoteRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg sm:rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ใบเสนอราคา #{selectedQuoteRequest._id.slice(-8).toUpperCase()}
                  </h2>
                  <button 
                    onClick={() => setSelectedQuoteRequest(null)} 
                    className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Quote Status */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลการขอใบเสนอราคา</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">สถานะ</p>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                        selectedQuoteRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedQuoteRequest.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                        selectedQuoteRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedQuoteRequest.status === 'pending' ? 'รอดำเนินการ' :
                         selectedQuoteRequest.status === 'quoted' ? 'ได้รับใบเสนอราคาแล้ว' :
                         selectedQuoteRequest.status === 'approved' ? 'อนุมัติแล้ว' :
                         'ปฏิเสธ'}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">วันที่ขอ</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedQuoteRequest.requestDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Bangkok'
                        })}
                      </p>
                    </div>

                    {selectedQuoteRequest.quotedAt && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">วันที่ได้รับใบเสนอราคา</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedQuoteRequest.quotedAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Bangkok'
                          })}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-600 mb-1">ชื่อผู้ติดต่อ</p>
                      <p className="font-medium text-gray-900">{selectedQuoteRequest.customerName}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">เบอร์โทร</p>
                      <p className="font-medium text-gray-900">{selectedQuoteRequest.customerPhone}</p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">ที่อยู่จัดส่ง</p>
                      <p className="font-medium text-gray-900">{selectedQuoteRequest.customerAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Quote Message from Admin */}
                {selectedQuoteRequest.quoteMessage && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      ข้อความจากแอดมิน
                    </h3>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-gray-900">{selectedQuoteRequest.quoteMessage}</p>
                    </div>
                  </div>
                )}

                {/* Quote File */}
                {selectedQuoteRequest.quoteFileUrl && (
                  <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ไฟล์ใบเสนอราคา
                    </h3>
                    <button
                      onClick={() => window.open(selectedQuoteRequest.quoteFileUrl, '_blank')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>ดาวน์โหลดใบเสนอราคา</span>
                    </button>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900">รายการสินค้า</h3>
                  {selectedQuoteRequest.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-sm text-gray-600">
                            {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                        {item.unitLabel && (
                          <p className="text-sm text-gray-600">หน่วย: {item.unitLabel}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">฿{item.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax Invoice Info */}
                {selectedQuoteRequest.taxInvoice?.requestTaxInvoice && (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ข้อมูลใบกำกับภาษี
                    </h3>
                    <div className="bg-white p-3 rounded border border-yellow-200 space-y-2">
                      {selectedQuoteRequest.taxInvoice.companyName && (
                        <p><span className="font-medium">ชื่อบริษัท:</span> {selectedQuoteRequest.taxInvoice.companyName}</p>
                      )}
                      {selectedQuoteRequest.taxInvoice.taxId && (
                        <p><span className="font-medium">เลขประจำตัวผู้เสียภาษี:</span> {selectedQuoteRequest.taxInvoice.taxId}</p>
                      )}
                      {selectedQuoteRequest.taxInvoice.companyAddress && (
                        <p><span className="font-medium">ที่อยู่:</span> {selectedQuoteRequest.taxInvoice.companyAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold">ยอดรวม</span>
                  <span className="text-xl font-bold text-purple-600">฿{selectedQuoteRequest.totalAmount.toLocaleString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 sm:mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      // เก็บข้อมูลใบเสนอราคาสำหรับสร้างออเดอร์
                      setCurrentQuoteForOrder(selectedQuoteRequest);
                      
                      // รีเซ็ต state การเลือกที่อยู่
                      setSelectedAddressId(null);
                      setShowNewAddress(addresses.length === 0);

                      // เตรียมข้อมูลสำหรับฟอร์มสั่งซื้อ
                      setOrderFormData({
                        customerName: selectedQuoteRequest.customerName,
                        customerPhone: selectedQuoteRequest.customerPhone,
                        customerAddress: selectedQuoteRequest.customerAddress,
                        paymentMethod: 'cash_on_delivery',
                        deliveryMethod: 'standard',
                        deliveryLocation: undefined,
                        deliveryAddress: {
                          label: 'บ้าน',
                          name: selectedQuoteRequest.customerName,
                          phone: selectedQuoteRequest.customerPhone,
                          province: '',
                          district: '',
                          subDistrict: '',
                          postalCode: '',
                          houseNumber: '',
                          lane: '',
                          moo: '',
                          road: ''
                        }
                      });
                      setShowOrderForm(true);
                      setSelectedQuoteRequest(null);
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    สั่งซื้อ
                  </button>
                  <button
                    onClick={() => setSelectedQuoteRequest(null)}
                    className="bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ปิด
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Form Modal (from Quote Request) */}
      <AnimatePresence>
        {showOrderForm && currentQuoteForOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowOrderForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    สั่งซื้อสินค้า
                  </h2>
                  <button 
                    onClick={() => setShowOrderForm(false)} 
                    className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Order Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">รายการสินค้า</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {currentQuoteForOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, value]) => (
                              <p key={key} className="text-sm text-gray-600">{key}: {value}</p>
                            ))}
                            <p className="text-sm text-gray-600">
                              จำนวน: {item.quantity} {item.unitLabel || 'ชิ้น'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ฿{((item.unitPrice || item.price) * item.quantity).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              ฿{(item.unitPrice || item.price).toLocaleString()}/{item.unitLabel || 'ชิ้น'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">ยอดรวมทั้งสิ้น</span>
                        <span className="text-xl font-bold text-purple-600">
                          ฿{currentQuoteForOrder.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Order Form */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">ข้อมูลการจัดส่ง</h3>
                    
                    {/* การเลือกที่อยู่ที่บันทึกไว้ */}
                    {addresses.length > 0 && !showNewAddress && (
                      <div className="mb-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกที่อยู่ที่บันทึกไว้</label>
                        {addresses.map((address: any) => (
                          <div key={address._id} className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                            selectedAddressId === address._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`} onClick={() => { 
                            setSelectedAddressId(address._id); 
                            setShowNewAddress(false);
                            
                            // อัปเดตข้อมูลฟอร์ม
                            if (typeof address.address === 'string') {
                              // Legacy format
                              setOrderFormData(prev => ({
                                ...prev,
                                customerName: address.name || prev.customerName,
                                customerPhone: address.phone || prev.customerPhone,
                                customerAddress: address.address,
                                deliveryAddress: {
                                  ...prev.deliveryAddress,
                                  label: address.label || 'ที่อยู่',
                                  name: address.name || prev.deliveryAddress.name,
                                  phone: address.phone || prev.deliveryAddress.phone
                                }
                              }));
                            } else {
                              // New format
                              setOrderFormData(prev => ({
                                ...prev,
                                customerName: address.name || prev.customerName,
                                customerPhone: address.phone || prev.customerPhone,
                                deliveryAddress: {
                                  label: address.label || 'ที่อยู่',
                                  name: address.name || prev.deliveryAddress.name,
                                  phone: address.phone || prev.deliveryAddress.phone,
                                  province: address.province || '',
                                  district: address.district || '',
                                  subDistrict: address.subDistrict || '',
                                  postalCode: address.postalCode || '',
                                  houseNumber: address.houseNumber || '',
                                  lane: address.lane || '',
                                  moo: address.moo || '',
                                  road: address.road || ''
                                }
                              }));
                            }
                          }}>
                            <div className="flex items-start space-x-3">
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === address._id}
                                onChange={() => {}}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{address.label || 'ที่อยู่'}</span>
                                  {address.isDefault && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">ค่าเริ่มต้น</span>}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {typeof address.address === 'string' ? address.address : 
                                    [address.houseNumber, address.lane ? `ซ.${address.lane}` : '', 
                                     address.moo ? `หมู่ ${address.moo}` : '', address.road ? `ถ.${address.road}` : '',
                                     address.subDistrict ? `ต.${address.subDistrict}` : '', 
                                     address.district ? `อ.${address.district}` : '', 
                                     address.province, address.postalCode].filter(Boolean).join(' ')
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium"
                          onClick={() => { 
                            setShowNewAddress(true); 
                            setSelectedAddressId(null);
                          }}
                        >
                          + กรอกที่อยู่ใหม่
                        </button>
                      </div>
                    )}
                    
                    {/* Address Form - ใช้รูปแบบเดียวกับหน้า shop */}
                    {(showNewAddress || addresses.length === 0) && (
                    <div className="space-y-4 mb-6">
                      
                      {/* 1. ชื่อ */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">1. ชื่อ</label>
                        <input
                          type="text"
                          value={orderFormData.deliveryAddress.name}
                          onChange={(e) => {
                            setOrderFormData(prev => ({ 
                              ...prev, 
                              customerName: e.target.value,
                              deliveryAddress: { ...prev.deliveryAddress, name: e.target.value }
                            }));
                          }}
                          placeholder="ชื่อ-นามสกุล"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* 2. เบอร์ */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. เบอร์โทรศัพท์</label>
                        <input
                          type="tel"
                          value={orderFormData.deliveryAddress.phone}
                          onChange={(e) => {
                            setOrderFormData(prev => ({ 
                              ...prev, 
                              customerPhone: e.target.value,
                              deliveryAddress: { ...prev.deliveryAddress, phone: e.target.value }
                            }));
                          }}
                          placeholder="เบอร์โทรศัพท์"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* 3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.province}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, province: e.target.value }
                            }))}
                            placeholder="จังหวัด"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.district}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, district: e.target.value }
                            }))}
                            placeholder="เขต/อำเภอ"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.subDistrict}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, subDistrict: e.target.value }
                            }))}
                            placeholder="แขวง/ตำบล"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.postalCode}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, postalCode: e.target.value }
                            }))}
                            placeholder="รหัสไปรษณี"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            pattern="[0-9]{5}"
                            maxLength={5}
                            required
                          />
                        </div>
                      </div>

                      {/* 4. บ้านเลขที่, ซอย, หมู่, ถนน */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">4. บ้านเลขที่, ซอย, หมู่, ถนน</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.houseNumber}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, houseNumber: e.target.value }
                            }))}
                            placeholder="บ้านเลขที่"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.lane}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, lane: e.target.value }
                            }))}
                            placeholder="ซอย"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.moo}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, moo: e.target.value }
                            }))}
                            placeholder="หมู่"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={orderFormData.deliveryAddress.road}
                            onChange={(e) => setOrderFormData(prev => ({ 
                              ...prev, 
                              deliveryAddress: { ...prev.deliveryAddress, road: e.target.value }
                            }))}
                            placeholder="ถนน"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* ปุ่มกลับไปเลือกที่อยู่เดิม */}
                      {addresses.length > 0 && (
                        <div className="flex justify-end">
                          <button 
                            type="button" 
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            onClick={() => { 
                              setShowNewAddress(false); 
                              setSelectedAddressId(null);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            เลือกจากที่อยู่เดิม
                          </button>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Delivery Method */}
                    <div className="mb-6">
                      <DeliveryMethodSelector
                        selectedMethod={orderFormData.deliveryMethod}
                        deliveryLocation={orderFormData.deliveryLocation}
                        onMethodChange={(method) => setOrderFormData(prev => ({ ...prev, deliveryMethod: method }))}
                        onLocationChange={(location) => setOrderFormData(prev => ({ ...prev, deliveryLocation: location }))}
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">วิธีการชำระเงิน</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash_on_delivery"
                            checked={orderFormData.paymentMethod === 'cash_on_delivery'}
                            onChange={(e) => setOrderFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'cash_on_delivery' | 'bank_transfer' }))}
                            className="mr-2"
                          />
                          เก็บเงินปลายทาง
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bank_transfer"
                            checked={orderFormData.paymentMethod === 'bank_transfer'}
                            onChange={(e) => setOrderFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'cash_on_delivery' | 'bank_transfer' }))}
                            className="mr-2"
                          />
                          โอนเงินผ่านธนาคาร
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowOrderForm(false)}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={async () => {
                          // Handle order submission
                          await handleCreateOrderFromQuote();
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        disabled={
                          !orderFormData.deliveryAddress.name ||
                          !orderFormData.deliveryAddress.phone ||
                          !orderFormData.deliveryAddress.houseNumber ||
                          !orderFormData.deliveryAddress.province ||
                          !orderFormData.deliveryAddress.district ||
                          !orderFormData.deliveryAddress.subDistrict ||
                          !orderFormData.deliveryAddress.postalCode
                        }
                      >
                        ยืนยันการสั่งซื้อ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-xl w-full max-h-[95vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-3">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-sm font-bold text-gray-900 pr-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                    คำสั่งซื้อ #{selectedOrder._id.slice(-8).toUpperCase()}
                  </h2>
                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="p-1.5 hover:bg-gray-100 rounded flex-shrink-0 touch-manipulation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Order Status and Shipping Info */}
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">ข้อมูลการจัดส่ง</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Order Status */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">สถานะออเดอร์</p>
                      {selectedOrder.status && (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
                          {statusLabels[selectedOrder.status]}
                        </span>
                      )}
                    </div>
                    
                    {/* Shipping Provider */}
                    {selectedOrder.shippingProvider && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">ขนส่ง</p>
                        <p className="text-sm font-medium text-gray-900">{selectedOrder.shippingProvider}</p>
                      </div>
                    )}
                    
                    {/* Tracking Number */}
                    {selectedOrder.trackingNumber && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">เลขแทรค</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-mono text-gray-900 bg-white px-3 py-2 rounded border">{selectedOrder.trackingNumber}</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.trackingNumber || '');
                              toast.success('คัดลอกเลขแทรคแล้ว');
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors"
                            title="คัดลอกเลขแทรค"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Packing Proofs from Admin */}
                {selectedOrder.packingProofs && selectedOrder.packingProofs.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      รูปภาพจากแอดมิน ({selectedOrder.packingProofs.length} รูป)
                    </h3>
                    <div className="mt-2">
                      <PackingImageGallery
                        orderId={selectedOrder._id}
                        packingProofs={selectedOrder.packingProofs.map(proof => ({
                          ...proof,
                          addedAt: new Date(proof.addedAt)
                        }))}
                        isAdmin={false}
                      />
                    </div>
                  </div>
                )}

                {/* Claim Info - แสดงเฉพาะเมื่อมีการเคลมและได้รับการอนุมัติหรือปฏิเสธแล้ว */}
                {selectedOrder.claimInfo && (selectedOrder.claimInfo.claimStatus === 'approved' || selectedOrder.claimInfo.claimStatus === 'rejected' || selectedOrder.status === 'claim_approved' || selectedOrder.status === 'claim_rejected') && (
                  <div className={`p-4 rounded-lg mb-6 border ${
                    selectedOrder.status === 'claim_approved' ? 'bg-green-50 border-green-200' :
                    selectedOrder.status === 'claim_rejected' ? 'bg-red-50 border-red-200' : 
                    'bg-pink-50 border-pink-200'
                  }`}>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className={`w-5 h-5 mr-2 ${
                        selectedOrder.status === 'claim_approved' ? 'text-green-600' :
                        selectedOrder.status === 'claim_rejected' ? 'text-red-600' : 
                        'text-pink-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      ข้อมูลการเคลม
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.claimInfo?.claimDate && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">วันที่เคลม</p>
                          <p className="font-medium text-gray-900">
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
                      )}
                      {selectedOrder.claimInfo?.claimReason && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">เหตุผลในการเคลม</p>
                          <div className="bg-white p-3 rounded border border-pink-200">
                            <p className="text-gray-900">{selectedOrder.claimInfo.claimReason}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">สถานะการเคลม</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          (selectedOrder.claimInfo?.claimStatus === 'pending' || selectedOrder.status === 'claimed') ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          (selectedOrder.claimInfo?.claimStatus === 'approved' || selectedOrder.status === 'claim_approved') ? 'bg-green-100 text-green-800 border border-green-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {(selectedOrder.claimInfo?.claimStatus === 'pending' || selectedOrder.status === 'claimed') ? (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              รอดำเนินการ
                            </span>
                          ) :
                           (selectedOrder.claimInfo?.claimStatus === 'approved' || selectedOrder.status === 'claim_approved') ? (
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
                      
                      {/* รูปภาพการเคลมที่ลูกค้าส่งไป */}
                      {selectedOrder.claimInfo?.claimImages && selectedOrder.claimInfo.claimImages.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">รูปภาพประกอบการเคลม ({selectedOrder.claimInfo?.claimImages?.length || 0} รูป)</p>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedOrder.claimInfo.claimImages.map((imageUrl, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={imageUrl}
                                  alt={`รูปประกอบการเคลม ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-pink-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
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
                      {selectedOrder.claimInfo?.adminResponse && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">การตอบกลับจากแอดมิน</p>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-gray-900">{selectedOrder.claimInfo.adminResponse}</p>
                            {selectedOrder.claimInfo?.responseDate && (
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

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-sm text-gray-600">
                            {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">฿{item.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold">ยอดรวม</span>
                  <span className="text-xl font-bold text-blue-600">฿{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ปิด
                  </button>
                  {selectedOrder.status === 'delivered' && (!selectedOrder.claimInfo || !selectedOrder.claimInfo.claimDate) && (
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="flex-1 bg-red-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base touch-manipulation"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      เคลมสินค้า
                    </button>
                  )}
                  {selectedOrder.status === 'claim_rejected' && (
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="flex-1 bg-orange-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base touch-manipulation"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      เคลมใหม่อีกครั้ง
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg sm:rounded-xl max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  เพิ่มที่อยู่ใหม่
                </h2>
                  <button 
                    onClick={() => setShowAddressModal(false)} 
                    className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อที่อยู่</label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="เช่น บ้าน, ที่ทำงาน"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 1. ชื่อ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. ชื่อ</label>
                    <input
                      type="text"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ชื่อ-นามสกุล"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 2. เบอร์ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="เบอร์โทรศัพท์"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3. จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณี</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newAddress.province}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, province: e.target.value }))}
                        placeholder="จังหวัด"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newAddress.district}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, district: e.target.value }))}
                        placeholder="เขต/อำเภอ"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newAddress.subDistrict}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, subDistrict: e.target.value }))}
                        placeholder="แขวง/ตำบล"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="รหัสไปรษณี"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* 4. บ้านเลขที่, ซอย, หมู่, ถนน */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">4. บ้านเลขที่, ซอย, หมู่, ถนน</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newAddress.houseNumber}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                        placeholder="บ้านเลขที่"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newAddress.lane}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, lane: e.target.value }))}
                        placeholder="ซอย"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newAddress.moo}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, moo: e.target.value }))}
                        placeholder="หมู่"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newAddress.road}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, road: e.target.value }))}
                        placeholder="ถนน"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">ตั้งเป็นที่อยู่เริ่มต้น</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddAddress}
                    className="flex-1 bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    เพิ่มที่อยู่
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Modal */}
      <AnimatePresence>
        {showClaimModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowClaimModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">เคลมสินค้า</h2>
                  <button onClick={() => setShowClaimModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เหตุผลในการเคลม <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={claimData.reason}
                      onChange={(e) => setClaimData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="กรุณาระบุเหตุผลในการเคลมสินค้า..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รูปภาพประกอบ (ถ้ามี)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          if (files.length > 5) {
                            toast.error('สามารถอัพโหลดได้สูงสุด 5 รูป');
                            return;
                          }
                          setClaimData(prev => ({ ...prev, images: files }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowClaimModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleClaim}
                    disabled={!claimData.reason.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    ส่งคำขอเคลม
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </div>
  );
};

export default ProfilePage;