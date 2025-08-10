'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Image from 'next/image';
import { IProduct } from '@/models/Product';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

interface ProductWithId extends IProduct {
  _id: string;
}

interface OptionValue { 
  label: string; 
  imageUrl?: string;
  isAvailable?: boolean;
}

interface ProductOption { 
  name: string; 
  values: OptionValue[];
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

const AdminProductsPage = () => {
  const { hasPermission, isAdmin } = usePermissions();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [rootShippingFee, setRootShippingFee] = useState('');
  const [units, setUnits] = useState<{ label: string; price: string; shippingFee: string }[]>([]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('ทั่วไป');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploadingOptionImage, setUploadingOptionImage] = useState<{optIdx: number, valIdx: number} | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  
  // WMS Configuration States
  const [wmsEnabled, setWmsEnabled] = useState(false);
  const [wmsProductCode, setWmsProductCode] = useState('');
  const [wmsLotGen, setWmsLotGen] = useState('');
  const [wmsLocationBin, setWmsLocationBin] = useState('');
  const [wmsLotMfg, setWmsLotMfg] = useState('');
  const [wmsAdminUsername, setWmsAdminUsername] = useState('');

  // WMS per-variant configuration
  interface WMSVariantRow {
    key: string;
    unitLabel?: string;
    options: Record<string, string>;
    productCode: string;
    lotGen: string;
    locationBin: string;
    lotMfg?: string;
    adminUsername: string;
    isEnabled: boolean;
  }
  const [wmsVariantMode, setWmsVariantMode] = useState(false);
  const [wmsVariantConfigs, setWmsVariantConfigs] = useState<WMSVariantRow[]>([]);

  const buildVariantKey = (unitLabel?: string, selectedOptions?: Record<string, string>) => {
    const unitPart = unitLabel ? `unit:${unitLabel}` : 'unit:default';
    const optionsPart = selectedOptions && Object.keys(selectedOptions).length > 0
      ? 'opts:' + Object.keys(selectedOptions).sort().map(k => `${k}:${selectedOptions[k]}`).join('|')
      : 'opts:none';
    return `${unitPart}__${optionsPart}`;
  };

  const getOptionCombos = (opts: ProductOption[]): Record<string, string>[] => {
    if (!opts || opts.length === 0) return [{}];
    // เริ่มด้วยคอมโบว่าง แล้วคูณค่าของแต่ละ option ต่อกัน
    return opts.reduce<Record<string, string>[]>((acc, option) => {
      const validValues = (option.values || []).filter(v => v.label && v.label.trim());
      if (validValues.length === 0) return acc; // ถ้าไม่มีค่า ให้ข้าม option นี้
      const next: Record<string, string>[] = [];
      for (const combo of acc) {
        for (const val of validValues) {
          next.push({ ...combo, [option.name]: val.label });
        }
      }
      return next;
    }, [{}]);
  };

  const generateVariantRows = () => {
    const unitLabels = (units && units.length > 0) ? units.map(u => u.label) : [undefined];
    const optionCombos = getOptionCombos(options);

    const existingByKey = new Map<string, WMSVariantRow>();
    for (const row of wmsVariantConfigs) existingByKey.set(row.key, row);

    const rows: WMSVariantRow[] = [];
    for (const unitLabel of unitLabels) {
      for (const combo of optionCombos) {
        const key = buildVariantKey(unitLabel, combo);
        const prev = existingByKey.get(key);
        rows.push({
          key,
          unitLabel,
          options: combo,
          productCode: prev?.productCode ?? wmsProductCode,
          lotGen: prev?.lotGen ?? wmsLotGen,
          locationBin: prev?.locationBin ?? wmsLocationBin,
          lotMfg: prev?.lotMfg ?? wmsLotMfg,
          adminUsername: prev?.adminUsername ?? wmsAdminUsername,
          isEnabled: prev?.isEnabled ?? true,
        });
      }
    }
    setWmsVariantConfigs(rows);
  };

  useEffect(() => {
    if (wmsVariantMode) {
      generateVariantRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wmsVariantMode, JSON.stringify(units), JSON.stringify(options), wmsProductCode, wmsLotGen, wmsLocationBin, wmsLotMfg, wmsAdminUsername]);

  const updateVariantRow = (index: number, patch: Partial<WMSVariantRow>) => {
    setWmsVariantConfigs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const prefillAllFromTopLevel = () => {
    setWmsVariantConfigs(prev => prev.map(r => ({
      ...r,
      productCode: wmsProductCode,
      lotGen: wmsLotGen,
      locationBin: wmsLocationBin,
      lotMfg: wmsLotMfg,
      adminUsername: wmsAdminUsername,
    })));
  };

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products', { credentials: 'include' });
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลสินค้าได้:', error);
      setLoading(false);
      toast.error('ไม่สามารถดึงข้อมูลสินค้าได้');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // ตรวจสอบว่า data เป็น array หรือไม่
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Categories API returned non-array data:', data);
        throw new Error('Invalid data format from categories API');
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้:', error);
      // หาก API หมวดหมู่ล้มเหลว ใช้ข้อมูลเริ่มต้น
      setCategories([
        { _id: '1', name: 'ทั่วไป', isActive: true, displayOrder: 0 },
        { _id: '2', name: 'กาวและซีลแลนท์', isActive: true, displayOrder: 1 },
        { _id: '3', name: 'เครื่องมือ', isActive: true, displayOrder: 2 },
        { _id: '4', name: 'อะไหล่', isActive: true, displayOrder: 3 },
        { _id: '5', name: 'วัสดุก่อสร้าง', isActive: true, displayOrder: 4 },
      ]);
      
      // แสดง toast error
      toast.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้ ใช้ข้อมูลเริ่มต้น');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const resetForm = () => {
    setName('');
    setPrice('');
    setRootShippingFee('');
    setUnits([]);
    setDescription('');
    setImageUrl('');
    setCategory(categories.length > 0 ? categories[0].name : 'ทั่วไป');
    setOptions([]);
    setEditMode(false);
    setCurrentProductId(null);
    setShowForm(false);
    setIsAvailable(true);
    
    // Reset WMS fields
    setWmsEnabled(false);
    setWmsVariantMode(false);
    setWmsVariantConfigs([]);
    setWmsProductCode('');
    setWmsLotGen('');
    setWmsLocationBin('');
    setWmsLotMfg('');
    setWmsAdminUsername('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !description || !imageUrl) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (price.trim() === '' && units.length === 0) {
      toast.error('กรุณาระบุราคาเดี่ยว หรือ เพิ่มหน่วยอย่างน้อย 1 หน่วย');
      return;
    }

    if (price.trim() !== '' && rootShippingFee.trim() !== '' && isNaN(Number(rootShippingFee))) {
      toast.error('ค่าส่งต้องเป็นตัวเลข');
      return;
    }

    if (units.some((u) => u.label.trim() === '' || u.price.trim() === '' || isNaN(Number(u.price)) || (u.shippingFee.trim() !== '' && isNaN(Number(u.shippingFee))))) {
      toast.error('กรุณากรอกข้อมูลหน่วยสินค้าให้ครบถ้วน และราคาต้องเป็นตัวเลข');
      return;
    }

    const productData: any = {
      name,
      description,
      imageUrl,
      category,
      isAvailable,
    };

    if (price.trim() !== '') {
      productData.price = parseFloat(price);
    }

    if (rootShippingFee.trim() !== '') {
      productData.shippingFee = parseFloat(rootShippingFee);
    }

    if (units.length > 0) {
      productData.units = units.map((u) => {
        const unit: any = { label: u.label, price: parseFloat(u.price) };
        if (u.shippingFee.trim() !== '') {
          unit.shippingFee = parseFloat(u.shippingFee);
        }
        return unit;
      });
    }

    // กรอง option ที่ไม่สมบูรณ์ (ชื่อว่าง หรือไม่มี value ที่ label ไม่ว่าง)
    const cleanedOptions = options
      .filter((option) => option.name.trim() && option.values.some((v) => v.label.trim()))
      .map((option) => ({
        name: option.name.trim(),
        values: option.values
          .filter((v) => v.label.trim())
          .map((v) => {
            const val: any = { label: v.label.trim() };
            if (v.imageUrl && v.imageUrl.trim()) {
              val.imageUrl = v.imageUrl.trim();
            }
            if (v.isAvailable !== undefined) {
              val.isAvailable = v.isAvailable;
            }
            return val;
          }),
      }));

    if (options.length > 0 && cleanedOptions.length === 0) {
      toast.error('กรุณากรอกข้อมูลตัวเลือกสินค้าให้ครบถ้วน');
      return;
    }

    if (cleanedOptions.length > 0) {
      productData.options = cleanedOptions;
    }

    // WMS Configuration validation and setup
    if (wmsEnabled) {
      if (!wmsVariantMode) {
        if (!wmsProductCode.trim() || !wmsLotGen.trim() || !wmsLocationBin.trim() || !wmsAdminUsername.trim()) {
          toast.error('กรุณากรอกข้อมูล WMS ให้ครบถ้วน (รหัสสินค้า, Lot Generate, Location Bin, และ Admin Username)');
          return;
        }
        productData.wmsConfig = {
          productCode: wmsProductCode.trim(),
          lotGen: wmsLotGen.trim(),
          locationBin: wmsLocationBin.trim(),
          lotMfg: wmsLotMfg.trim() || undefined,
          adminUsername: wmsAdminUsername.trim(),
          isEnabled: true
        };
      } else {
        // variant mode: ต้องมีรายการอย่างน้อย 1 รายการ และถ้ามี จะ validate ทีละแถว
        if (!wmsVariantConfigs || wmsVariantConfigs.length === 0) {
          toast.error('กรุณาสร้างรายการตั้งค่า WMS ต่อ variant อย่างน้อย 1 รายการ');
          return;
        }
        const invalid = wmsVariantConfigs.find(r => r.isEnabled && (!r.productCode.trim() || !r.lotGen.trim() || !r.locationBin.trim() || !r.adminUsername.trim()));
        if (invalid) {
          toast.error('รายการ WMS บางรายการกรอกไม่ครบถ้วน');
          return;
        }
        productData.wmsVariantConfigs = wmsVariantConfigs.map(r => ({
          key: r.key,
          unitLabel: r.unitLabel,
          options: r.options,
          productCode: r.productCode.trim(),
          lotGen: r.lotGen.trim(),
          locationBin: r.locationBin.trim(),
          lotMfg: r.lotMfg?.trim() || undefined,
          adminUsername: r.adminUsername.trim(),
          isEnabled: r.isEnabled,
        }));
      }
    } else {
      // ไม่ส่งฟิลด์ WMS เมื่อปิดการใช้งาน เพื่อหลีกเลี่ยง validation ฝั่งเซิร์ฟเวอร์
      delete productData.wmsConfig;
      delete productData.wmsVariantConfigs;
    }

    try {
      setIsUploading(true);

      const url = editMode && currentProductId 
        ? `/api/products/${currentProductId}` 
        : '/api/products';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
        credentials: 'include'
      });

      if (response.ok) {
        resetForm();
        // รีเฟรชข้อมูลสินค้าและ clear cache
        await fetchProducts();
        // Force refresh โดยรอสักครู่
        setTimeout(fetchProducts, 500);
        toast.success(editMode ? 'อัพเดทสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
      } else {
        let msg = 'เกิดข้อผิดพลาดในการ' + (editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า');
        try {
          const data = await response.json();
          if (data?.error) msg = data.error;
        } catch {}
        toast.error(msg);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      toast.error('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProduct = (product: ProductWithId) => {
    setName(product.name);
    setPrice(product.price !== undefined ? product.price.toString() : '');
    setRootShippingFee((product as any).shippingFee?.toString() || '');
    setDescription(product.description);
    setImageUrl(product.imageUrl);
    setCategory(product.category || 'ทั่วไป');
    setIsAvailable(product.isAvailable !== false);
    setEditMode(true);
    setCurrentProductId(product._id);
    setShowForm(true);

    if (product.options && product.options.length > 0) {
      setOptions(product.options.map((option) => ({
        name: option.name,
        values: option.values.map((value) => ({
          label: value.label,
          imageUrl: value.imageUrl,
          isAvailable: value.isAvailable !== false, // รวม availability status
        })),
      })));
    } else {
      setOptions([]);
    }

    if (product.units && product.units.length > 0) {
      setUnits(product.units.map((u) => ({ label: u.label, price: u.price.toString(), shippingFee: (u as any).shippingFee?.toString() || '' })));
    } else {
      setUnits([]);
    }

    // Load WMS configuration (product-level + variant-level)
    const anyProduct: any = product as any;
    const hasVariantConfigs = Array.isArray(anyProduct.wmsVariantConfigs) && anyProduct.wmsVariantConfigs.length > 0;

    if (hasVariantConfigs) {
      setWmsEnabled(true);
      setWmsVariantMode(true);
      setWmsVariantConfigs(anyProduct.wmsVariantConfigs.map((r: any) => ({
        key: r.key,
        unitLabel: r.unitLabel,
        options: r.options || {},
        productCode: r.productCode || '',
        lotGen: r.lotGen || '',
        locationBin: r.locationBin || '',
        lotMfg: r.lotMfg || '',
        adminUsername: r.adminUsername || '',
        isEnabled: r.isEnabled !== false,
      })));
      // เติมฟิลด์บนสุดเพื่อช่วย prefill
      const first = anyProduct.wmsVariantConfigs[0];
      setWmsProductCode(first?.productCode || '');
      setWmsLotGen(first?.lotGen || '');
      setWmsLocationBin(first?.locationBin || '');
      setWmsLotMfg(first?.lotMfg || '');
      setWmsAdminUsername(first?.adminUsername || '');
    } else if (anyProduct.wmsConfig) {
      setWmsEnabled(anyProduct.wmsConfig.isEnabled || false);
      setWmsVariantMode(false);
      setWmsVariantConfigs([]);
      setWmsProductCode(anyProduct.wmsConfig.productCode || '');
      setWmsLotGen(anyProduct.wmsConfig.lotGen || '');
      setWmsLocationBin(anyProduct.wmsConfig.locationBin || '');
      setWmsLotMfg(anyProduct.wmsConfig.lotMfg || '');
      setWmsAdminUsername(anyProduct.wmsConfig.adminUsername || '');
    } else {
      setWmsEnabled(false);
      setWmsVariantMode(false);
      setWmsVariantConfigs([]);
      setWmsProductCode('');
      setWmsLotGen('');
      setWmsLocationBin('');
      setWmsLotMfg('');
      setWmsAdminUsername('');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const result = await new Promise<boolean>((resolve) => {
        toast(
          (t) => (
            <div className="flex flex-col">
              <span className="mb-2">คุณต้องการลบสินค้านี้ใช่หรือไม่?</span>
              <div className="flex space-x-2">
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                >
                  ลบ
                </button>
                <button
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(false);
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ),
          { duration: Infinity }
        );
      });

      if (!result) return;

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchProducts();
        toast.success('ลบสินค้าสำเร็จ');
      } else {
        toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบสินค้า:', error);
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    try {
      setIsUploading(true);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success('อัพโหลดรูปภาพสำเร็จ');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { name: '', values: [] }]);
  };

  const removeOption = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateOptionName = (idx: number, name: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? { ...opt, name } : opt)));
  };

  const addOptionValue = (optIdx: number) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx ? { ...opt, values: [...opt.values, { label: '', imageUrl: '', isAvailable: true }] } : opt
      )
    );
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx
          ? { ...opt, values: opt.values.filter((_, vi) => vi !== valIdx) }
          : opt
      )
    );
  };

  const updateOptionValueLabel = (optIdx: number, valIdx: number, label: string) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx
          ? {
              ...opt,
              values: opt.values.map((val, vi) => (vi === valIdx ? { ...val, label } : val)),
            }
          : opt
      )
    );
  };

  const updateOptionValueImage = async (optIdx: number, valIdx: number, file: File) => {
    try {
      setUploadingOptionImage({optIdx, valIdx});
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      if (data.secure_url) {
        setOptions((prev) =>
          prev.map((opt, i) =>
            i === optIdx
              ? {
                  ...opt,
                  values: opt.values.map((v, vi) =>
                    vi === valIdx ? { ...v, imageUrl: data.secure_url as string } : v
                  ),
                }
              : opt
          )
        );
        toast.success('อัพโหลดรูปภาพตัวเลือกสำเร็จ');
      }
    } catch (err) {
      console.error('upload option image error', err);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    } finally {
      setUploadingOptionImage(null);
    }
  };

  const updateOptionValueAvailability = (optIdx: number, valIdx: number, isAvailable: boolean) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx
          ? {
              ...opt,
              values: opt.values.map((v, vi) =>
                vi === valIdx ? { ...v, isAvailable } : v
              ),
            }
          : opt
      )
    );
  };

  const addUnit = () => {
    setUnits((prev) => [...prev, { label: '', price: '', shippingFee: '' }]);
  };

  const removeUnit = (idx: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveUnit = (idx: number, direction: -1 | 1) => {
    setUnits((prev) => {
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[newIdx];
      copy[newIdx] = temp;
      return copy;
    });
  };

  const updateUnitLabel = (idx: number, label: string) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, label } : u)));
  };

  const updateUnitPrice = (idx: number, priceValue: string) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, price: priceValue } : u)));
  };

  const updateUnitShipping = (idx: number, feeValue: string) => {
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, shippingFee: feeValue } : u)));
  };

  const moveOptionValue = (optIdx: number, valIdx: number, direction: -1 | 1) => {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== optIdx) return opt;
        const newIdx = valIdx + direction;
        if (newIdx < 0 || newIdx >= opt.values.length) return opt;
        const newValues = [...opt.values];
        const temp = newValues[valIdx];
        newValues[valIdx] = newValues[newIdx];
        newValues[newIdx] = temp;
        return { ...opt, values: newValues };
      })
    );
  };

  // ทดสอบตรวจสต็อก WMS สำหรับสินค้า
  const testWMSProductStock = async (productId: string) => {
    try {
      const res = await fetch('/api/wms/test-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'ทดสอบล้มเหลว' }));
        toast.error(err.error || 'ทดสอบ WMS ล้มเหลว');
        return;
      }

      const data = await res.json();
      const { counts, tested } = data || {};
      if (counts) {
        toast.success(`ทดสอบ WMS สำเร็จ: พร้อม ${counts.available}, หมด ${counts.out_of_stock}, ไม่พบ ${counts.not_found}, ผิดพลาด ${counts.error} (รวม ${tested})`);
      } else {
        toast.success('ทดสอบ WMS สำเร็จ');
      }
    } catch (e) {
      console.error(e);
      toast.error('เกิดข้อผิดพลาดในการทดสอบ WMS');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.PRODUCTS_VIEW}>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการสินค้า</h1>
            <p className="text-gray-600">เพิ่ม แก้ไข และจัดการสินค้าในร้านของคุณ</p>
          </div>
          {(isAdmin || hasPermission(PERMISSIONS.PRODUCTS_CREATE)) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มสินค้าใหม่</span>
            </motion.button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-square">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.options && product.options.length > 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    มีตัวเลือก
                  </div>
                )}
                {product.isAvailable === false && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    สินค้าหมด
                  </div>
                )}
                {product.isAvailable === false && (
                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <div className="text-center">
                      <span className="text-red-600 font-bold text-sm bg-white bg-opacity-95 px-3 py-1 rounded-lg shadow-lg border border-red-200">
                        สินค้าหมด
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-blue-600 font-bold text-lg mb-3">
                  ฿{
                    product.price !== undefined
                      ? product.price.toLocaleString()
                      : product.units && product.units.length > 0
                        ? product.units[0].price.toLocaleString()
                        : '-'
                  }
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                
                {/* Availability Status */}
                <div className="mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.isAvailable !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                                          {product.isAvailable !== false ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          พร้อมขาย
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          สินค้าหมด
                        </span>
                      )}
                  </span>
                </div>

                {/* Options preview */}
                {product.options && product.options.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">ตัวเลือก:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.options.map((option, idx) => {
                        const availableCount = option.values.filter(v => v.isAvailable !== false).length;
                        const totalCount = option.values.length;
                        return (
                          <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                            {option.name} ({availableCount}/{totalCount})
                            {availableCount === 0 && (
                              <span className="text-red-600 ml-1">หมดทั้งหมด</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {(isAdmin || hasPermission(PERMISSIONS.PRODUCTS_EDIT)) && (
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      แก้ไข
                    </button>
                  )}
                  {(isAdmin || hasPermission(PERMISSIONS.PRODUCTS_DELETE)) && (
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      ลบ
                    </button>
                  )}
                  {(isAdmin || hasPermission(PERMISSIONS.PRODUCTS_EDIT)) && (
                    <button
                      onClick={() => testWMSProductStock(product._id)}
                      className="flex-1 bg-gray-100 text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      title="เรียก WMS ตรวจสต็อกตามการตั้งค่าของสินค้า"
                    >
                      ทดสอบ WMS
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีสินค้า</h3>
            <p className="text-gray-600 mb-6">เริ่มต้นด้วยการเพิ่มสินค้าแรกของคุณ</p>
            {(isAdmin || hasPermission(PERMISSIONS.PRODUCTS_CREATE)) && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                เพิ่มสินค้าใหม่
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="เช่น เสื้อยืดลายแมว"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ราคาเริ่มต้น (บาท) *(ไม่ใส่ได้ถ้ามีหน่วย)*</label>
                        <input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="เช่น 199"
                        />
                      </div>

                      {price.trim() !== '' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ค่าส่ง (บาท)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={rootShippingFee}
                            onChange={(e) => setRootShippingFee(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="เช่น 50 (0 = ส่งฟรี)"
                          />
                        </div>
                      )}

                      {/* Units Section */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-gray-700">หน่วยสินค้า</span>
                          <button
                            type="button"
                            onClick={addUnit}
                            className="bg-indigo-600 text-white text-xs px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                          >
                            + เพิ่มหน่วย
                          </button>
                        </div>

                        {units.length === 0 && (
                          <p className="text-xs text-gray-500">ยังไม่มีหน่วย เพิ่มใหม่ได้ตามต้องการ</p>
                        )}

                        <div className="space-y-3">
                          {units.map((u, idx) => (
                            <div key={idx} className="mb-2 grid grid-cols-12 gap-2 items-center">
                              <input
                                type="text"
                                placeholder="หน่วย เช่น หลอด"
                                value={u.label}
                                onChange={(e) => updateUnitLabel(idx, e.target.value)}
                                className="col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="ราคา"
                                value={u.price}
                                onChange={(e) => updateUnitPrice(idx, e.target.value)}
                                className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="ค่าส่ง"
                                value={u.shippingFee}
                                onChange={(e) => updateUnitShipping(idx, e.target.value)}
                                className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <div className="col-span-2 flex gap-1">
                                <button type="button" onClick={() => moveUnit(idx, -1)} className="text-gray-500 hover:text-gray-700 text-xs">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button type="button" onClick={() => moveUnit(idx, 1)} className="text-gray-500 hover:text-gray-700 text-xs">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button type="button" onClick={() => removeUnit(idx)} className="text-red-500 hover:text-red-700 text-xs">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {categories.length === 0 && (
                          <p className="text-xs text-yellow-600 mt-1">
                            <svg className="w-4 h-4 mr-1 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              ยังไม่มีหมวดหมู่ กรุณาเพิ่มหมวดหมู่ก่อนเพิ่มสินค้า
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะสินค้า</label>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="availability"
                              checked={isAvailable}
                              onChange={() => setIsAvailable(true)}
                              className="mr-2"
                            />
                            <span className="text-green-600 inline-flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      พร้อมขาย
                    </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="availability"
                              checked={!isAvailable}
                              onChange={() => setIsAvailable(false)}
                              className="mr-2"
                            />
                            <span className="text-red-600 inline-flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      สินค้าหมด
                    </span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          เมื่อเลือก "สินค้าหมด" ลูกค้าจะเห็นสินค้าแต่ไม่สามารถสั่งซื้อได้
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียดสินค้า</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          placeholder="รายละเอียดสินค้าโดยย่อ"
                          required
                        />
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        {imageUrl ? (
                          <div className="relative w-full h-48 mb-4">
                            <Image
                              src={imageUrl}
                              alt="ตัวอย่างรูปภาพ"
                              fill
                              className="object-contain rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="py-8">
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500 mb-2">คลิกเพื่ือเลือกรูปภาพ</p>
                          </div>
                        )}
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadImage}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        
                        {isUploading && (
                          <div className="mt-4 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600">กำลังอัพโหลด...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">ตัวเลือกสินค้า (ถ้ามี)</h3>
                      <button
                        type="button"
                        onClick={addOption}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>เพิ่มตัวเลือก</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {options.map((option, optIdx) => (
                        <motion.div
                          key={optIdx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateOptionName(optIdx, e.target.value)}
                              placeholder="ชื่อตัวเลือก เช่น สี, ขนาด"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(optIdx)}
                              className="ml-4 text-red-600 hover:text-red-800 p-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="space-y-3">
                            {option.values.map((value, valIdx) => (
                              <div key={valIdx} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                                <input
                                  type="text"
                                  value={value.label}
                                  onChange={(e) => updateOptionValueLabel(optIdx, valIdx, e.target.value)}
                                  placeholder="ค่าตัวเลือก เช่น แดง, L"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />

                                {value.imageUrl && (
                                  <div className="relative w-12 h-12 flex-shrink-0">
                                    <Image
                                      src={value.imageUrl}
                                      alt={value.label}
                                      fill
                                      className="object-cover rounded"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center space-x-2">
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) updateOptionValueImage(optIdx, valIdx, file);
                                      }}
                                      className="hidden"
                                    />
                                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                                      {uploadingOptionImage?.optIdx === optIdx && uploadingOptionImage?.valIdx === valIdx ? 
                                        'กำลังอัพโหลด...' : 'เลือกรูป'
                                      }
                                    </span>
                                  </label>

                                  {/* Availability Toggle */}
                                  <label className="flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      checked={value.isAvailable !== false}
                                      onChange={(e) => updateOptionValueAvailability(optIdx, valIdx, e.target.checked)}
                                      className="rounded border-gray-300"
                                    />
                                    <span className={`text-xs font-medium ${
                                      value.isAvailable !== false ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {value.isAvailable !== false ? 'มีสินค้า' : 'หมด'}
                                    </span>
                                  </label>

                                  <button type="button" onClick={() => moveOptionValue(optIdx, valIdx, -1)} className="text-gray-500 hover:text-gray-700 p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                  <button type="button" onClick={() => moveOptionValue(optIdx, valIdx, 1)} className="text-gray-500 hover:text-gray-700 p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeOptionValue(optIdx, valIdx)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addOptionValue(optIdx)}
                              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                            >
                              + เพิ่มค่าตัวเลือก
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* WMS Configuration Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">การตั้งค่า WMS Thailand</h3>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={wmsEnabled}
                          onChange={(e) => setWmsEnabled(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">เปิดใช้งาน WMS</span>
                      </label>
                    </div>
                    
                    {wmsEnabled && (
                      <div className="space-y-6">
                        {/* Toggle variant mode */}
                        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium text-gray-700">โหมดกำหนดค่าแยกตามตัวเลือก/หน่วย (Variant Mode)</p>
                            <p className="text-xs text-gray-500">เมื่อเปิด จะสามารถกำหนด WMS ต่อชุด Unit + ตัวเลือก ได้</p>
                          </div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={wmsVariantMode}
                              onChange={(e) => setWmsVariantMode(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700">เปิดโหมด Variant</span>
                          </label>
                        </div>

                        {/* Top-level fields (used when not variant mode, or for prefill) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            รหัสสินค้า (Product Code) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={wmsProductCode}
                            onChange={(e) => setWmsProductCode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="เช่น P001"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lot Generate <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={wmsLotGen}
                            onChange={(e) => setWmsLotGen(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="เช่น LOT202407001"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location Bin <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={wmsLocationBin}
                            onChange={(e) => setWmsLocationBin(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="เช่น BIN-A1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lot Manufacturing (ไม่บังคับ)
                          </label>
                          <input
                            type="text"
                            value={wmsLotMfg}
                            onChange={(e) => setWmsLotMfg(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="เช่น MFG-XYZ"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Username <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={wmsAdminUsername}
                            onChange={(e) => setWmsAdminUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ชื่อผู้ใช้แอดมินใน WMS"
                          />
                        </div>
                        </div>

                        {/* Variant table */}
                        {wmsVariantMode && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-gray-800">กำหนดค่า WMS ต่อ Variant</h4>
                              <div className="flex gap-2">
                                <button type="button" onClick={generateVariantRows} className="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200">รีเฟรชรายการ</button>
                                <button type="button" onClick={prefillAllFromTopLevel} className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Prefill จากฟิลด์ด้านบน</button>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 text-gray-700">
                                    <th className="px-3 py-2 text-left">Unit</th>
                                    <th className="px-3 py-2 text-left">ตัวเลือก</th>
                                    <th className="px-3 py-2 text-left">Product Code</th>
                                    <th className="px-3 py-2 text-left">Lot Gen</th>
                                    <th className="px-3 py-2 text-left">Location Bin</th>
                                    <th className="px-3 py-2 text-left">Lot Mfg</th>
                                    <th className="px-3 py-2 text-left">Admin</th>
                                    <th className="px-3 py-2 text-left">เปิดใช้</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {wmsVariantConfigs.map((row, idx) => (
                                    <tr key={row.key} className="bg-white">
                                      <td className="px-3 py-2 whitespace-nowrap">{row.unitLabel || '-'}</td>
                                      <td className="px-3 py-2">
                                        {Object.keys(row.options).length > 0
                                          ? Object.entries(row.options).map(([k, v]) => (
                                              <span key={k} className="inline-block mr-2 bg-gray-100 rounded px-2 py-0.5">{k}: {v}</span>
                                            ))
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2">
                                        <input value={row.productCode} onChange={(e) => updateVariantRow(idx, { productCode: e.target.value })} className="w-40 px-2 py-1 border rounded" />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input value={row.lotGen} onChange={(e) => updateVariantRow(idx, { lotGen: e.target.value })} className="w-40 px-2 py-1 border rounded" />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input value={row.locationBin} onChange={(e) => updateVariantRow(idx, { locationBin: e.target.value })} className="w-36 px-2 py-1 border rounded" />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input value={row.lotMfg || ''} onChange={(e) => updateVariantRow(idx, { lotMfg: e.target.value })} className="w-28 px-2 py-1 border rounded" />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input value={row.adminUsername} onChange={(e) => updateVariantRow(idx, { adminUsername: e.target.value })} className="w-36 px-2 py-1 border rounded" />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input type="checkbox" checked={row.isEnabled} onChange={(e) => updateVariantRow(idx, { isEnabled: e.target.checked })} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!wmsEnabled && (
                      <p className="text-sm text-gray-500 italic">
                        เปิดใช้งาน WMS เพื่อตรวจสอบสต็อกสินค้าอัตโนมัติผ่านระบบ WMS Thailand
                      </p>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'กำลังบันทึก...' : (editMode ? 'อัพเดทสินค้า' : 'เพิ่มสินค้า')}
                    </button>
                    
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </PermissionGate>
  );
};

export default AdminProductsPage; 