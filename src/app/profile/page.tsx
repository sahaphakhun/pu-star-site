'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
  totalAmount: number;
  paymentMethod: 'cod' | 'transfer';
  slipUrl?: string;
  orderDate: string;
  createdAt: string;
}

const ProfilePage = () => {
  const router = useRouter();
  const { isLoggedIn, user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">ข้อมูลส่วนตัว</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">ชื่อ</label>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">เบอร์โทรศัพท์</label>
                  <p className="font-medium">{user?.phoneNumber}</p>
                </div>
                {user?.email && (
                  <div>
                    <label className="block text-sm text-gray-600">อีเมล</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">สถานะบัญชี</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">สถานะ</label>
                  <p className="font-medium">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ยืนยันตัวตนแล้ว
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">ประเภทผู้ใช้</label>
                  <p className="font-medium">
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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