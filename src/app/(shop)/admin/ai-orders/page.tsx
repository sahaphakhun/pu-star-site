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
  
  // New state for filtering and sorting
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, draft, completed, etc.
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, yesterday, week
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = newest first
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('compact'); // compact or full view
  const [groupByDate, setGroupByDate] = useState<boolean>(true); // group orders by date
  
  // State for mapping AI Orders to real Orders
  const [mappingMode, setMappingMode] = useState<{ [key: string]: boolean }>({});
  const [productMapping, setProductMapping] = useState<{ [key: string]: { [key: number]: { productId: string; quantity: number; selectedOptions: any; discount: number; unitIndex?: number; } } }>({});
  const [mappingLoading, setMappingLoading] = useState<{ [key: string]: boolean }>({});
  const [createOrderLoading, setCreateOrderLoading] = useState<{ [key: string]: boolean }>({});

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
    setExpandedMessages((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Product mapping functions
  const handleProductMapping = (aiOrderId: string, itemIndex: number, productId: string) => {
    if (!productId) {
      // Clear mapping if no product selected
      setProductMapping((prev: any) => {
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

    const aiOrder = aiOrders.find((order: any) => order._id === aiOrderId);
    const originalQuantity = aiOrder?.items[itemIndex]?.qty || 1;

    setProductMapping((prev: any) => ({
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
    setProductMapping((prev: any) => {
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
    
    setProductMapping((prev: any) => {
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
    setProductMapping((prev: any) => {
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

  const handleDiscountChange = (aiOrderId: string, itemIndex: number, discount: number) => {
    if (discount < 0) return; // Minimum discount is 0
    
    setProductMapping((prev: any) => ({
      ...prev,
      [aiOrderId]: {
        ...prev[aiOrderId],
        [itemIndex]: {
          ...prev[aiOrderId][itemIndex],
          discount
        }
      }
    }));
  };

  const getProductById = (productId: string) => {
    if (!productId || !products || products.length === 0) {
      console.warn('getProductById: Invalid productId or empty products array', { productId, productsLength: products?.length });
      return null;
    }
    const product = products.find((p: any) => p._id === productId);
    if (!product) {
      console.warn('getProductById: Product not found', { productId, availableIds: products.map((p: any) => p._id) });
    }
    return product;
  };

  // ฟังก์ชันอัปเดตสถานะ AI Order
  const updateAIOrderStatus = async (aiOrderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/ai-orders?id=${aiOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_status: newStatus,
          updatedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // อัปเดตสถานะใน state
        setAiOrders((prevOrders: AIOrder[]) => 
          prevOrders.map((order: AIOrder) => 
            order._id === aiOrderId 
              ? { ...order, order_status: newStatus, updatedAt: result.data.updatedAt }
              : order
          )
        );
        
        console.log('✅ AI Order status updated successfully:', {
          aiOrderId,
          newStatus,
          updatedAt: result.data.updatedAt
        });

        // ส่ง SMS แจ้งเตือนแอดมินเมื่อสถานะเปลี่ยนเป็น completed
        if (newStatus === 'completed') {
          try {
            const response = await fetch('/api/notification/sms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `🚨 AI Order Completed!\n\nOrder ID: #${aiOrderId.slice(-8).toUpperCase()}\nสถานะ: ${newStatus}\nอัปเดตเมื่อ: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n\nกรุณาตรวจสอบในระบบ AI Orders`
              }),
            });

            if (response.ok) {
              console.log('✅ SMS notification sent for completed AI Order');
            } else {
              console.warn('⚠️ Failed to send SMS notification');
            }
          } catch (smsError) {
            console.error('❌ Error sending SMS notification:', smsError);
          }
        }
      } else {
        console.error('❌ Failed to update AI Order status:', result.error);
      }
    } catch (error) {
      console.error('❌ Error updating AI Order status:', error);
    }
  };


  // ฟังก์ชันสร้างออเดอร์จริงจาก AI Order
  const createRealOrderFromAI = async (aiOrder: AIOrder) => {
    try {
      setCreateOrderLoading(prev => ({ ...prev, [aiOrder._id]: true }));
      
      const mappedItems = productMapping[aiOrder._id] || {};
      const orderItems = aiOrder.items.map((item, index) => {
        const mapping = mappedItems[index];
        if (!mapping) return null;
        
        const product = getProductById(mapping.productId);
        if (!product) return null;
        
        const selectedUnit = getSelectedUnit(product, mapping.unitIndex || 0);
        return {
          productId: mapping.productId,
          name: product.name,
          price: selectedUnit.price,
          quantity: mapping.quantity,
          selectedOptions: mapping.selectedOptions || {},
          unitLabel: selectedUnit.label,
          unitPrice: selectedUnit.price
        };
      }).filter(item => item !== null);

      if (orderItems.length === 0) {
        alert('กรุณาแมพสินค้าอย่างน้อย 1 รายการ');
        return;
      }

      const orderData = {
        customerName: aiOrder.customer.name || 'ไม่ระบุ',
        customerPhone: aiOrder.customer.phone || 'ไม่ระบุ',
        customerAddress: aiOrder.customer.address || 'ไม่ระบุ',
        items: orderItems,
        subtotal: orderItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0),
        shippingFee: aiOrder.pricing.shipping_fee || 0,
        discount: 0, // ไม่มีส่วนลดในระดับรายการ
        totalAmount: orderItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0) + (aiOrder.pricing.shipping_fee || 0),
        paymentMethod: 'COD',
        status: 'pending',
        source: 'ai-order',
        aiOrderId: aiOrder._id,
        orderedBy: {
          userId: (user as any)?.id || '000000000000000000000000',
          name: user?.name || 'Admin',
          phone: user?.email || 'admin@winrichdynamic.com'
        }
      };

      console.log('Order data being sent:', JSON.stringify(orderData, null, 2));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // อัปเดตสถานะ AI Order เป็น completed
        await updateAIOrderStatus(aiOrder._id, 'completed');
        
        // ปิดโหมดแมพ
        setMappingMode(prev => ({ ...prev, [aiOrder._id]: false }));
        setProductMapping(prev => ({ ...prev, [aiOrder._id]: {} }));
        
        console.log('✅ Real order created successfully:', {
          aiOrderId: aiOrder._id,
          realOrderId: result.data._id
        });
        
        alert(`สร้างออเดอร์จริงสำเร็จ! ออเดอร์ #${result.data._id.slice(-8).toUpperCase()}`);
      } else {
        console.error('❌ Failed to create real order:', result);
        alert(`เกิดข้อผิดพลาดในการสร้างออเดอร์จริง: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error creating real order:', error);
      alert('เกิดข้อผิดพลาดในการสร้างออเดอร์จริง');
    } finally {
      setCreateOrderLoading(prev => ({ ...prev, [aiOrder._id]: false }));
    }
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

    setConvertingToOrder((prev: any) => ({ ...prev, [aiOrder._id]: true }));

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
          selectedOptions: mapping.selectedOptions || {},
          unitLabel: selectedUnit.label,
          unitPrice: selectedUnit.price
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
        notes: `แปลงจาก AI Order ${aiOrder._id.slice(-8).toUpperCase()}`,
        orderedBy: {
          userId: (user as any)?.id || '000000000000000000000000',
          name: user?.name || 'Admin',
          phone: user?.email || 'admin@winrichdynamic.com'
        }
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
        setProductMapping((prev: any) => {
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
      setConvertingToOrder((prev: any) => ({ ...prev, [aiOrder._id]: false }));
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
      // Fetch all AI orders, not just completed ones
      const response = await fetch('/api/ai-orders');
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
    setSaving((prev: any) => ({ ...prev, [aiOrderId]: true }));
    
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
        setAiOrders((prev: any) => prev.map((order: any) => 
          order._id === aiOrderId 
            ? { ...order, mappedOrderId: orderId, mappedAt: new Date().toISOString(), mappedBy: user?.name || 'Admin' }
            : order
        ));
        setMapping((prev: any) => ({ ...prev, [aiOrderId]: '' }));
      } else {
        alert('เกิดข้อผิดพลาดในการแมพ: ' + data.error);
      }
    } catch (error) {
      console.error('Error mapping order:', error);
      alert('เกิดข้อผิดพลาดในการแมพ');
    } finally {
      setSaving((prev: any) => ({ ...prev, [aiOrderId]: false }));
    }
  };

  const handleUnmapOrder = async (aiOrderId: string) => {
    setSaving((prev: any) => ({ ...prev, [aiOrderId]: true }));
    
    try {
      const response = await fetch(`/api/ai-orders/map?aiOrderId=${aiOrderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // อัปเดตสถานะใน UI
        setAiOrders((prev: any) => prev.map((order: any) => 
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
      setSaving((prev: any) => ({ ...prev, [aiOrderId]: false }));
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

  // Helper function to check if date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Helper function to check if date is yesterday
  const isYesterday = (dateString: string) => {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  // Helper function to check if date is within last week
  const isWithinLastWeek = (dateString: string) => {
    const date = new Date(dateString);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  };

  // Helper function to check if two orders are similar (same customer, similar items, same day)
  const areOrdersSimilar = (order1: any, order2: any) => {
    // Check if same customer
    if (order1.customer.phone !== order2.customer.phone) return false;
    
    // Check if same day
    const date1 = new Date(order1.createdAt).toDateString();
    const date2 = new Date(order2.createdAt).toDateString();
    if (date1 !== date2) return false;
    
    // Check if similar items (same number of items and similar names)
    if (order1.items.length !== order2.items.length) return false;
    
    const items1 = order1.items.map((item: any) => item.name.toLowerCase().trim()).sort();
    const items2 = order2.items.map((item: any) => item.name.toLowerCase().trim()).sort();
    
    return JSON.stringify(items1) === JSON.stringify(items2);
  };

  // Helper function to merge similar orders
  const mergeSimilarOrders = (orders: any[]) => {
    const merged: any[] = [];
    const processed = new Set<string>();
    
    orders.forEach((order, index) => {
      if (processed.has(order._id)) return;
      
      const similarOrders = [order];
      processed.add(order._id);
      
      // Find similar orders
      orders.forEach((otherOrder, otherIndex) => {
        if (index !== otherIndex && !processed.has(otherOrder._id) && areOrdersSimilar(order, otherOrder)) {
          similarOrders.push(otherOrder);
          processed.add(otherOrder._id);
        }
      });
      
      if (similarOrders.length > 1) {
        // Merge similar orders
        const mergedOrder = {
          ...order,
          _id: `merged_${order._id}`,
          mergedOrders: similarOrders,
          mergedCount: similarOrders.length,
          items: order.items, // Keep items from first order
          pricing: {
            ...order.pricing,
            total: similarOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0)
          }
        };
        merged.push(mergedOrder);
      } else {
        merged.push(order);
      }
    });
    
    return merged;
  };

  // Helper function to group orders by date
  const groupOrdersByDate = (orders: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });
    
    return groups;
  };

  // Filter and sort AI orders
  const getFilteredAndSortedAIOrders = () => {
    let filtered = [...aiOrders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      filtered = filtered.filter(order => {
        switch (dateFilter) {
          case 'today':
            return isToday(order.createdAt);
          case 'yesterday':
            return isYesterday(order.createdAt);
          case 'week':
            return isWithinLastWeek(order.createdAt);
          default:
            return true;
        }
      });
    }

    // Sort by creation date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Merge similar orders if grouping is enabled
    if (groupByDate) {
      filtered = mergeSimilarOrders(filtered);
    }

    return filtered;
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

  // Compact order card component
  const CompactOrderCard = ({ aiOrder }: { aiOrder: any }) => {
    const [expanded, setExpanded] = useState(false);
    const extractedPricing = extractPricingFromResponse(aiOrder.aiResponse);
    const pricing = extractedPricing || aiOrder.pricing;
    
    // Keep expanded state when mapping mode is active
    const shouldStayExpanded = expanded || mappingMode[aiOrder._id];
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                AI Order #{aiOrder._id.slice(-8).toUpperCase()}
                {aiOrder.mergedCount > 1 && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    รวม {aiOrder.mergedCount} ออเดอร์
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(aiOrder.order_status)}`}>
                  {aiOrder.order_status}
                </span>
                <select
                  value={aiOrder.order_status}
                  onChange={(e) => updateAIOrderStatus(aiOrder._id, e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="draft">ร่าง</option>
                  <option value="collecting_info">กำลังรวบรวมข้อมูล</option>
                  <option value="pending_confirmation">รอยืนยัน</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="canceled">ยกเลิก</option>
                </select>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">สินค้า:</span> {aiOrder.items.length} รายการ
              {aiOrder.items.slice(0, 2).map((item: any, index: number) => (
                <span key={index} className="ml-1">
                  {item.name} ({item.qty})
                  {item.variant?.color && <span className="text-xs text-gray-500"> - สี: {item.variant.color}</span>}
                  {item.variant?.size && <span className="text-xs text-gray-500"> - ขนาด: {item.variant.size}</span>}
                  {index < Math.min(aiOrder.items.length - 1, 1) && ', '}
                </span>
              ))}
              {aiOrder.items.length > 2 && <span className="text-gray-500"> และอีก {aiOrder.items.length - 2} รายการ</span>}
            </div>
            
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
              <div>
                <span className="font-medium">ลูกค้า:</span> {aiOrder.customer.name || 'ไม่ระบุ'}
              </div>
              <div>
                <span className="font-medium">โทร:</span> {aiOrder.customer.phone || 'ไม่ระบุ'}
              </div>
              <div>
                <span className="font-medium">เวลา:</span> {formatDate(aiOrder.createdAt)}
              </div>
            </div>
            
            <div className="mt-2 text-sm">
              <span className="font-medium text-gray-700">ยอดรวม:</span> 
              <span className="ml-1 font-bold text-green-600">
                {pricing.total?.toLocaleString() || 0} บาท
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {expanded ? 'ย่อ' : 'ดูรายละเอียด'}
            </button>
            
            {!mappingMode[aiOrder._id] ? (
              <button
                onClick={() => setMappingMode(prev => ({ ...prev, [aiOrder._id]: !prev[aiOrder._id] }))}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                แมพสินค้า
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => createRealOrderFromAI(aiOrder)}
                  disabled={!isAllItemsMapped(aiOrder) || createOrderLoading[aiOrder._id]}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {createOrderLoading[aiOrder._id] ? 'กำลังสร้าง...' : 'สร้างออเดอร์จริง'}
                </button>
                <button
                  onClick={() => setMappingMode(prev => ({ ...prev, [aiOrder._id]: false }))}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
        </div>
        
        {shouldStayExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* การแมพสินค้า */}
            {mappingMode[aiOrder._id] && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">แมพสินค้ากับระบบ</h4>
                <div className="space-y-3">
                  {aiOrder.items.map((item: any, index: number) => {
                    const mapping = productMapping[aiOrder._id]?.[index];
                    const selectedProduct = mapping?.productId ? getProductById(mapping.productId) : null;
                    
                    return (
                      <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            <p className="text-sm text-gray-600">
                              จำนวน: {item.qty} | 
                              สี: {item.variant?.color || 'ไม่ระบุ'} | 
                              ขนาด: {item.variant?.size || 'ไม่ระบุ'}
                            </p>
                            {item.note && (
                              <p className="text-sm text-gray-500">หมายเหตุ: {item.note}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* เลือกสินค้า */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              เลือกสินค้าจากระบบ
                            </label>
                            <select
                              value={mapping?.productId || ''}
                              onChange={(e) => handleProductMapping(aiOrder._id, index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">เลือกสินค้า</option>
                              {products.map((product: any) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ฿{product.price}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* เลือกหน่วยสินค้า */}
                          {selectedProduct && selectedProduct.units && selectedProduct.units.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                เลือกหน่วยสินค้า
                              </label>
                              <select
                                value={mapping?.unitIndex || 0}
                                onChange={(e) => handleUnitSelection(aiOrder._id, index, parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {selectedProduct.units.map((unit: any, unitIndex: number) => (
                                  <option key={unitIndex} value={unitIndex}>
                                    {unit.label} - ฿{unit.price.toLocaleString()}
                                    {unit.multiplier && unit.multiplier !== 1 && ` (x${unit.multiplier})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* จำนวน */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              จำนวน
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={mapping?.quantity || 1}
                              onChange={(e) => handleQuantityChange(aiOrder._id, index, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* ส่วนลด */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ส่วนลด (บาท)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={mapping?.discount || 0}
                              onChange={(e) => handleDiscountChange(aiOrder._id, index, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* ราคารวม */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ราคารวม
                            </label>
                            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                              {selectedProduct ? 
                                `฿${((getSelectedUnit(selectedProduct, mapping?.unitIndex || 0).price) * (mapping?.quantity || 1) - (mapping?.discount || 0)).toLocaleString()}` : 
                                '฿0'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* ตัวเลือกสินค้า (ถ้ามี) */}
                        {selectedProduct && selectedProduct.options && selectedProduct.options.length > 0 && (
                          <div className="mt-3">
                            <h6 className="text-sm font-medium text-gray-700 mb-2">ตัวเลือกสินค้า</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {selectedProduct.options.map((option: any, optionIndex: number) => (
                                <div key={optionIndex}>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {option.name}
                                  </label>
                                  <select
                                    value={mapping?.selectedOptions?.[option.name] || ''}
                                    onChange={(e) => handleOptionSelection(aiOrder._id, index, option.name, e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">เลือก{option.name}</option>
                                    {option.values.map((value: any, valueIndex: number) => {
                                      // Handle both string values and object values
                                      const displayValue = typeof value === 'string' ? value : (value.label || value.value || String(value));
                                      const optionValue = typeof value === 'string' ? value : (value.label || value.value || String(value));
                                      return (
                                        <option key={valueIndex} value={optionValue}>
                                          {displayValue}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Expanded content - simplified version of full view */}
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">รายการสินค้า</h4>
                <div className="space-y-2">
                  {aiOrder.items.map((item: any, index: number) => {
                    const mapping = productMapping[aiOrder._id]?.[index];
                    const mappedProduct = mapping ? getProductById(mapping.productId) : null;
                    
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">จำนวน: {item.qty}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.variant?.color && <span>🎨 สี: {item.variant.color} </span>}
                            {item.variant?.size && <span>📏 ขนาด: {item.variant.size} </span>}
                            {item.note && <span>📝 {item.note}</span>}
                          </div>
                        </div>
                        <div className="text-sm">
                          {mappedProduct ? (
                            <span className="text-green-600 font-medium">✓ แมพแล้ว</span>
                          ) : (
                            <span className="text-orange-600">ยังไม่ได้แมพ</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {aiOrder.mergedOrders && aiOrder.mergedOrders.length > 1 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">ออเดอร์ที่รวมกัน</h4>
                  <div className="space-y-1">
                    {aiOrder.mergedOrders.map((mergedOrder: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600 p-2 bg-purple-50 rounded">
                        #{mergedOrder._id.slice(-8).toUpperCase()} - {formatDate(mergedOrder.createdAt)} - {mergedOrder.pricing?.total?.toLocaleString() || 0} บาท
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 ข้อมูล AI Orders</h2>
        
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="draft">ร่าง</option>
              <option value="collecting_info">กำลังรวบรวมข้อมูล</option>
              <option value="pending_confirmation">รอยืนยัน</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="canceled">ยกเลิก</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="today">วันนี้</option>
              <option value="yesterday">เมื่อวาน</option>
              <option value="week">7 วันล่าสุด</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เรียงลำดับ
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">ใหม่ล่าสุด</option>
              <option value="asc">เก่าที่สุด</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แสดงผล
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'compact' | 'full')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="compact">แบบย่อ</option>
              <option value="full">แบบเต็ม</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              จัดกลุ่ม
            </label>
            <select
              value={groupByDate ? 'yes' : 'no'}
              onChange={(e) => setGroupByDate(e.target.value === 'yes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="yes">รวมออเดอร์ซ้ำ</option>
              <option value="no">แสดงทั้งหมด</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
                setSortOrder('desc');
                setViewMode('compact');
                setGroupByDate(true);
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
              📊 แสดง: {getFilteredAndSortedAIOrders().length} จาก {aiOrders.length} รายการ
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
      <div className="grid gap-4">
        {getFilteredAndSortedAIOrders().map((aiOrder) => (
          viewMode === 'compact' ? (
            <CompactOrderCard key={aiOrder._id} aiOrder={aiOrder} />
          ) : (
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
                <select
                  value={aiOrder.order_status}
                  onChange={(e) => updateAIOrderStatus(aiOrder._id, e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="draft">ร่าง</option>
                  <option value="collecting_info">กำลังรวบรวมข้อมูล</option>
                  <option value="pending_confirmation">รอยืนยัน</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="canceled">ยกเลิก</option>
                </select>
                {aiOrder.mappedOrderId && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    แมพแล้ว
                  </span>
                )}
              </div>
            </div>


            {/* การแมพสินค้า */}
            {mappingMode[aiOrder._id] && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">แมพสินค้ากับระบบ</h4>
                <div className="space-y-3">
                  {aiOrder.items.map((item: any, index: number) => {
                    const mapping = productMapping[aiOrder._id]?.[index];
                    const selectedProduct = mapping?.productId ? getProductById(mapping.productId) : null;
                    
                    return (
                      <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            <p className="text-sm text-gray-600">
                              จำนวน: {item.qty} | 
                              สี: {item.variant?.color || 'ไม่ระบุ'} | 
                              ขนาด: {item.variant?.size || 'ไม่ระบุ'}
                            </p>
                            {item.note && (
                              <p className="text-sm text-gray-500">หมายเหตุ: {item.note}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* เลือกสินค้า */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              เลือกสินค้าจากระบบ
                            </label>
                            <select
                              value={mapping?.productId || ''}
                              onChange={(e) => handleProductMapping(aiOrder._id, index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">เลือกสินค้า</option>
                              {products.map((product: any) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} - ฿{product.price}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* เลือกหน่วยสินค้า */}
                          {selectedProduct && selectedProduct.units && selectedProduct.units.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                เลือกหน่วยสินค้า
                              </label>
                              <select
                                value={mapping?.unitIndex || 0}
                                onChange={(e) => handleUnitSelection(aiOrder._id, index, parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {selectedProduct.units.map((unit: any, unitIndex: number) => (
                                  <option key={unitIndex} value={unitIndex}>
                                    {unit.label} - ฿{unit.price.toLocaleString()}
                                    {unit.multiplier && unit.multiplier !== 1 && ` (x${unit.multiplier})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* จำนวน */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              จำนวน
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={mapping?.quantity || 1}
                              onChange={(e) => handleQuantityChange(aiOrder._id, index, parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* ส่วนลด */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ส่วนลด (บาท)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={mapping?.discount || 0}
                              onChange={(e) => handleDiscountChange(aiOrder._id, index, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* ราคารวม */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ราคารวม
                            </label>
                            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                              {selectedProduct ? 
                                `฿${((getSelectedUnit(selectedProduct, mapping?.unitIndex || 0).price) * (mapping?.quantity || 1) - (mapping?.discount || 0)).toLocaleString()}` : 
                                '฿0'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* ตัวเลือกสินค้า (ถ้ามี) */}
                        {selectedProduct && selectedProduct.options && selectedProduct.options.length > 0 && (
                          <div className="mt-3">
                            <h6 className="text-sm font-medium text-gray-700 mb-2">ตัวเลือกสินค้า</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {selectedProduct.options.map((option: any, optionIndex: number) => (
                                <div key={optionIndex}>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {option.name}
                                  </label>
                                  <select
                                    value={mapping?.selectedOptions?.[option.name] || ''}
                                    onChange={(e) => handleOptionSelection(aiOrder._id, index, option.name, e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">เลือก{option.name}</option>
                                    {option.values.map((value: any, valueIndex: number) => {
                                      // Handle both string values and object values
                                      const displayValue = typeof value === 'string' ? value : (value.label || value.value || String(value));
                                      const optionValue = typeof value === 'string' ? value : (value.label || value.value || String(value));
                                      return (
                                        <option key={valueIndex} value={optionValue}>
                                          {displayValue}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* รายการสินค้า */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">รายการสินค้า</h4>
              <div className="space-y-3">
                {aiOrder.items.map((item: any, index: number) => {
                  const mapping = productMapping[aiOrder._id]?.[index];
                  const mappedProduct = mapping ? getProductById(mapping.productId) : null;
                  const selectedUnit = mappedProduct ? getSelectedUnit(mappedProduct, mapping.unitIndex || 0) : null;
                  
                  return (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{item.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            จำนวน: <span className="font-medium">{item.qty}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            {item.variant?.color && (
                              <div>🎨 สี: <span className="font-medium">{item.variant.color}</span></div>
                            )}
                            {item.variant?.size && (
                              <div>📏 ขนาด: <span className="font-medium">{item.variant.size}</span></div>
                            )}
                            {item.note && (
                              <div>📝 หมายเหตุ: <span className="font-medium">{item.note}</span></div>
                            )}
                            {item.sku && (
                              <div>🏷️ SKU: <span className="font-medium">{item.sku}</span></div>
                            )}
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
                            products.map((product: any) => (
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
                                  .map((value: any, valueIndex: number) => {
                                    // Handle both string values and object values
                                    const displayValue = typeof value === 'string' ? value : (value.label || value.value || String(value));
                                    const optionValue = typeof value === 'string' ? value : (value.label || value.value || String(value));
                                    return (
                                      <option key={valueIndex} value={optionValue}>
                                        {displayValue}
                                      </option>
                                    );
                                  })
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
                      สถานะการแมพ: {aiOrder.items.filter((_: any, index: number) => productMapping[aiOrder._id]?.[index]?.productId).length}/{aiOrder.items.length} รายการ
                    </div>
                    {isAllItemsMapped(aiOrder) && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        ✓ พร้อมแปลงเป็น Order ปกติ!
                      </div>
                    )}
                  </div>
                  {!mappingMode[aiOrder._id] ? (
                    <button
                      onClick={() => setMappingMode(prev => ({ ...prev, [aiOrder._id]: !prev[aiOrder._id] }))}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      แมพสินค้า
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => createRealOrderFromAI(aiOrder)}
                        disabled={!isAllItemsMapped(aiOrder) || createOrderLoading[aiOrder._id]}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                      >
                        {createOrderLoading[aiOrder._id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            กำลังสร้าง...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            สร้างออเดอร์จริง
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setMappingMode(prev => ({ ...prev, [aiOrder._id]: false }))}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        ยกเลิก
                      </button>
                    </div>
                  )}
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

            {/* ข้อมูลลูกค้า */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ชื่อ:</span> 
                  <span className="ml-1 text-gray-600">{aiOrder.customer.name || 'ไม่ระบุ'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">โทรศัพท์:</span> 
                  <span className="ml-1 text-gray-600">{aiOrder.customer.phone || 'ไม่ระบุ'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">ที่อยู่:</span> 
                  <span className="ml-1 text-gray-600">{aiOrder.customer.address || 'ไม่ระบุ'}</span>
                </div>
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
          )
        ))}
      </div>

      {getFilteredAndSortedAIOrders().length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {aiOrders.length === 0 
              ? 'ไม่มี AI Orders ในระบบ' 
              : 'ไม่พบ AI Orders ที่ตรงกับเงื่อนไขการกรอง'
            }
          </div>
          {aiOrders.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setDateFilter('all');
                  setSortOrder('desc');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                รีเซ็ตตัวกรอง
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
