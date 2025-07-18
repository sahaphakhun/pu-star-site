'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PackingImageGallery from '@/components/PackingImageGallery';

interface TaxInvoice {
  requestTaxInvoice: boolean;
  companyName?: string;
  taxId?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  packingProofs?: Array<{
    url: string;
    type: 'image' | 'video';
    addedAt: string;
  }>;
  totalAmount: number;
  paymentMethod: 'cod' | 'transfer';
  slipUrl?: string;
  orderDate: string;
  createdAt: string;
  taxInvoice?: TaxInvoice;
}

const ProfilePage = () => {
  const router = useRouter();
  const { isLoggedIn, user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    address: '',
    isDefault: false
  });

  useEffect(() => {
    // ถ้าไม่ได้ล็อกอิน และไม่ได้อยู่ในสถานะโหลด ให้ redirect ไปหน้าล็อกอิน
    if (!loading && !isLoggedIn) {
      router.push('/login?returnUrl=/profile');
    }
  }, [isLoggedIn, loading, router]);

  useEffect(() => {
    // ถ้าล็อกอินแล้ว ให้ดึงประวัติการสั่งซื้อ
    if (isLoggedIn && user) {
      fetchOrders();
      setNewName(user.name || '');
      setAddresses(user.addresses || []);
    }
  }, [isLoggedIn, user]);

  const fetchOrders = async () => {
    try {
      setFetchingOrders(true);
      const response = await fetch('/api/orders/my-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ:', error);
    } finally {
      setFetchingOrders(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      alert('กรุณาระบุชื่อ');
      return;
    }

    try {
      setUpdatingProfile(true);
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateProfile',
          name: newName.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEditingName(false);
        // รีเฟรชหน้าเพื่อให้ข้อมูลในบริบท Auth อัปเดต
        window.location.reload();
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setNewName(user?.name || '');
    setIsEditingName(false);
  };

  const handleAddressSubmit = async () => {
    if (!addressForm.label.trim() || !addressForm.address.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const action = editingAddress ? 'edit' : 'add';
      const payload = {
        action,
        address: addressForm,
        ...(editingAddress && { addressId: editingAddress._id })
      };

      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.addresses || []);
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({ label: '', address: '', isDefault: false });
        alert(editingAddress ? 'แก้ไขที่อยู่สำเร็จ' : 'เพิ่มที่อยู่สำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกที่อยู่');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกที่อยู่');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?')) return;

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          addressId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.addresses || []);
        alert('ลบที่อยู่สำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการลบที่อยู่');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('เกิดข้อผิดพลาดในการลบที่อยู่');
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      address: address.address,
      isDefault: address.isDefault
    });
    setShowAddressForm(true);
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm({ label: '', address: '', isDefault: false });
  };

  if (loading || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">ข้อมูลผู้ใช้</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">ข้อมูลส่วนตัว</h2>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ยืนยันตัวตนแล้ว
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ระบุชื่อของคุณ"
                    />
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updatingProfile}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
                    >
                      {updatingProfile ? 'บันทึก...' : 'บันทึก'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 font-medium">
                      {user?.name || 'ยังไม่ได้ตั้งชื่อ'}
                    </span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>แก้ไข</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-medium">{user?.phoneNumber}</span>
                </div>
              </div>
              
              {user?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 font-medium">{user.email}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทผู้ใช้</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-medium">
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สมาชิกตั้งแต่</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'ไม่ทราบ'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">ที่อยู่ที่บันทึกไว้</h2>
            <button
              onClick={() => setShowAddressForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              เพิ่มที่อยู่ใหม่
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📍</div>
              <p>ยังไม่มีที่อยู่ที่บันทึกไว้</p>
              <p className="text-sm">เพิ่มที่อยู่เพื่อความสะดวกในการสั่งซื้อ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address, index) => (
                <div key={address._id || index} className="border rounded-lg p-4 relative">
                  {address.isDefault && (
                    <span className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      ค่าเริ่มต้น
                    </span>
                  )}
                  <div className="pr-20">
                    <h3 className="font-semibold text-gray-900">{address.label}</h3>
                    <p className="text-gray-600 mt-1">{address.address}</p>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      แก้ไข
                    </button>
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
          )}
        </div>

        {/* Address Form Modal */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingAddress ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อที่อยู่ (เช่น บ้าน, ที่ทำงาน)
                  </label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ระบุชื่อที่อยู่"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ที่อยู่
                  </label>
                  <textarea
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ระบุที่อยู่ครบถ้วน"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                    ตั้งเป็นที่อยู่เริ่มต้น
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelAddressForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddressSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingAddress ? 'บันทึกการแก้ไข' : 'เพิ่มที่อยู่'}
                </button>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mb-4">ประวัติการสั่งซื้อ</h2>
        {fetchingOrders ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">กำลังโหลดประวัติการสั่งซื้อ...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between mb-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-500">รหัสคำสั่งซื้อ</p>
                    <p className="font-medium">{order._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">วันที่สั่งซื้อ</p>
                    <p className="font-medium">{formatDate(order.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ยอดรวม</p>
                    <p className="font-medium text-blue-600">฿{order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold mb-2">รายการสินค้า</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} x{item.quantity} (฿{item.price.toLocaleString()})
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">ที่อยู่จัดส่ง</h3>
                    <p className="text-gray-700">{order.customerAddress}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">วิธีการชำระเงิน</h3>
                    <p className="text-gray-700">
                      {order.paymentMethod === 'transfer' ? 'โอนเงิน' : 'เก็บเงินปลายทาง'}
                      {order.paymentMethod === 'transfer' && order.slipUrl && (
                        <a 
                          href={order.slipUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 underline"
                        >
                          ดูสลิป
                        </a>
                      )}
                    </p>
                  </div>
                </div>

                {/* Tax Invoice Info */}
                {order.taxInvoice?.requestTaxInvoice && (
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ใบกำกับภาษี
                    </h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="font-medium">นิติบุคคล/บุคคลธรรมดา:</span> {order.taxInvoice.companyName}</p>
                      <p><span className="font-medium">เลขประจำตัวผู้เสียภาษี:</span> <span className="font-mono">{order.taxInvoice.taxId}</span></p>
                    </div>
                  </div>
                )}

                {/* Packing Images */}
                {order.packingProofs && order.packingProofs.length > 0 && (
                  <div className="mt-4">
                    <PackingImageGallery
                      orderId={order._id}
                      packingProofs={order.packingProofs}
                      isAdmin={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">ยังไม่มีประวัติการสั่งซื้อ</p>
            <button 
              onClick={() => router.push('/shop')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              ไปที่หน้าร้านค้า
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 