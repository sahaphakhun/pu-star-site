'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import TaxInvoiceForm from '@/components/TaxInvoiceForm';

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
  status?: 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'claimed' | 'claim_rejected';
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
  };
}

const ProfilePage = () => {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // States
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'tax-invoice'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    profileImageUrl: ''
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
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
        icon: '👑',
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
        icon: '💎',
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
        icon: '🏆',
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
        icon: '⭐',
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
        icon: '🆕',
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
    claim_rejected: 'bg-orange-100 text-orange-800'
  };

  const tabs = [
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: '👤' },
    { id: 'orders', label: 'คำสั่งซื้อ', icon: '📦' },
    { id: 'addresses', label: 'ที่อยู่', icon: '📍' },
    { id: 'tax-invoice', label: 'ใบกำกับภาษี', icon: '🧾' }
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

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append('folder', 'profile-images');
      formData.append('public_id', `profile-${user?.phoneNumber}-${Date.now()}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`การอัพโหลดรูปภาพล้มเหลว: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.secure_url) {
        setProfileData(prev => ({ ...prev, profileImageUrl: data.secure_url }));
        toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setIsUploadingImage(false);
    }
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
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden">
                {profileData.profileImageUrl ? (
                  <Image
                    src={profileData.profileImageUrl}
                    alt="รูปโปรไฟล์"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  customerLevel.icon
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">สวัสดี, {user?.name || 'ลูกค้า'}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${customerLevel.color}`}>
                    ระดับ {customerLevel.level} - {customerLevel.title}
                  </span>
                  <span className="text-sm text-gray-500">
                    ส่วนลด {customerLevel.discount}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {customerLevel.pointsToNext > 0 ? 
                  `ไปอีก ฿${customerLevel.pointsToNext.toLocaleString()} ถึงระดับ ${customerLevel.nextLevel}` :
                  'ถึงระดับสูงสุดแล้ว'
                }
              </p>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${customerLevel.pointsToNext > 0 ? 
                      (customerLevel.currentPoints / (customerLevel.currentPoints + customerLevel.pointsToNext)) * 100 : 
                      100}%` 
                  }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>ยอดซื้อรวม: ฿{(user?.totalSpent || 0).toLocaleString()}</p>
                <p>ออเดอร์ทั้งหมด: {user?.totalOrders || 0} รายการ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'orders' && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {orders.length}
                    </span>
                  )}
                  {tab.id === 'addresses' && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {addresses.length}
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
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? 'ยกเลิก' : 'แก้ไข'}
                  </button>
                </div>

                {/* Profile Image Section */}
                <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-200">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {profileData.profileImageUrl ? (
                        <Image
                          src={profileData.profileImageUrl}
                          alt="รูปโปรไฟล์"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-4xl">
                          👤
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute bottom-0 right-0">
                        <label className="cursor-pointer bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors shadow-lg">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            disabled={isUploadingImage}
                            className="hidden"
                          />
                          {isUploadingImage ? (
                            <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <p className="text-sm text-gray-500 text-center">
                      คลิกที่ไอคอนกล้องเพื่อเปลี่ยนรูปโปรไฟล์<br/>
                      (ขนาดไฟล์ไม่เกิน 5MB)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.name || 'ไม่ระบุ'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.phoneNumber || 'ไม่ระบุ'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profileData.email || 'ไม่ระบุ'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ระดับลูกค้า</label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-2 rounded-lg text-sm font-medium ${customerLevel.color}`}>
                        {customerLevel.icon} ระดับ {customerLevel.level} - {customerLevel.title}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      บันทึก
                    </button>
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

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">ที่อยู่ของฉัน</h2>
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

            {/* Tax Invoice Tab */}
            {activeTab === 'tax-invoice' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">ข้อมูลใบกำกับภาษี</h2>
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
        </div>
      </div>

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