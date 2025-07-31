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

interface Address {
  _id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

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
    name: '',
    address: '',
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

  // Mock customer level data
  const calculateCustomerLevel = () => {
    const totalSpent = user?.totalSpent || 0;
    const totalOrders = user?.totalOrders || 0;
    
    if (totalSpent >= 100000 || totalOrders >= 50) {
      return {
        level: 5,
        title: 'ลูกค้า VIP',
        discount: 10,
        nextLevel: 6,
        pointsToNext: 0,
        currentPoints: totalSpent,
        icon: '⭐',
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
        icon: '💠',
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
        icon: '🟡',
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
        icon: '⚪',
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
        icon: '🔵',
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

  const tabs = [
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: '👤' },
    { id: 'orders', label: 'คำสั่งซื้อ', icon: '🛒' },
    { id: 'quote-requests', label: 'ใบเสนอราคา', icon: '📄' }
  ];

  const profileSubTabs = [
    { id: 'info', label: 'ข้อมูลส่วนตัว', icon: '👤' },
    { id: 'addresses', label: 'ที่อยู่', icon: '📍' },
    { id: 'tax-invoice', label: 'ใบกำกับภาษี', icon: '📄' }
  ];

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
      const res = await fetch('/api/profile');
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
      const res = await fetch('/api/orders/my-orders');
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
      const res = await fetch('/api/profile/addresses');
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
      const res = await fetch('/api/profile/tax-invoice');
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
      const res = await fetch('/api/quote-requests/my-quotes');
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
    if (!newAddress.name.trim() || !newAddress.address.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const response = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: newAddress.name,
          address: newAddress.address,
          isDefault: newAddress.isDefault
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAddresses(data.data || []);
        setNewAddress({ name: '', address: '', isDefault: false });
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">โปรไฟล์</h1>
          <p className="text-gray-600">จัดการข้อมูลส่วนตัวและคำสั่งซื้อของคุณ</p>
        </div>

        {/* Customer Level Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">สวัสดี, {user?.name || 'ลูกค้า'}</h2>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${customerLevel.color}`}>
                  <span className="text-lg">{customerLevel.icon}</span>
                  <span>ระดับ {customerLevel.level} - {customerLevel.title}</span>
                </span>
                <span className="text-sm bg-green-100 text-green-800 px-3 py-2 rounded-full font-medium">
                  ส่วนลด {customerLevel.discount}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">
                  {customerLevel.pointsToNext > 0 ? 
                    `ไปอีก ฿${customerLevel.pointsToNext.toLocaleString()} ถึงระดับ ${customerLevel.nextLevel}` :
                    'ถึงระดับสูงสุดแล้ว'
                  }
                </p>
                <div className="w-40 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${customerLevel.pointsToNext > 0 ? 
                        (customerLevel.currentPoints / (customerLevel.currentPoints + customerLevel.pointsToNext)) * 100 : 
                        100}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">ยอดซื้อรวม: <span className="text-blue-600">฿{(user?.totalSpent || 0).toLocaleString()}</span></p>
                <p className="font-medium">ออเดอร์ทั้งหมด: <span className="text-purple-600">{user?.totalOrders || 0} รายการ</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="grid grid-cols-3 md:flex md:space-x-8 px-3 md:px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center md:justify-start md:space-x-2 md:flex-row flex-col py-3 md:py-4 px-1 md:px-2 border-b-2 font-medium text-xs md:text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm md:text-lg mb-1 md:mb-0">{tab.icon}</span>
                  <span className="text-center leading-tight">{tab.label}</span>
                  {tab.id === 'orders' && (
                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs md:ml-2 mt-1 md:mt-0">
                      {orders.length}
                    </span>
                  )}
                  {tab.id === 'quote-requests' && (
                    <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs md:ml-2 mt-1 md:mt-0">
                      {quoteRequests.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">

                {/* Profile Sub Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="grid grid-cols-3 md:flex md:space-x-8" aria-label="Profile Tabs">
                    {profileSubTabs.map((subTab) => (
                      <button
                        key={subTab.id}
                        onClick={() => setProfileSubTab(subTab.id as any)}
                        className={`flex items-center justify-center md:justify-start md:space-x-2 md:flex-row flex-col py-2.5 md:py-3 px-1 border-b-2 font-medium text-xs md:text-sm ${
                          profileSubTab === subTab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm md:text-lg mb-1 md:mb-0">{subTab.icon}</span>
                        <span className="text-center leading-tight">{subTab.label}</span>
                        {subTab.id === 'addresses' && (
                          <span className="bg-green-100 text-green-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs md:ml-2 mt-1 md:mt-0">
                            {addresses.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Profile Sub Tab Content */}
                {profileSubTab === 'info' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-900">ข้อมูลส่วนตัว</h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>แก้ไขข้อมูล</span>
                        </button>
                      )}
                    </div>

                {/* Profile Image Section */}
                <div className="pb-6 border-b border-gray-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">รูปโปรไฟล์</h3>
                  </div>
                  
                  <ProfileImageUpload
                    currentImageUrl={profileData.profileImageUrl}
                    onImageUpload={handleImageUpload}
                    isEditing={isEditing}
                    phoneNumber={user?.phoneNumber}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="กรุณาใส่ชื่อของคุณ"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-900 font-medium">{profileData.name || 'ไม่ระบุ'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="เช่น 0812345678"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-900 font-medium">{profileData.phoneNumber || 'ไม่ระบุ'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="เช่น example@email.com"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-900 font-medium">{profileData.email || 'ไม่ระบุ'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span>ระดับลูกค้า</span>
                      </span>
                    </label>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                      <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${customerLevel.color}`}>
                        <span className="text-lg">{customerLevel.icon}</span>
                        <span>ระดับ {customerLevel.level} - {customerLevel.title}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
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
                          <p className="text-sm text-gray-600 mb-4">{address.address}</p>
                          
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
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
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">คำสั่งซื้อของฉัน</h2>
                  <p className="text-sm text-gray-500">{orders.length} รายการ</p>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีคำสั่งซื้อ</h3>
                    <p className="text-gray-600">เริ่มต้นการช้อปปิ้งกับเราได้เลย</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map(order => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                        className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">#{order._id.slice(-8).toUpperCase()}</span>
                          <span className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        
                        {order.status && (
                          <div className="mb-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                              {statusLabels[order.status]}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-blue-600 font-bold text-lg mb-2">฿{order.totalAmount.toLocaleString()}</div>
                        <p className="text-sm text-gray-600">{order.items.length} รายการ</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quote Requests Tab */}
            {activeTab === 'quote-requests' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">ประวัติการขอใบเสนอราคา</h2>
                  <p className="text-sm text-gray-500">{quoteRequests.length} รายการ</p>
                </div>

                {quoteRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีการขอใบเสนอราคา</h3>
                    <p className="text-gray-600">ไปที่หน้าเลือกสินค้าเพื่อขอใบเสนอราคา</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quoteRequests.map(quote => (
                      <motion.div
                        key={quote._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                        className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                        onClick={() => setSelectedQuoteRequest(quote)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">#{quote._id.slice(-8).toUpperCase()}</span>
                          <span className="text-sm text-gray-500">{new Date(quote.requestDate).toLocaleDateString('th-TH')}</span>
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
                        
                        <div className="text-purple-600 font-bold text-lg mb-2">฿{quote.totalAmount.toLocaleString()}</div>
                        <p className="text-sm text-gray-600">{quote.items.length} รายการ</p>
                        
                        {quote.status === 'quoted' && (
                          <div className="mt-2 text-xs text-blue-600">
                            📋 ใบเสนอราคาพร้อมแล้ว
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
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedQuoteRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    การขอใบเสนอราคา #{selectedQuoteRequest._id.slice(-8).toUpperCase()}
                  </h2>
                  <button onClick={() => setSelectedQuoteRequest(null)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedQuoteRequest(null)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ปิด
                  </button>
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
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    คำสั่งซื้อ #{selectedOrder._id.slice(-8).toUpperCase()}
                  </h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Order Status and Shipping Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลการจัดส่ง</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Order Status */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">สถานะออเดอร์</p>
                      {selectedOrder.status && (
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
                          {statusLabels[selectedOrder.status]}
                        </span>
                      )}
                    </div>
                    
                    {/* Shipping Provider */}
                    {selectedOrder.shippingProvider && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">ขนส่ง</p>
                        <p className="font-medium text-gray-900">{selectedOrder.shippingProvider}</p>
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
                          {(selectedOrder.claimInfo?.claimStatus === 'pending' || selectedOrder.status === 'claimed') ? '⏳ รอดำเนินการ' :
                           (selectedOrder.claimInfo?.claimStatus === 'approved' || selectedOrder.status === 'claim_approved') ? '✅ อนุมัติแล้ว' : '❌ ไม่อนุมัติ'}
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
                          <p className="text-xs text-gray-500 mt-2">💡 คลิกที่รูปเพื่อดูขนาดเต็ม</p>
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
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ปิด
                  </button>
                  {selectedOrder.status === 'delivered' && (!selectedOrder.claimInfo || !selectedOrder.claimInfo.claimDate) && (
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      เคลมสินค้า
                    </button>
                  )}
                  {selectedOrder.status === 'claim_rejected' && (
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
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
              className="bg-white rounded-xl max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">เพิ่มที่อยู่ใหม่</h2>
                  <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                      value={newAddress.name}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="เช่น บ้าน, ที่ทำงาน"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
                    <textarea
                      value={newAddress.address}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      placeholder="ที่อยู่ละเอียด"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddAddress}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
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

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowClaimModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleClaim}
                    disabled={!claimData.reason.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
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