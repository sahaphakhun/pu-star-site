'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface QuotationSettings {
  // Product-based settings
  productsRequiringQuotation: string[];
  quotationThreshold: number;
  
  // Auto-generation settings
  autoGenerateOnOrder: boolean;
  defaultValidityDays: number;
  
  // Auto-conversion settings
  autoConvertOnAcceptance: boolean;
  requireAdminApproval: boolean;
  conversionDelay: number;
  
  // Customer-based settings
  customerTypesRequiringQuotation: string[];
  
  // Notification settings
  notifyOnGeneration: boolean;
  notifyOnAcceptance: boolean;
  notifyOnConversion: boolean;
}

const defaultSettings: QuotationSettings = {
  productsRequiringQuotation: [],
  quotationThreshold: 10000,
  autoGenerateOnOrder: true,
  defaultValidityDays: 7,
  autoConvertOnAcceptance: false,
  requireAdminApproval: true,
  conversionDelay: 0,
  customerTypesRequiringQuotation: ['new', 'target'],
  notifyOnGeneration: true,
  notifyOnAcceptance: true,
  notifyOnConversion: true
};

export default function QuotationSettings() {
  const [settings, setSettings] = useState<QuotationSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/quotation');
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Failed to load quotation settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings/quotation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data?.error || 'บันทึกการตั้งค่าไม่สำเร็จ' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSettings(prev => ({
      ...prev,
      productsRequiringQuotation: prev.productsRequiringQuotation.includes(productId)
        ? prev.productsRequiringQuotation.filter(id => id !== productId)
        : [...prev.productsRequiringQuotation, productId]
    }));
  };

  const handleCustomerTypeToggle = (customerType: string) => {
    setSettings(prev => ({
      ...prev,
      customerTypesRequiringQuotation: prev.customerTypesRequiringQuotation.includes(customerType)
        ? prev.customerTypesRequiringQuotation.filter(type => type !== customerType)
        : [...prev.customerTypesRequiringQuotation, customerType]
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">การตั้งค่าการสร้างใบเสนอราคาอัตโนมัติ</h1>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </Button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Auto-generation Settings */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">การสร้างใบเสนอราคาอัตโนมัติ</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoGenerateOnOrder"
                checked={settings.autoGenerateOnOrder}
                onChange={(e) => setSettings(prev => ({ ...prev, autoGenerateOnOrder: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="autoGenerateOnOrder" className="text-sm">
                สร้างใบเสนอราคาอัตโนมัติเมื่อมีคำสั่งซื้อใหม่
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                วันหมดอายุเริ่มต้น (วัน)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.defaultValidityDays}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultValidityDays: parseInt(e.target.value) || 7 }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                ยอดสั่งซื้อขั้นต่ำที่ต้องการใบเสนอราคา (บาท)
              </label>
              <input
                type="number"
                min="0"
                value={settings.quotationThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, quotationThreshold: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Product Settings */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">สินค้าที่ต้องการใบเสนอราคา</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {products.map((product) => (
              <div key={product._id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`product-${product._id}`}
                  checked={settings.productsRequiringQuotation.includes(product._id)}
                  onChange={() => handleProductToggle(product._id)}
                  className="mr-2"
                />
                <label htmlFor={`product-${product._id}`} className="text-sm">
                  {product.name} ({product.sku})
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Type Settings */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">ประเภทลูกค้าที่ต้องการใบเสนอราคา</h2>
          
          <div className="space-y-2">
            {['new', 'regular', 'target', 'inactive'].map((customerType) => (
              <div key={customerType} className="flex items-center">
                <input
                  type="checkbox"
                  id={`customer-${customerType}`}
                  checked={settings.customerTypesRequiringQuotation.includes(customerType)}
                  onChange={() => handleCustomerTypeToggle(customerType)}
                  className="mr-2"
                />
                <label htmlFor={`customer-${customerType}`} className="text-sm">
                  {customerType === 'new' && 'ลูกค้าใหม่'}
                  {customerType === 'regular' && 'ลูกค้าประจำ'}
                  {customerType === 'target' && 'ลูกค้าเป้าหมาย'}
                  {customerType === 'inactive' && 'ลูกค้าที่ไม่ใช้งาน'}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-conversion Settings */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">การแปลงเป็นใบสั่งขายอัตโนมัติ</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoConvertOnAcceptance"
                checked={settings.autoConvertOnAcceptance}
                onChange={(e) => setSettings(prev => ({ ...prev, autoConvertOnAcceptance: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="autoConvertOnAcceptance" className="text-sm">
                แปลงเป็นใบสั่งขายอัตโนมัติเมื่อลูกค้ายอมรับใบเสนอราคา
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireAdminApproval"
                checked={settings.requireAdminApproval}
                onChange={(e) => setSettings(prev => ({ ...prev, requireAdminApproval: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="requireAdminApproval" className="text-sm">
                ต้องการการอนุมัติจากผู้ดูแลระบบก่อนแปลงเป็นใบสั่งขาย
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                หน่วงเวลาก่อนแปลงเป็นใบสั่งขาย (ชั่วโมง)
              </label>
              <input
                type="number"
                min="0"
                max="168"
                value={settings.conversionDelay}
                onChange={(e) => setSettings(prev => ({ ...prev, conversionDelay: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                0 = ทันที, 1-168 = 1 ชั่วโมงถึง 7 วัน
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">การแจ้งเตือน</h2>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnGeneration"
                checked={settings.notifyOnGeneration}
                onChange={(e) => setSettings(prev => ({ ...prev, notifyOnGeneration: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="notifyOnGeneration" className="text-sm">
                แจ้งเตือนเมื่อสร้างใบเสนอราคาอัตโนมัติ
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnAcceptance"
                checked={settings.notifyOnAcceptance}
                onChange={(e) => setSettings(prev => ({ ...prev, notifyOnAcceptance: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="notifyOnAcceptance" className="text-sm">
                แจ้งเตือนเมื่อลูกค้ายอมรับใบเสนอราคา
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnConversion"
                checked={settings.notifyOnConversion}
                onChange={(e) => setSettings(prev => ({ ...prev, notifyOnConversion: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="notifyOnConversion" className="text-sm">
                แจ้งเตือนเมื่อแปลงเป็นใบสั่งขาย
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}