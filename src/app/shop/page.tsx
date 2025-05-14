'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';

// เพิ่ม interface เพื่อระบุ _id
interface ProductWithId extends IProduct {
  _id: string;
}

const ShopPage = () => {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: {product: ProductWithId, quantity: number}}>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product: ProductWithId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[product._id]) {
        newCart[product._id] = {
          product,
          quantity: newCart[product._id].quantity + 1
        };
      } else {
        newCart[product._id] = { product, quantity: 1 };
      }
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] && newCart[productId].quantity > 1) {
        newCart[productId] = {
          ...newCart[productId],
          quantity: newCart[productId].quantity - 1
        };
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSlipFile(file);
    if (file) {
      setSlipPreview(URL.createObjectURL(file));
    } else {
      setSlipPreview(null);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert('กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่');
      return;
    }
    if (paymentMethod === 'transfer' && !slipFile) {
      alert('กรุณาแนบสลิปการโอนเงิน');
      return;
    }
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
      alert('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
      return;
    }
    let slipUrl = '';
    if (paymentMethod === 'transfer' && slipFile) {
      // อัพโหลดสลิปไป cloudinary (หรือ server)
      const formData = new FormData();
      formData.append('file', slipFile);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      slipUrl = data.secure_url;
    }
    const orderData = {
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
      slipUrl,
      items: cartItems.map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      totalAmount: calculateTotal()
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        alert('สั่งซื้อสำเร็จ!');
        setCart({});
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setPaymentMethod('cod');
        setSlipFile(null);
        setSlipPreview(null);
        setShowOrderForm(false);
      } else {
        alert('เกิดข้อผิดพลาดในการสั่งซื้อ');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ');
    }
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const totalItems = Object.values(cart).reduce(
    (count, item) => count + item.quantity,
    0
  );

  if (loading) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">รายการสินค้า</h1>
        <button 
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          <span className="mr-2">ตะกร้า</span>
          <span className="bg-white text-blue-500 rounded-full h-6 w-6 flex items-center justify-center text-sm">
            {totalItems}
          </span>
        </button>
      </div>

      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">สรุปรายการสั่งซื้อ</h2>
            
            {Object.keys(cart).length > 0 ? (
              <>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {Object.values(cart).map((item) => (
                    <div key={item.product._id} className="flex justify-between items-center mb-2 border-b pb-2">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-600">฿{item.product.price.toLocaleString()} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => removeFromCart(item.product._id)} 
                          className="bg-gray-200 px-2 rounded"
                        >
                          -
                        </button>
                        <span className="mx-2">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item.product)} 
                          className="bg-gray-200 px-2 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 mb-4">
                  <div className="flex justify-between font-bold bg-blue-50 p-2 rounded">
                    <span>รวมทั้งสิ้น:</span>
                    <span>฿{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmitOrder}>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">ชื่อลูกค้า</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">ที่อยู่สำหรับจัดส่ง</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">ช่องทางการชำระเงิน</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                        /> เก็บเงินปลายทาง
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transfer"
                          checked={paymentMethod === 'transfer'}
                          onChange={() => setPaymentMethod('transfer')}
                        /> โอนเงิน
                      </label>
                    </div>
                  </div>
                  {paymentMethod === 'transfer' && (
                    <div className="mb-3 border rounded p-3 bg-blue-50">
                      <div className="mb-2">
                        <span className="font-semibold">เลขบัญชีสำหรับโอนเงิน:</span>
                        <span className="ml-2 select-all">123-4-56789-0 ธนาคารกรุงเทพ</span>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">แนบสลิปการโอนเงิน</label>
                        <input type="file" accept="image/*" onChange={handleSlipChange} required />
                        {slipPreview && (
                          <img src={slipPreview} alt="slip preview" className="mt-2 h-32 object-contain border rounded" />
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-4 py-2 rounded-lg w-full order-2 sm:order-1"
                    >
                      ยืนยันการสั่งซื้อ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOrderForm(false)}
                      className="bg-gray-300 px-4 py-2 rounded-lg w-full order-1 sm:order-2"
                    >
                      ปิด
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <p>ยังไม่มีสินค้าในตะกร้า</p>
                <button 
                  className="mt-4 bg-gray-300 px-4 py-2 rounded-lg" 
                  onClick={() => setShowOrderForm(false)}
                >
                  เลือกสินค้า
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={product.imageUrl || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1">{product.name}</h2>
                <p className="text-xl font-bold text-blue-600 mb-2">฿{product.price.toLocaleString()}</p>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  เพิ่มลงตะกร้า
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">ไม่พบสินค้า</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage; 