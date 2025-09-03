'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AIOrderItem {
  sku: string | null;
  name: string;
  qty: number;
  variant: {
    color: string | null;
    size: string | null;
  };
  note: string | null;
}

interface AIOrderPricing {
  currency: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
}

interface AIOrderCustomer {
  name: string | null;
  phone: string | null;
  address: string | null;
}

interface AIOrder {
  _id: string;
  psid: string;
  order_status: string;
  items: AIOrderItem[];
  pricing: AIOrderPricing;
  customer: AIOrderCustomer;
  errorMessages: string[];
  aiResponse: string;
  userMessage: string;
  mappedOrderId?: string;
  mappedAt?: string;
  mappedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AIOrdersPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [aiOrders, setAiOrders] = useState<AIOrder[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  // New state for product mapping with unit selection, quantity, and options
  const [productMapping, setProductMapping] = useState<{ 
    [key: string]: { 
      [itemIndex: number]: {
        productId: string;
        unitIndex?: number; // Index of selected unit from product.units array
        quantity: number; // Override quantity
        selectedOptions?: { [optionName: string]: string }; // Selected option values
      }
    } 
  }>({});
  const [products, setProducts] = useState<any[]>([]);
  const [convertingToOrder, setConvertingToOrder] = useState<{ [key: string]: boolean }>({});
  const [syncing, setSyncing] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState('7'); // 7, 30, 90 days
  const [syncResults, setSyncResults] = useState<{
    total: number;
    new: number;
    updated: number;
    errors: number;
  } | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<{ [key: string]: boolean }>({});

  // Helper function to extract pricing from AI response
  const extractPricingFromResponse = (aiResponse: string) => {
    try {
      // Try to find pricing in ORDER_JSON format first
      const orderJsonMatch = aiResponse.match(/<ORDER_JSON>([\s\S]*?)<\/ORDER_JSON>/);
      if (orderJsonMatch) {
        const jsonData = JSON.parse(orderJsonMatch[1]);
        if (jsonData.pricing) {
          return jsonData.pricing;
        }
      }
      
      // Fallback: try to find pricing object directly in the text
      const pricingMatch = aiResponse.match(/"pricing"\s*:\s*\{[^}]*"total"\s*:\s*\d+[^}]*\}/g);
      if (pricingMatch) {
        const pricingStr = pricingMatch[0].replace(/"pricing"\s*:\s*/, '');
        return JSON.parse(pricingStr);
      }
      
      // Another fallback: find individual pricing values
      const subtotalMatch = aiResponse.match(/"subtotal"\s*:\s*(\d+)/);
      const shippingMatch = aiResponse.match(/"shipping_fee"\s*:\s*(\d+)/);
      const totalMatch = aiResponse.match(/"total"\s*:\s*(\d+)/);
      const discountMatch = aiResponse.match(/"discount"\s*:\s*(\d+)/);
      
      if (subtotalMatch || totalMatch) {
        return {
          currency: 'THB',
          subtotal: subtotalMatch ? parseInt(subtotalMatch[1]) : 0,
          discount: discountMatch ? parseInt(discountMatch[1]) : 0,
          shipping_fee: shippingMatch ? parseInt(shippingMatch[1]) : 0,
          total: totalMatch ? parseInt(totalMatch[1]) : 0
        };
      }
    } catch (error) {
      console.error('Error parsing pricing:', error);
    }
    return null;
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Toggle message expansion
  const toggleMessageExpansion = (orderId: string, messageType: 'user' | 'ai') => {
    const key = `${orderId}-${messageType}`;
    setExpandedMessages(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Product mapping functions
  const handleProductMapping = (aiOrderId: string, itemIndex: number, productId: string) => {
    if (!productId) {
      // Clear mapping if no product selected
      setProductMapping(prev => {
        const updated = { ...prev };
        if (updated[aiOrderId]) {
          delete updated[aiOrderId][itemIndex];
          if (Object.keys(updated[aiOrderId]).length === 0) {
            delete updated[aiOrderId];
          }
        }
        return updated;
      });
      return;
    }

    const aiOrder = aiOrders.find(order => order._id === aiOrderId);
    const originalQuantity = aiOrder?.items[itemIndex]?.qty || 1;

    setProductMapping(prev => ({
      ...prev,
      [aiOrderId]: {
        ...prev[aiOrderId],
        [itemIndex]: {
          productId,
          unitIndex: 0, // Default to first unit (base price)
          quantity: originalQuantity // Use original quantity from AI order
        }
      }
    }));
  };

  const handleUnitSelection = (aiOrderId: string, itemIndex: number, unitIndex: number) => {
    setProductMapping(prev => {
      if (!prev[aiOrderId]?.[itemIndex]) return prev;
      return {
        ...prev,
        [aiOrderId]: {
          ...prev[aiOrderId],
          [itemIndex]: {
            ...prev[aiOrderId][itemIndex],
            unitIndex
          }
        }
      };
    });
  };

  const handleQuantityChange = (aiOrderId: string, itemIndex: number, quantity: number) => {
    if (quantity < 1) return; // Minimum quantity is 1
    
    setProductMapping(prev => {
      if (!prev[aiOrderId]?.[itemIndex]) return prev;
      return {
        ...prev,
        [aiOrderId]: {
          ...prev[aiOrderId],
          [itemIndex]: {
            ...prev[aiOrderId][itemIndex],
            quantity
          }
        }
      };
    });
  };

  const handleOptionSelection = (aiOrderId: string, itemIndex: number, optionName: string, optionValue: string) => {
    setProductMapping(prev => {
      if (!prev[aiOrderId]?.[itemIndex]) return prev;
      return {
        ...prev,
        [aiOrderId]: {
          ...prev[aiOrderId],
          [itemIndex]: {
            ...prev[aiOrderId][itemIndex],
            selectedOptions: {
              ...prev[aiOrderId][itemIndex].selectedOptions,
              [optionName]: optionValue
            }
          }
        }
      };
    });
  };

  const getProductById = (productId: string) => {
    if (!productId || !products || products.length === 0) {
      console.warn('getProductById: Invalid productId or empty products array', { productId, productsLength: products?.length });
      return null;
    }
    const product = products.find(p => p._id === productId);
    if (!product) {
      console.warn('getProductById: Product not found', { productId, availableIds: products.map(p => p._id) });
    }
    return product;
  };

  const getSelectedUnit = (product: any, unitIndex: number) => {
    if (!product.units || product.units.length === 0) {
      return { label: 'ราคาเดี่ยว', price: product.price || 0, multiplier: 1 };
    }
    return product.units[unitIndex] || product.units[0];
  };

  const isAllItemsMapped = (aiOrder: any) => {
    const mappedItems = productMapping[aiOrder._id] || {};
    return aiOrder.items.every((item: any, index: number) => mappedItems[index]?.productId);
  };

  const calculateOrderTotal = (aiOrder: any) => {
    const mappedItems = productMapping[aiOrder._id] || {};
    let subtotal = 0;
    
    aiOrder.items.forEach((item: any, index: number) => {
      const mapping = mappedItems[index];
      if (mapping) {
        const product = getProductById(mapping.productId);
        if (product) {
          const selectedUnit = getSelectedUnit(product, mapping.unitIndex || 0);
          const unitPrice = selectedUnit.price;
          const quantity = mapping.quantity || item.qty;
          subtotal += unitPrice * quantity;
        }
      }
    });
    
    const extractedPricing = extractPricingFromResponse(aiOrder.aiResponse);
    const shippingFee = extractedPricing?.shipping_fee || aiOrder.pricing.shipping_fee || 0;
    const discount = extractedPricing?.discount || aiOrder.pricing.discount || 0;
    
    return {
      subtotal,
      discount,
      shipping_fee: shippingFee,
      total: subtotal + shippingFee - discount
    };
  };

  const convertToRegularOrder = async (aiOrder: any) => {
    if (!isAllItemsMapped(aiOrder)) {
      alert('กรุณาแมพสินค้าให้ครบทุกรายการก่อน');
      return;
    }

    // Validate all required data
    const mappedItems = productMapping[aiOrder._id] || {};
    for (let i = 0; i < aiOrder.items.length; i++) {
      const mapping = mappedItems[i];
      if (!mapping?.productId) {
        alert(`รายการที่ ${i + 1} ยังไม่ได้แมพสินค้า`);
        return;
      }
      const product = getProductById(mapping.productId);
      if (!product) {
        alert(`ไม่พบสินค้าสำหรับรายการที่ ${i + 1}: ${mapping.productId}`);
        return;
      }
    }

    setConvertingToOrder(prev => ({ ...prev, [aiOrder._id]: true }));

    try {
      const mappedItems = productMapping[aiOrder._id] || {};
      const orderItems = aiOrder.items.map((item: any, index: number) => {
        const mapping = mappedItems[index];
        const product = getProductById(mapping.productId);
        if (!product) {
          throw new Error(`Product not found for mapping: ${mapping.productId}`);
        }
        const selectedUnit = getSelectedUnit(product, mapping.unitIndex || 0);
        
        return {
          productId: mapping.productId,
          name: product.name || item.name,
          price: selectedUnit.price,
          quantity: mapping.quantity,
          unit: selectedUnit.label,
          multiplier: selectedUnit.multiplier || 1,
          variant: {
            ...item.variant,
            selectedOptions: mapping.selectedOptions || {}
          },
          note: item.note,
          originalAIItem: {
            name: item.name,
            qty: item.qty,
            variant: item.variant,
            note: item.note
          }
        };
      });

      const pricing = calculateOrderTotal(aiOrder);
      
      const orderData = {
        customerName: aiOrder.customer.name || 'ไม่ระบุ',
        customerPhone: aiOrder.customer.phone || '',
        customerAddress: aiOrder.customer.address || '',
        items: orderItems,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shippingFee: pricing.shipping_fee,
        totalAmount: pricing.total,
        status: 'pending',
        source: 'ai_order',
        originalAIOrderId: aiOrder._id,
        notes: `แปลงจาก AI Order ${aiOrder._id.slice(-8).toUpperCase()}`
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (data.success) {
        // Update the AI Order to mark it as converted
        await fetch(`/api/ai-orders/${aiOrder._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            convertedToOrderId: data.data._id,
            convertedAt: new Date().toISOString(),
            convertedBy: user?.name || 'Admin'
          }),
        });

        alert(`✅ แปลงเป็น Order สำเร็จ!\nOrder ID: ${data.data._id.slice(-8).toUpperCase()}`);
        
        // Refresh the AI orders list
        await fetchAIOrders();
        
        // Clear the product mapping for this order
        setProductMapping(prev => {
          const updated = { ...prev };
          delete updated[aiOrder._id];
          return updated;
        });
      } else {
        alert('เกิดข้อผิดพลาดในการสร้าง Order: ' + data.error);
      }
    } catch (error) {
      console.error('Error converting to order:', error);
      alert('เกิดข้อผิดพลาดในการแปลงเป็น Order');
    } finally {
      setConvertingToOrder(prev => ({ ...prev, [aiOrder._id]: false }));
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !user) {
      redirect('/login');
      return;
    }
    
    fetchAIOrders();
    fetchOrders();
    fetchProducts();
  }, [authLoading, isLoggedIn, user]);

  const fetchAIOrders = async () => {
    try {
      const response = await fetch('/api/ai-orders?status=completed'); // Only fetch completed orders
      const data = await response.json();
      if (data.success) {
        setAiOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching AI orders:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await fetch('/api/products');
      const data = await response.json();
      console.log('Products API response:', data);
      if (response.ok && Array.isArray(data)) {
        console.log('Products loaded successfully:', data.length, 'products');
        setProducts(data);
      } else {
        console.error('Invalid products data:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleMapOrder = async (aiOrderId: string, orderId: string) => {
    setSaving(prev => ({ ...prev, [aiOrderId]: true }));
    
    try {
      const response = await fetch('/api/ai-orders/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiOrderId,
          orderId,
          mappedBy: user?.name || 'Admin'
        }),
      });

      const data = await response.json();
      if (data.success) {
        // อัปเดตสถานะใน UI
        setAiOrders(prev => prev.map(order => 
          order._id === aiOrderId 
            ? { ...order, mappedOrderId: orderId, mappedAt: new Date().toISOString(), mappedBy: user?.name || 'Admin' }
            : order
        ));
        setMapping(prev => ({ ...prev, [aiOrderId]: '' }));
      } else {
        alert('เกิดข้อผิดพลาดในการแมพ: ' + data.error);
      }
    } catch (error) {
      console.error('Error mapping order:', error);
      alert('เกิดข้อผิดพลาดในการแมพ');
    } finally {
      setSaving(prev => ({ ...prev, [aiOrderId]: false }));
    }
  };

  const handleUnmapOrder = async (aiOrderId: string) => {
    setSaving(prev => ({ ...prev, [aiOrderId]: true }));
    
    try {
      const response = await fetch(`/api/ai-orders/map?aiOrderId=${aiOrderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // อัปเดตสถานะใน UI
        setAiOrders(prev => prev.map(order => 
          order._id === aiOrderId 
            ? { ...order, mappedOrderId: undefined, mappedAt: undefined, mappedBy: undefined }
            : order
        ));
      } else {
        alert('เกิดข้อผิดพลาดในการยกเลิกแมพ: ' + data.error);
      }
    } catch (error) {
      console.error('Error unmapping order:', error);
      alert('เกิดข้อผิดพลาดในการยกเลิกแมพ');
    } finally {
      setSaving(prev => ({ ...prev, [aiOrderId]: false }));
    }
  };

  const handleSyncConversations = async () => {
    setSyncing(true);
    setSyncResults(null);
    
    try {
      const response = await fetch('/api/ai-orders/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: parseInt(syncDateRange),
          adminName: user?.name || 'Admin'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSyncResults(data.data);
        // รีเฟรชรายการ AI Orders
        await fetchAIOrders();
        alert(`ซิงค์สำเร็จ!\n\nรวม: ${data.data.total} รายการ\nใหม่: ${data.data.new} รายการ\nอัปเดต: ${data.data.updated} รายการ\nข้อผิดพลาด: ${data.data.errors} รายการ`);
      } else {
        alert('เกิดข้อผิดพลาดในการซิงค์: ' + data.error);
      }
    } catch (error) {
      console.error('Error syncing conversations:', error);
      alert('เกิดข้อผิดพลาดในการซิงค์');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending_confirmation': return 'bg-yellow-100 text-yellow-800';
      case 'collecting_info': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading if not logged in (will redirect)
  if (!isLoggedIn || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Orders Management</h1>
        <p className="text-gray-600">จัดการการแมพสินค้าจาก AI Orders กับ Orders จริง</p>
      </div>

      {/* Sync Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 ซิงค์ข้อมูลจากประวัติการสนทนา</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ระยะเวลาที่ต้องการซิงค์
            </label>
            <select
              value={syncDateRange}
              onChange={(e) => setSyncDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">7 วันล่าสุด</option>
              <option value="30">30 วันล่าสุด</option>
              <option value="90">90 วันล่าสุด</option>
            </select>
          </div>
          <button
            onClick={handleSyncConversations}
            disabled={syncing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                กำลังซิงค์...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                ซิงค์ข้อมูล
              </>
            )}
          </button>
        </div>
        
        {syncResults && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">ผลการซิงค์:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">รวม:</span> {syncResults.total} รายการ
              </div>
              <div>
                <span className="font-medium text-green-700">ใหม่:</span> {syncResults.new} รายการ
              </div>
              <div>
                <span className="font-medium text-green-700">อัปเดต:</span> {syncResults.updated} รายการ
              </div>
              <div>
                <span className="font-medium text-red-700">ข้อผิดพลาด:</span> {syncResults.errors} รายการ
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 ข้อมูล AI Orders (เสร็จสิ้น)</h2>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
              ✓ แสดงเฉพาะ AI Orders ที่เสร็จสิ้นแล้ว
            </div>
            <div className="text-sm text-gray-600">
              ทั้งหมด: {aiOrders.length} รายการ
            </div>
            <div className="text-sm text-blue-600">
              📦 สินค้าในระบบ: {products.length} รายการ
            </div>
          </div>
          <div className="text-sm text-gray-500">
            📊 แสดงราคาจากข้อความ AI และข้อมูลที่บันทึกไว้
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        {aiOrders.map((aiOrder) => (
          <div key={aiOrder._id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Order #{aiOrder._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500">PSID: {aiOrder.psid}</p>
                <p className="text-sm text-gray-500">สร้างเมื่อ: {formatDate(aiOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(aiOrder.order_status)}`}>
                  {aiOrder.order_status}
                </span>
                {aiOrder.mappedOrderId && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    แมพแล้ว
                  </span>
                )}
              </div>
            </div>

            {/* ข้อมูลลูกค้า */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">ชื่อ:</span> {aiOrder.customer.name || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">โทรศัพท์:</span> {aiOrder.customer.phone || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">ที่อยู่:</span> {aiOrder.customer.address || 'ไม่ระบุ'}
                </div>
              </div>
            </div>

            {/* รายการสินค้า */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">รายการสินค้า (แมพรายสินค้า)</h4>
              <div className="space-y-3">
                {aiOrder.items.map((item, index) => {
                  const mapping = productMapping[aiOrder._id]?.[index];
                  const mappedProduct = mapping ? getProductById(mapping.productId) : null;
                  const selectedUnit = mappedProduct ? getSelectedUnit(mappedProduct, mapping.unitIndex || 0) : null;
                  
                  return (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{item.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            จำนวนเดิม: <span className="font-medium">{item.qty}</span>
                            {item.variant.color && ` | สี: ${item.variant.color}`}
                            {item.variant.size && ` | ขนาด: ${item.variant.size}`}
                            {item.note && ` | หมายเหตุ: ${item.note}`}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            SKU: {item.sku || 'ไม่มี SKU'}
                          </div>
                        </div>
                        {mappedProduct ? (
                          <div className="ml-4 text-right">
                            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-2">
                              ✓ แมพแล้ว
                            </div>
                            <div className="text-sm text-green-700">
                              {mappedProduct.name}
                            </div>
                            <div className="text-sm font-medium text-green-800">
                              {selectedUnit.label}: {selectedUnit.price?.toLocaleString()} บาท
                            </div>
                          </div>
                        ) : (
                          <div className="ml-4 text-right">
                            <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-2">
                              ยังไม่ได้แมพ
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Product mapping dropdown */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เลือกสินค้าที่ตรงกัน:
                        </label>
                        <select
                          value={mapping?.productId || ''}
                          onChange={(e) => handleProductMapping(aiOrder._id, index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">เลือกสินค้า...</option>
                          {products && products.length > 0 ? (
                            products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} - {product.price?.toLocaleString() || '0'} บาท ({product.sku || 'No SKU'})
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              {products.length === 0 ? 'ไม่มีสินค้าในระบบ' : 'กำลังโหลดสินค้า...'}
                            </option>
                          )}
                        </select>
                      </div>
                      
                      {/* Unit selection - only show if product is selected and has units */}
                      {mappedProduct && mappedProduct.units && mappedProduct.units.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            เลือกหน่วยสินค้า:
                          </label>
                          <select
                            value={mapping.unitIndex || 0}
                            onChange={(e) => handleUnitSelection(aiOrder._id, index, parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {mappedProduct.units.map((unit: any, unitIndex: number) => (
                              <option key={unitIndex} value={unitIndex}>
                                {unit.label} - {unit.price.toLocaleString()} บาท
                                {unit.multiplier && unit.multiplier !== 1 && ` (x${unit.multiplier})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* Product options selection - only show if product is selected and has options */}
                      {mappedProduct && mappedProduct.options && mappedProduct.options.length > 0 && (
                        <div className="mt-3 space-y-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            ตัวเลือกสินค้า:
                          </div>
                          {mappedProduct.options.map((option: any, optionIndex: number) => (
                            <div key={optionIndex} className="">
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                {option.name}:
                              </label>
                              <select
                                value={mapping.selectedOptions?.[option.name] || ''}
                                onChange={(e) => handleOptionSelection(aiOrder._id, index, option.name, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">เลือก{option.name}...</option>
                                {option.values
                                  .filter((value: any) => value.isAvailable !== false)
                                  .map((value: any, valueIndex: number) => (
                                    <option key={valueIndex} value={value.label}>
                                      {value.label}
                                    </option>
                                  ))
                                }
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Quantity adjustment - only show if product is selected */}
                      {mappedProduct && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ปรับจำนวน:
                          </label>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(aiOrder._id, index, (mapping.quantity || 1) - 1)}
                              disabled={mapping.quantity <= 1}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={mapping.quantity || 1}
                              onChange={(e) => handleQuantityChange(aiOrder._id, index, parseInt(e.target.value) || 1)}
                              className="w-20 px-3 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(aiOrder._id, index, (mapping.quantity || 1) + 1)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                            <span className="text-sm text-gray-600">
                              (เดิม: {item.qty})
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Show calculated line total if mapped */}
                      {mappedProduct && selectedUnit && (
                        <div className="mt-3 p-2 bg-blue-50 rounded">
                          <div className="text-sm text-blue-800">
                            📊 ยอดรวมรายการนี้: <span className="font-medium">{(selectedUnit.price * (mapping.quantity || 1)).toLocaleString()} บาท</span>
                            {mapping.quantity !== item.qty && (
                              <span className="ml-2 text-orange-600">
                                (ปรับจาก {item.qty})
                              </span>
                            )}
                            {mapping.selectedOptions && Object.keys(mapping.selectedOptions).length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                ตัวเลือก: {Object.entries(mapping.selectedOptions).map(([name, value]) => `${name}: ${value}`).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Order conversion button */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      สถานะการแมพ: {aiOrder.items.filter((_, index) => productMapping[aiOrder._id]?.[index]?.productId).length}/{aiOrder.items.length} รายการ
                    </div>
                    {isAllItemsMapped(aiOrder) && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        ✓ พร้อมแปลงเป็น Order ปกติ!
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => convertToRegularOrder(aiOrder)}
                    disabled={!isAllItemsMapped(aiOrder) || convertingToOrder[aiOrder._id]}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    {convertingToOrder[aiOrder._id] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        กำลังแปลง...
                      </>
                    ) : (
                      <>
                        🔄 แปลงเป็น Order ปกติ
                      </>
                    )}
                  </button>
                </div>
                
                {/* Show calculated totals if all items are mapped */}
                {isAllItemsMapped(aiOrder) && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <h5 className="font-medium text-green-900 mb-2">📈 ยอดรวม Order ใหม่:</h5>
                    {(() => {
                      const newPricing = calculateOrderTotal(aiOrder);
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-green-700">ยอดสินค้า:</span> {newPricing.subtotal.toLocaleString()} บาท
                          </div>
                          <div>
                            <span className="font-medium text-green-700">ส่วนลด:</span> {newPricing.discount.toLocaleString()} บาท
                          </div>
                          <div>
                            <span className="font-medium text-green-700">ค่าจัดส่ง:</span> {newPricing.shipping_fee.toLocaleString()} บาท
                          </div>
                          <div>
                            <span className="font-medium text-green-700">รวมทั้งหมด:</span> <span className="font-bold">{newPricing.total.toLocaleString()} บาท</span>
                          </div>
                        </div>
                      );
                    })()} 
                    
                    {/* Show detailed item breakdown */}
                    <div className="mt-3 pt-2 border-t border-green-200">
                      <div className="text-xs text-green-700 font-medium mb-1">รายละเอียดสินค้า:</div>
                      {aiOrder.items.map((item: any, index: number) => {
                        const mapping = productMapping[aiOrder._id]?.[index];
                        if (!mapping) return null;
                        const product = getProductById(mapping.productId);
                        if (!product) return null;
                        const selectedUnit = getSelectedUnit(product, mapping.unitIndex || 0);
                        const optionsText = mapping.selectedOptions 
                          ? Object.entries(mapping.selectedOptions)
                              .map(([name, value]) => `${name}: ${value}`)
                              .join(', ')
                          : '';
                        return (
                          <div key={index} className="text-xs text-green-600 mb-1">
                            {product.name} ({selectedUnit.label}){optionsText && ` - ${optionsText}`} x {mapping.quantity} = {(selectedUnit.price * mapping.quantity).toLocaleString()} บาท
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ราคา */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">ราคา</h4>
              {(() => {
                const extractedPricing = extractPricingFromResponse(aiOrder.aiResponse);
                const pricing = extractedPricing || aiOrder.pricing;
                return (
                  <div className="space-y-3">
                    {extractedPricing && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-2">📊 ราคาจากข้อความ AI:</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-blue-700">ยอดสินค้า:</span> {extractedPricing.subtotal?.toLocaleString() || 0} บาท
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">ส่วนลด:</span> {extractedPricing.discount?.toLocaleString() || 0} บาท
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">ค่าจัดส่ง:</span> {extractedPricing.shipping_fee?.toLocaleString() || 0} บาท
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">รวมทั้งหมด:</span> {extractedPricing.total?.toLocaleString() || 0} บาท
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">ยอดสินค้า:</span> {aiOrder.pricing.subtotal.toLocaleString()} บาท
                      </div>
                      <div>
                        <span className="font-medium">ส่วนลด:</span> {aiOrder.pricing.discount.toLocaleString()} บาท
                      </div>
                      <div>
                        <span className="font-medium">ค่าจัดส่ง:</span> {aiOrder.pricing.shipping_fee.toLocaleString()} บาท
                      </div>
                      <div>
                        <span className="font-medium">รวมทั้งหมด:</span> {aiOrder.pricing.total.toLocaleString()} บาท
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ข้อความจากผู้ใช้และ AI */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">ข้อความ</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-blue-900">ผู้ใช้:</div>
                    {aiOrder.userMessage.length > 150 && (
                      <button
                        onClick={() => toggleMessageExpansion(aiOrder._id, 'user')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {expandedMessages[`${aiOrder._id}-user`] ? 'ย่อ' : 'ดูทั้งหมด'}
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-blue-800">
                    {expandedMessages[`${aiOrder._id}-user`] || aiOrder.userMessage.length <= 150
                      ? aiOrder.userMessage
                      : truncateText(aiOrder.userMessage, 150)
                    }
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-green-900">AI:</div>
                    {aiOrder.aiResponse.length > 150 && (
                      <button
                        onClick={() => toggleMessageExpansion(aiOrder._id, 'ai')}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        {expandedMessages[`${aiOrder._id}-ai`] ? 'ย่อ' : 'ดูทั้งหมด'}
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-green-800 whitespace-pre-wrap">
                    {expandedMessages[`${aiOrder._id}-ai`] || aiOrder.aiResponse.length <= 150
                      ? aiOrder.aiResponse
                      : truncateText(aiOrder.aiResponse, 150)
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* สถานะการแปลง */}
            <div className="border-t pt-4">
              <div className="text-center text-gray-500 text-sm">
                🔄 ใช้ระบบแมพสินค้าข้างบนเพื่อแปลงเป็น Order ปกติ
              </div>
            </div>
          </div>
        ))}
      </div>

      {aiOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            ไม่มี AI Orders ที่เสร็จสิ้นแล้ว
          </div>
        </div>
      )}
    </div>
  );
}
