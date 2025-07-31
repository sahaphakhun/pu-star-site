'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import TaxInvoiceForm from '@/components/TaxInvoiceForm';

// Address interface for the new format
interface Address {
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

interface ProductWithId extends IProduct {
  _id: string;
}

interface CartItem {
  product: ProductWithId;
  quantity: number;
  selectedOptions?: { [optionName: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

const ShopPage = () => {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{[key: string]: CartItem}>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState<Address>({
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
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{[optionName: string]: string}>({});
  const [selectedUnit, setSelectedUnit] = useState<{ label: string; price: number } | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [shippingSetting, setShippingSetting] = useState<{freeThreshold:number,fee:number,freeQuantityThreshold:number,maxFee:number}>({freeThreshold:500,fee:50,freeQuantityThreshold:0,maxFee:50});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [quantities, setQuantities] = useState<{[productId: string]: number}>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tax Invoice states
  const [taxInvoiceData, setTaxInvoiceData] = useState<{
    companyName: string;
    taxId: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  } | null>(null);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');

  // Helper function to update customer address fields
  const updateCustomerAddressField = (field: keyof Address, value: string) => {
    setCustomerAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to validate address object
  const isAddressValid = (address: Address): boolean => {
    return !!(address.name && address.phone && address.province && address.houseNumber);
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      setCustomerName(user.name);
      setCustomerPhone(user.phoneNumber);
      // Sync with address form
      setCustomerAddress(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phoneNumber || ''
      }));
    }
  }, [isLoggedIn, user]);

  // ฟังก์ชันสำหรับดึง addresses
  const fetchAddresses = async () => {
    if (isLoggedIn) {
      try {
        const res = await fetch('/api/profile/addresses');
        const data = await res.json();
        if (data.success && data.data) {
          setAddresses(data.data);
          // autofill ที่อยู่ default
          const def = data.data.find((a:any) => a.isDefault) || data.data[0];
          if (def) {
            setSelectedAddressId(def._id || null);
            // Check if it's old format (string) or new format (object)
            if (typeof def.address === 'string') {
              // Convert legacy address to new format
              setCustomerAddress({
                _id: def._id,
                label: def.label || '',
                name: customerName,
                phone: customerPhone,
                province: '',
                district: '',
                subDistrict: '',
                postalCode: '',
                houseNumber: def.address,
                lane: '',
                moo: '',
                road: '',
                isDefault: def.isDefault || false
              });
            } else {
              setCustomerAddress(def.address || customerAddress);
            }
            setShowNewAddress(false);
          }
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    }
  };

  // ดึง addresses ของ user
  useEffect(() => {
    fetchAddresses();
  }, [isLoggedIn]);

  // เมื่อเลือกที่อยู่เดิม
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const addr = addresses.find((a:any) => (a._id || '') === selectedAddressId);
      if (addr) {
        // Check if it's old format (string) or new format (object)
        if (typeof addr.address === 'string') {
          // Convert legacy address to new format
          setCustomerAddress({
            _id: addr._id,
            label: addr.label || '',
            name: customerName,
            phone: customerPhone,
            province: '',
            district: '',
            subDistrict: '',
            postalCode: '',
            houseNumber: addr.address,
            lane: '',
            moo: '',
            road: '',
            isDefault: addr.isDefault || false
          });
        } else {
          setCustomerAddress(addr.address || customerAddress);
        }
        setShowNewAddress(false);
      }
    }
  }, [selectedAddressId, customerName, customerPhone]);

  const fetchProducts = useCallback(async () => {
    try {
      // เพิ่ม cache busting parameter เพื่อให้ได้ข้อมูลล่าสุด
      const response = await fetch(`/api/products?_t=${Date.now()}`);
      const data: ProductWithId[] = await response.json();
      setProducts(data);
      const cats = Array.from(new Set(data.map((p: any) => p.category || 'ทั่วไป')));
      setCategories(['ทั้งหมด', ...cats]);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error('โหลดข้อมูลตะกร้าจาก localStorage ไม่สำเร็จ', err);
    }
    // ดึง setting ค่าจัดส่ง
    fetch('/api/settings/shipping')
      .then(res=>res.json())
      .then(data=>{
        if(data) setShippingSetting(data);
      }).catch(()=>{});
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('บันทึกตะกร้าลง localStorage ไม่สำเร็จ', err);
    }
  }, [cart]);

  useEffect(() => {
    if (isLoggedIn) {
      const pending = localStorage.getItem('pendingCheckout');
      if (pending === '1') {
        setShowOrderForm(true);
        localStorage.removeItem('pendingCheckout');
      }
    }
  }, [isLoggedIn]);

  const generateCartKey = (productId: string, selectedOptions?: {[key: string]: string}, unitLabel?: string) => {
    const parts = [productId];
    if (unitLabel) parts.push(unitLabel);
    if (selectedOptions && Object.keys(selectedOptions).length > 0) {
      parts.push(JSON.stringify(selectedOptions));
    }
    return parts.join('-');
  };

  const handleAddToCart = (product: ProductWithId, options?: {[key: string]: string}, unit?: {label:string; price:number}, quantity: number = 1) => {
    const cartKey = generateCartKey(product._id, options, unit?.label);
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[cartKey]) {
        newCart[cartKey] = {
          ...newCart[cartKey],
          quantity: newCart[cartKey].quantity + quantity
        };
      } else {
        newCart[cartKey] = { 
          product, 
          quantity: quantity,
          selectedOptions: options,
          unitLabel: unit?.label,
          unitPrice: unit?.price,
        };
      }
      return newCart;
    });
    
    // แสดง toast แสดงความสำเร็จพร้อมแอนิเมชัน
    toast.success(
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-gray-900">เพิ่มลงตะกร้าสำเร็จ! 🛒</p>
          <p className="text-sm text-gray-600">{product.name} {quantity} ชิ้น</p>
          {unit?.label && <p className="text-xs text-blue-600">หน่วย: {unit.label}</p>}
        </div>
      </div>,
      {
        duration: 3000,
        position: 'bottom-right',
        style: {
          background: '#f0fdf4',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      }
    );

    // แอนิเมชันลูกบอลบินเข้าตะกร้า
    createCartAnimation(product);
  };

  const getQuantityForProduct = (productId: string) => {
    return quantities[productId] || 1;
  };

  const setQuantityForProduct = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  // แอนิเมชันลูกบอลบินเข้าตะกร้า
  const createCartAnimation = (product: ProductWithId) => {
    // สร้าง element ลูกบอลแอนิเมชัน
    const animationElement = document.createElement('div');
    animationElement.innerHTML = `
      <div style="
        position: fixed;
        z-index: 9999;
        width: 40px;
        height: 40px;
        background: linear-gradient(45deg, #3B82F6, #1D4ED8);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        pointer-events: none;
      ">
        🛒
      </div>
    `;

    document.body.appendChild(animationElement);
    const ball = animationElement.firstElementChild as HTMLElement;

    // หาตำแหน่งของ cart icon (ถ้ามี)
    const cartIcon = document.querySelector('.cart-icon') || document.querySelector('[data-cart-icon]') || document.querySelector('.cart-button');
    const cartRect = cartIcon?.getBoundingClientRect();

    // ตำแหน่งเริ่มต้น (กลางหน้าจอ)
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;

    // ตำแหน่งปลายทาง (cart icon หรือมุมขวาบน)
    const endX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 80;
    const endY = cartRect ? cartRect.top + cartRect.height / 2 : 80;

    // ตั้งตำแหน่งเริ่มต้น
    ball.style.left = startX + 'px';
    ball.style.top = startY + 'px';
    ball.style.transform = 'scale(1.2)';

    // เริ่มแอนิเมชัน
    setTimeout(() => {
      ball.style.left = endX + 'px';
      ball.style.top = endY + 'px';
      ball.style.transform = 'scale(0.8)';
      ball.style.opacity = '0.8';
    }, 50);

    // ลบ element หลังจากแอนิเมชันเสร็จ
    setTimeout(() => {
      if (animationElement && document.body.contains(animationElement)) {
        document.body.removeChild(animationElement);
      }
      
      // เพิ่มเอฟเฟกต์ปุ๊บๆ ที่ cart icon
      if (cartIcon) {
        cartIcon.classList.add('animate-bounce');
        setTimeout(() => {
          cartIcon.classList.remove('animate-bounce');
        }, 1000);
      }
    }, 900);
  };

  const openProductModal = (product: ProductWithId) => {
    setSelectedProduct(product);
    setModalQuantity(getQuantityForProduct(product._id));
    
    // เลือกหน่วยแรก
    if (product.units && product.units.length > 0) {
      setSelectedUnit(product.units[0]);
    } else {
      setSelectedUnit(null);
    }
    
    // เลือกตัวเลือกแรกที่มีสินค้าสำหรับแต่ละ option
    const initialOptions: Record<string, string> = {};
    if (product.options) {
      product.options.forEach(option => {
        // หาตัวเลือกแรกที่มีสินค้า
        const availableValue = option.values.find(value => value.isAvailable !== false);
        if (availableValue) {
          initialOptions[option.name] = availableValue.label;
        } else if (option.values.length > 0) {
          // ถ้าไม่มีตัวเลือกที่มีสินค้า ให้เลือกตัวแรก (แต่จะ disabled อยู่แล้ว)
          initialOptions[option.name] = option.values[0].label;
        }
      });
    }
    setSelectedOptions(initialOptions);
  };

  const addToCartWithOptions = () => {
    if (!selectedProduct) return;
    
    // ตรวจสอบว่าสินค้าพร้อมขายหรือไม่
    if (selectedProduct.isAvailable === false) {
      toast.error('สินค้านี้หมดแล้ว ไม่สามารถสั่งซื้อได้');
      return;
    }
    
    const unitToUse = selectedUnit ?? (selectedProduct.units && selectedProduct.units[0]);
    
    // ตรวจสอบว่าเลือกตัวเลือกครบหรือไม่
    if (selectedProduct.options && selectedProduct.options.length > 0) {
      const missingOptions = selectedProduct.options.filter(option => !selectedOptions[option.name]);
      if (missingOptions.length > 0) {
        toast.error(`กรุณาเลือก ${missingOptions.map(o => o.name).join(', ')}`);
        return;
      }
      
      // ตรวจสอบว่าตัวเลือกที่เลือกยังมีสินค้าหรือไม่
      for (const option of selectedProduct.options) {
        const selectedValue = selectedOptions[option.name];
        const optionValue = option.values.find(v => v.label === selectedValue);
        if (optionValue && optionValue.isAvailable === false) {
          toast.error(`ตัวเลือก "${selectedValue}" ของ "${option.name}" หมดแล้ว กรุณาเลือกตัวเลือกอื่น`);
          return;
        }
      }
    }

    handleAddToCart(selectedProduct, selectedOptions, unitToUse || undefined, modalQuantity);
    setSelectedProduct(null);
    setSelectedOptions({});
    setSelectedUnit(null);
    setModalQuantity(1);
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[cartKey] && newCart[cartKey].quantity > 1) {
        newCart[cartKey] = {
          ...newCart[cartKey],
          quantity: newCart[cartKey].quantity - 1
        };
      } else {
        delete newCart[cartKey];
      }
      return newCart;
    });
  };
  
  const deleteFromCart = (cartKey: string) => {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ลบออก',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        setCart(prev => {
          const newCart = { ...prev };
          delete newCart[cartKey];
          return newCart;
        });
        toast.success('ลบสินค้าออกจากตะกร้าแล้ว');
      }
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

  const handleShowOrderForm = () => {
    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingCheckout', '1');
      }
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`);
    } else {
      setShowOrderForm(true);
    }
  };

  const handleRequestQuote = async () => {
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`);
      return;
    }
    
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error('กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่');
      return;
    }
    
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
      toast.error('กรุณาเลือกสินค้าก่อนขอใบเสนอราคา');
      return;
    }
    
    Swal.fire({
      title: 'กำลังส่งคำขอใบเสนอราคา',
      html: 'กรุณารอสักครู่...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      const quoteData = {
        customerName,
        customerPhone,
        customerAddress,
        items: cartItems.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.unitPrice !== undefined ? item.unitPrice : item.product.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? item.selectedOptions : undefined,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice
        })),
        totalAmount: calculateGrandTotal(),
        taxInvoice: taxInvoiceData ? {
          requestTaxInvoice: true,
          companyName: taxInvoiceData.companyName,
          taxId: taxInvoiceData.taxId,
          companyAddress: taxInvoiceData.companyAddress || undefined,
          companyPhone: taxInvoiceData.companyPhone || undefined,
          companyEmail: taxInvoiceData.companyEmail || undefined
        } : undefined
      };
      
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });
      
      if (response.ok) {
        // เก็บข้อมูลสำหรับสร้างออเดอร์
        const quoteOrderData = {
          customerName,
          customerPhone,
          customerAddress,
          paymentMethod,
          items: cartItems.map(item => ({
            productId: item.product._id,
            name: item.product.name,
            price: item.unitPrice !== undefined ? item.unitPrice : item.product.price,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? item.selectedOptions : undefined,
            unitLabel: item.unitLabel,
            unitPrice: item.unitPrice
          })),
          shippingFee: calculateShippingFee(),
          totalAmount: calculateGrandTotal(),
          taxInvoice: taxInvoiceData ? {
            requestTaxInvoice: true,
            companyName: taxInvoiceData.companyName,
            taxId: taxInvoiceData.taxId,
            companyAddress: taxInvoiceData.companyAddress || undefined,
            companyPhone: taxInvoiceData.companyPhone || undefined,
            companyEmail: taxInvoiceData.companyEmail || undefined
          } : undefined
        };

        Swal.fire({
          title: 'สำเร็จ!',
          text: 'ส่งคำขอใบเสนอราคาเรียบร้อยแล้ว ต้องการสั่งซื้อทันทีหรือไม่?',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'ยืนยันคำสั่งซื้อ',
          cancelButtonText: 'ปิด',
          confirmButtonColor: '#3b82f6',
          cancelButtonColor: '#6b7280'
        }).then(async (result) => {
          if (result.isConfirmed) {
            await handleCreateOrderFromQuote(quoteOrderData);
          }
        });

        setCart({});
              setShowOrderForm(false);
      setCustomerAddress({
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
      setTaxInvoiceData(null);
        setSaveNewAddress(false);
        setAddressLabel('');
        setSelectedAddressId(null);
        setShowNewAddress(false);
        await fetchAddresses();
      } else {
        throw new Error('Failed to submit quote request');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งคำขอใบเสนอราคาได้ กรุณาลองอีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const handleCreateOrderFromQuote = async (quoteOrderData: any) => {
    try {
      Swal.fire({
        title: 'กำลังสร้างคำสั่งซื้อ',
        html: 'กรุณารอสักครู่...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      let slipUrl = '';
      
      // ถ้าเป็นการโอนเงินและมีไฟล์สลิป
      if (quoteOrderData.paymentMethod === 'transfer' && slipFile) {
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

      // สร้างข้อมูลออเดอร์
      const orderData = {
        ...quoteOrderData,
        ...(quoteOrderData.paymentMethod === 'transfer' && slipUrl ? { slipUrl } : {}),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'สร้างคำสั่งซื้อเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        });
        
        // รีเซ็ตฟอร์ม
        setSlipFile(null);
        setSlipPreview(null);
        setTaxInvoiceData(null);
        setSaveNewAddress(false);
        setAddressLabel('');
        setSelectedAddressId(null);
        setShowNewAddress(false);
        await fetchAddresses();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองอีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`);
      return;
    }
    
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error('กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่');
      return;
    }
    if (paymentMethod === 'transfer' && !slipFile) {
      toast.error('กรุณาแนบสลิปการโอนเงิน');
      return;
    }
    if (taxInvoiceData) {
      if (!taxInvoiceData.companyName || !taxInvoiceData.taxId) {
        toast.error('กรุณากรอกชื่อบริษัทและเลขประจำตัวผู้เสียภาษี');
        return;
      }
    }
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
      toast.error('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
      return;
    }
    
    Swal.fire({
      title: 'กำลังดำเนินการ',
      html: 'กรุณารอสักครู่...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    let slipUrl = '';
    try {
      if (paymentMethod === 'transfer' && slipFile) {
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
      
      // Helper function to format address for API
      const formatAddressForAPI = (address: Address): string => {
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

      // เพิ่ม logic บันทึกที่อยู่ใหม่
      if (saveNewAddress && isAddressValid(customerAddress)) {
        try {
          const response = await fetch('/api/profile/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              label: addressLabel || 'ที่อยู่ใหม่', 
              address: formatAddressForAPI(customerAddress), 
              isDefault: addresses.length === 0 
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error saving address:', errorData);
            toast.error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึกที่อยู่');
          } else {
            const data = await response.json();
            if (data.success) {
              toast.success('บันทึกที่อยู่สำเร็จ');
              // อัพเดท addresses state
              setAddresses(data.data || []);
              // ตั้งค่าที่อยู่ใหม่เป็นที่อยู่ที่เลือก
              const newAddress = data.data.find((a:any) => a.address === customerAddress);
              if (newAddress) {
                setSelectedAddressId(newAddress._id);
              }
            }
          }
        } catch (error) {
          console.error('Error saving address:', error);
          toast.error('เกิดข้อผิดพลาดในการบันทึกที่อยู่');
        }
      }

      const orderData = {
        customerName,
        customerPhone,
        customerAddress: formatAddressForAPI(customerAddress),
        paymentMethod,
        ...(paymentMethod === 'transfer' && slipUrl ? { slipUrl } : {}),
        items: cartItems.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.unitPrice !== undefined ? item.unitPrice : item.product.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? item.selectedOptions : undefined,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice
        })),
        shippingFee: calculateShippingFee(),
        totalAmount: calculateGrandTotal(),
        taxInvoice: taxInvoiceData ? {
          requestTaxInvoice: true,
          companyName: taxInvoiceData.companyName,
          taxId: taxInvoiceData.taxId,
          companyAddress: taxInvoiceData.companyAddress || undefined,
          companyPhone: taxInvoiceData.companyPhone || undefined,
          companyEmail: taxInvoiceData.companyEmail || undefined
        } : undefined
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'ส่งคำสั่งซื้อเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง'
        });
        setCart({});
        setShowOrderForm(false);
        setCustomerAddress({
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
        setSlipFile(null);
        setSlipPreview(null);
        setTaxInvoiceData(null);
        setSaveNewAddress(false);
        setAddressLabel('');
        setSelectedAddressId(null);
        setShowNewAddress(false);
        // รีเฟรชรายการที่อยู่ เพื่อให้ที่อยู่ใหม่แสดงผลในฟอร์ม/โปรไฟล์ทันที
        await fetchAddresses();

        // เคลียร์ state ที่เกี่ยวข้องกับที่อยู่ใหม่
        setSaveNewAddress(false);
        setAddressLabel('');
        setSelectedAddressId(null);
        setShowNewAddress(false);
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งคำสั่งซื้อได้ กรุณาลองอีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce((total, item) => {
      const priceEach = item.unitPrice !== undefined ? item.unitPrice : item.product.price;
      return total + (priceEach * item.quantity);
    }, 0);
  };

  const calculateShippingFee = () => {
    const { maxFee } = shippingSetting;

    // หากตะกร้าว่าง
    if (Object.values(cart).length === 0) return 0;

    // รวบรวมค่าจัดส่งของแต่ละหน่วย
    const fees: number[] = Object.values(cart).map((item) => {
      if (item.unitLabel && item.product.units) {
        const u = item.product.units.find((un) => un.label === item.unitLabel);
        return u?.shippingFee ?? 0;
      }
      // ไม่มีหน่วย → ใช้ shippingFee ของสินค้า
      return (item.product as any).shippingFee ?? 0;
    });

    const maxUnitFee = fees.length ? Math.max(...fees) : 0;
    return Math.min(maxFee ?? 50, maxUnitFee);
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateShippingFee();
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลดสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      

      <div className="container mx-auto px-4 py-8">
        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">สินค้าทั้งหมด</h2>
          </div>
          
          {/* Search Bar - Mobile Enhanced */}
          <div className="mb-6">
            <div className="relative max-w-full">
              <input
                type="text"
                placeholder="🔍 ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-4 sm:py-3 pl-12 text-lg sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-5 sm:w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          {/* Sticky Categories - Mobile Enhanced */}
          <div className="sticky top-0 bg-gray-50 z-20 py-4 mb-6 -mx-4 px-4 shadow-sm">
            <div className="flex overflow-x-auto space-x-3 scrollbar-hide pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-6 py-3 sm:px-4 sm:py-2 rounded-full border text-base sm:text-sm font-medium whitespace-nowrap transition-all duration-200 touch-manipulation ${
                    selectedCategory === cat 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {(
              selectedCategory === 'ทั้งหมด'
                ? products
                : products.filter((p) => (p.category || 'ทั่วไป') === selectedCategory)
            ).filter((product) => 
              searchTerm === '' || 
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
            ).map((product) => (
              <motion.div
                key={product._id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl cursor-pointer"
                onClick={() => handleProductClick(product._id)}
              >
                <div className="relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {product.isAvailable === false && (
                    <>
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 shadow-lg">
                        สินค้าหมด
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <div className="text-center">
                          <span className="text-red-600 font-bold text-sm bg-white bg-opacity-95 px-3 py-1 rounded-lg shadow-lg border border-red-200">
                            สินค้าหมด
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm md:text-base">
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold text-lg mb-3 text-sm md:text-base">
                    {(() => {
                      const priceVal = product.price !== undefined ? product.price : (product.units && product.units[0]?.price) || 0;
                      const label = product.price === undefined && product.units && product.units.length > 0 ? ` / ${product.units[0].label}` : '';
                      return `฿${priceVal.toLocaleString()}${label}`;
                    })()}
                  </p>
                  <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-2">{product.description}</p>

                  {/* Availability Status */}
                  <div className="mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.isAvailable !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isAvailable !== false ? '✅ พร้อมขาย' : '❌ สินค้าหมด'}
                    </span>
                  </div>

                  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">จำนวน</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuantityForProduct(product._id, getQuantityForProduct(product._id) - 1);
                        }}
                        disabled={product.isAvailable === false}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={getQuantityForProduct(product._id)}
                        onChange={(e) => setQuantityForProduct(product._id, parseInt(e.target.value) || 1)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={product.isAvailable === false}
                        className="w-16 text-center border border-gray-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        min="1"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuantityForProduct(product._id, getQuantityForProduct(product._id) + 1);
                        }}
                        disabled={product.isAvailable === false}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.isAvailable === false) {
                        toast.error('สินค้านี้หมดแล้ว ไม่สามารถสั่งซื้อได้');
                        return;
                      }
                      if ((product.options && product.options.length > 0) || (product.units && product.units.length > 0)) {
                        openProductModal(product);
                      } else {
                        handleAddToCart(product, undefined, undefined, getQuantityForProduct(product._id));
                      }
                    }}
                    disabled={product.isAvailable === false}
                    className={`w-full py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium ${
                      product.isAvailable === false 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                    }`}
                    whileHover={{ scale: product.isAvailable ? 1.02 : 1 }}
                    whileTap={{ scale: product.isAvailable ? 0.98 : 1 }}
                  >
                    {product.isAvailable === false 
                      ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>สินค้าหมด</span>
                        </div>
                      ) : (product.options && product.options.length > 0) || (product.units && product.units.length > 0) ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                          <span>เลือกตัวเลือก</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5m6 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                          <span>เพิ่มลงตะกร้า ({getQuantityForProduct(product._id)} ชิ้น)</span>
                        </div>
                      )
                    }
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Action Buttons */}
        {/* Facebook Button */}
        <motion.a
          href="https://web.facebook.com/profile.php?id=61560422837009"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-40 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </motion.a>

        {/* Phone Button */}
        <motion.a
          href="tel:0989746363"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-24 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </motion.a>

        {/* Floating Cart Button */}
        {getTotalItems() > 0 && (
          <>
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setShowCart(true)}
              className="cart-icon fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-10"
            >
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </div>
            </motion.button>
            {/* ยอดรวมราคารวมใต้ไอคอนตะกร้า */}
            <div className="fixed bottom-2 right-6 z-10 bg-white bg-opacity-90 rounded-lg px-3 py-1 shadow text-blue-700 font-bold text-sm text-center pointer-events-none select-none">
              ฿{calculateTotal().toLocaleString()}
            </div>
          </>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{selectedProduct.name}</h3>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product Image */}
                <div className="relative aspect-square mb-4">
                  <Image
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                  {selectedProduct.isAvailable === false && (
                    <>
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 shadow-lg">
                        สินค้าหมด
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <div className="text-center">
                          <span className="text-red-600 font-bold text-sm bg-white bg-opacity-95 px-3 py-1 rounded-lg shadow-lg border border-red-200">
                            สินค้าหมด
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Availability Status */}
                <div className="mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedProduct.isAvailable !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedProduct.isAvailable !== false ? '✅ พร้อมขาย' : '❌ สินค้าหมด'}
                  </span>
                </div>

                {/* Product Description */}
                <p className="text-gray-600 text-sm mb-4">{selectedProduct.description}</p>

                {/* Units Selection */}
                {selectedProduct.units && selectedProduct.units.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">เลือกหน่วย</label>
                    <div className="space-y-2">
                      {selectedProduct.units.map((unit, index) => (
                        <label key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="unit"
                              checked={selectedUnit?.label === unit.label}
                              onChange={() => setSelectedUnit(unit)}
                              disabled={selectedProduct.isAvailable === false}
                              className="disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className={selectedProduct.isAvailable === false ? 'text-gray-400' : 'text-gray-800'}>
                              {unit.label} - ฿{unit.price.toLocaleString()}
                            </span>
                          </div>
                          {(unit.shippingFee === 0 || unit.shippingFee === undefined) && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                              ส่งฟรี
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options Selection */}
                {selectedProduct.options && selectedProduct.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{option.name}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {option.values.map((value, valueIndex) => {
                        const isOptionAvailable = value.isAvailable !== false;
                        const isProductAvailable = selectedProduct.isAvailable !== false;
                        const isSelectable = isProductAvailable && isOptionAvailable;
                        
                        return (
                          <button
                            key={valueIndex}
                            onClick={() => {
                              if (!isSelectable) return;
                              setSelectedOptions(prev => ({
                                ...prev,
                                [option.name]: value.label
                              }));
                            }}
                            disabled={!isSelectable}
                            className={`relative p-2 border rounded-lg text-sm transition-colors ${
                              selectedOptions[option.name] === value.label && isSelectable
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : isSelectable
                                  ? 'border-gray-300 hover:border-gray-400'
                                  : 'border-gray-200 bg-gray-100'
                            } ${!isSelectable ? 'cursor-not-allowed' : ''} ${!isOptionAvailable ? 'opacity-75' : ''}`}
                          >
                            {!isOptionAvailable && (
                              <div className="absolute top-1 right-1">
                                <span className="text-white font-bold text-xs bg-red-500 px-2 py-1 rounded-full shadow">
                                  หมด
                                </span>
                              </div>
                            )}
                            
                            {value.imageUrl && (
                              <div className="relative w-full h-20 mb-2">
                                <Image
                                  src={value.imageUrl}
                                  alt={value.label}
                                  fill
                                  className={`object-cover rounded ${!isOptionAvailable ? 'grayscale' : ''}`}
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <span className={!isOptionAvailable ? 'text-gray-500' : ''}>
                                {value.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">จำนวน</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      disabled={selectedProduct.isAvailable === false}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={modalQuantity}
                      onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={selectedProduct.isAvailable === false}
                      className="w-20 text-center border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      min="1"
                    />
                    <button
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      disabled={selectedProduct.isAvailable === false}
                      className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                <motion.button
                  onClick={addToCartWithOptions}
                  disabled={selectedProduct.isAvailable === false}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    selectedProduct.isAvailable === false 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  }`}
                  whileHover={{ scale: selectedProduct.isAvailable ? 1.02 : 1 }}
                  whileTap={{ scale: selectedProduct.isAvailable ? 0.98 : 1 }}
                >
                  {selectedProduct.isAvailable === false 
                    ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>สินค้าหมด</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5m6 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                        <span>เพิ่มลงตะกร้า ({modalQuantity} ชิ้น)</span>
                      </div>
                    )
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md md:max-w-lg h-6/7 md:h-auto md:max-h-[75vh] rounded-t-xl md:rounded-xl overflow-hidden flex flex-col mb-20 md:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-semibold">ตะกร้าสินค้า ({getTotalItems()})</h3>
                <button onClick={() => setShowCart(false)} className="p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {Object.entries(cart).map(([cartKey, item]) => (
                  <div key={cartKey} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.product.name}</h4>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-xs text-gray-500">
                          {Object.entries(item.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                        </p>
                      )}
                      <p className="text-blue-600 font-semibold">
                        ฿{(item.unitPrice !== undefined ? item.unitPrice : item.product.price).toLocaleString()}
                        {item.unitLabel && (
                          <span className="text-xs text-gray-500 ml-1">/ {item.unitLabel}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(cartKey)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleAddToCart(
                          item.product,
                          item.selectedOptions,
                          item.unitLabel && item.unitPrice !== undefined ? { label: item.unitLabel, price: item.unitPrice } : undefined,
                          1
                        )}
                        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                      >
                        +
                      </button>
                      <button
                        onClick={() => deleteFromCart(cartKey)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fixed Footer with Summary and Checkout Button */}
              {Object.keys(cart).length > 0 && (
                <div className="border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ค่าส่ง</span>
                      <span className="text-sm font-medium">฿{calculateShippingFee().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-lg font-semibold">รวมทั้งสิ้น:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ฿{calculateGrandTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Checkout Button Outside Modal */}
      <AnimatePresence>
        {showCart && Object.keys(cart).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-[60] max-w-md md:max-w-lg mx-auto"
          >
            <button
              onClick={() => {
                setShowCart(false);
                handleShowOrderForm();
              }}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
            >
              ดำเนินการสั่งซื้อ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Form Modal */}
      <AnimatePresence>
        {showOrderForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowOrderForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">ข้อมูลการสั่งซื้อ</h3>
                  <button onClick={() => setShowOrderForm(false)} className="p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setCustomerAddress(prev => ({
                          ...prev,
                          name: e.target.value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setCustomerAddress(prev => ({
                          ...prev,
                          phone: e.target.value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* ที่อยู่จัดส่ง */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่จัดส่ง</label>
                    {addresses.length > 0 && !showNewAddress && (
                      <div className="mb-4 space-y-3">
                        {addresses.map((a:any) => (
                          <div key={a._id} className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                            selectedAddressId === a._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`} onClick={() => { setSelectedAddressId(a._id); setShowNewAddress(false); }}>
                            <div className="flex items-start space-x-3">
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === a._id}
                                onChange={() => { setSelectedAddressId(a._id); setShowNewAddress(false); }}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{a.label || 'ที่อยู่'}</span>
                                  {a.isDefault && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">ค่าเริ่มต้น</span>}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {typeof a.address === 'string' ? a.address : 
                                    [a.address.houseNumber, a.address.lane ? `ซ.${a.address.lane}` : '', 
                                     a.address.moo ? `หมู่ ${a.address.moo}` : '', a.address.road ? `ถ.${a.address.road}` : '',
                                     a.address.subDistrict ? `ต.${a.address.subDistrict}` : '', 
                                     a.address.district ? `อ.${a.address.district}` : '', 
                                     a.address.province, a.address.postalCode].filter(Boolean).join(' ')
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
                            setCustomerAddress({
                              label: '',
                              name: customerName,
                              phone: customerPhone,
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
                          }}
                        >
                          + เพิ่มที่อยู่ใหม่
                        </button>
                      </div>
                    )}
                    {(showNewAddress || addresses.length === 0) && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ชื่อที่อยู่สำหรับใช้ภายหลัง (เช่น บ้าน, ออฟฟิศ)"
                          onChange={e => setAddressLabel(e.target.value)}
                          value={addressLabel}
                        />
                        {/* 1. ชื่อ */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">1. ชื่อ</label>
                          <input
                            type="text"
                            value={customerAddress.name}
                            onChange={(e) => {
                              updateCustomerAddressField('name', e.target.value);
                              setCustomerName(e.target.value);
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
                            value={customerAddress.phone}
                            onChange={(e) => {
                              updateCustomerAddressField('phone', e.target.value);
                              setCustomerPhone(e.target.value);
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
                              value={customerAddress.province}
                              onChange={(e) => updateCustomerAddressField('province', e.target.value)}
                              placeholder="จังหวัด"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                            <input
                              type="text"
                              value={customerAddress.district}
                              onChange={(e) => updateCustomerAddressField('district', e.target.value)}
                              placeholder="เขต/อำเภอ"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                            <input
                              type="text"
                              value={customerAddress.subDistrict}
                              onChange={(e) => updateCustomerAddressField('subDistrict', e.target.value)}
                              placeholder="แขวง/ตำบล"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={customerAddress.postalCode}
                              onChange={(e) => updateCustomerAddressField('postalCode', e.target.value)}
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
                              value={customerAddress.houseNumber}
                              onChange={(e) => updateCustomerAddressField('houseNumber', e.target.value)}
                              placeholder="บ้านเลขที่"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                            <input
                              type="text"
                              value={customerAddress.lane}
                              onChange={(e) => updateCustomerAddressField('lane', e.target.value)}
                              placeholder="ซอย"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={customerAddress.moo}
                              onChange={(e) => updateCustomerAddressField('moo', e.target.value)}
                              placeholder="หมู่"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={customerAddress.road}
                              onChange={(e) => updateCustomerAddressField('road', e.target.value)}
                              placeholder="ถนน"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              checked={saveNewAddress} 
                              onChange={e => setSaveNewAddress(e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">บันทึกที่อยู่นี้สำหรับใช้ครั้งต่อไป</span>
                          </label>
                          {addresses.length > 0 && (
                            <button 
                              type="button" 
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              onClick={() => { 
                                setShowNewAddress(false); 
                                setCustomerAddress({
                                  label: '',
                                  name: customerName,
                                  phone: customerPhone,
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
                              }}
                            >
                              ← เลือกจากที่อยู่เดิม
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วิธีการชำระเงิน</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'transfer')}
                          className="mr-2"
                        />
                        เก็บเงินปลายทาง
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="transfer"
                          checked={paymentMethod === 'transfer'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'transfer')}
                          className="mr-2"
                        />
                        โอนเงินผ่านธนาคาร
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'transfer' && (
                    <div className="space-y-4">
                      {/* Bank Information */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-3">ข้อมูลสำหรับโอนเงิน</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">ธนาคาร:</span>
                            <span className="ml-2 text-gray-900">ธนาคารกสิกรไทย</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">เลขที่บัญชี:</span>
                              <span className="ml-2 text-gray-900 font-mono text-lg">1943234902</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('1943234902');
                                // Show toast notification
                                const toast = document.createElement('div');
                                toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] transition-all duration-300';
                                toast.textContent = 'คัดลอกเลขบัญชีแล้ว';
                                document.body.appendChild(toast);
                                setTimeout(() => {
                                  toast.style.opacity = '0';
                                  setTimeout(() => document.body.removeChild(toast), 300);
                                }, 2000);
                              }}
                              className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              <span>คัดลอก</span>
                            </button>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">ชื่อบัญชี:</span>
                            <span className="ml-2 text-gray-900">บริษัท วินริช ไดนามิค จำกัด</span>
                          </div>
                        </div>
                      </div>

                      {/* Upload Slip */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">อัพโหลดสลิปการโอนเงิน</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                        {slipPreview && (
                          <div className="mt-2 relative w-full h-48">
                            <Image
                              src={slipPreview}
                              alt="ตัวอย่างสลิป"
                              fill
                              className="object-contain border rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tax Invoice Section */}
                  <TaxInvoiceForm
                    onTaxInvoiceChange={setTaxInvoiceData}
                    className="mb-6"
                  />

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">สรุปคำสั่งซื้อ</h4>
                    <div className="space-y-1 text-sm">
                      {Object.values(cart).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.product.name} x{item.quantity}</span>
                          <span>฿{((item.unitPrice !== undefined ? item.unitPrice : item.product.price) * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>ยอดสินค้า:</span>
                        <span>฿{calculateTotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ค่าจัดส่ง:</span>
                        <span>{calculateShippingFee() === 0 ? 'ฟรี' : `฿${calculateShippingFee().toLocaleString()}`}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-1 border-t">
                        <span>ยอดรวม:</span>
                        <span className="text-blue-600">฿{calculateGrandTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleRequestQuote}
                      className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      ขอใบเสนอราคา
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      ยืนยันการสั่งซื้อ
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopPage; 