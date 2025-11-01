// Utility functions for cart management with safe localStorage handling

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: { [key: string]: string };
  unitLabel?: string;
  unitPrice?: number;
}

export interface CartObject {
  [key: string]: {
    product: any;
    quantity: number;
    selectedOptions?: { [key: string]: string };
    unitLabel?: string;
    unitPrice?: number;
  };
}

// ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
export const isOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

// ตรวจสอบว่า localStorage สามารถใช้งานได้หรือไม่
export const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    if (!isOnline()) {
      console.warn('ไม่มีการเชื่อมต่ออินเทอร์เน็ต');
      return false;
    }
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// อ่านข้อมูลตะกร้าจาก localStorage อย่างปลอดภัย
export const getCartFromStorage = (): CartObject => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage ไม่สามารถใช้งานได้');
    return {};
  }

  try {
    const cartData = localStorage.getItem('cart');
    if (!cartData) return {};

    const parsedCart = JSON.parse(cartData);
    
    // รองรับทั้งรูปแบบเก่า (array) และใหม่ (object)
    if (Array.isArray(parsedCart)) {
      // แปลงจาก array เป็น object
      const cartObject: CartObject = {};
      parsedCart.forEach((item: CartItem, index: number) => {
        const key = `${item.productId}-${item.unitLabel || 'default'}-${JSON.stringify(item.selectedOptions || {})}`;
        cartObject[key] = {
          product: { _id: item.productId, name: item.name },
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice || item.price,
        };
      });
      return cartObject;
    } else if (typeof parsedCart === 'object' && parsedCart !== null) {
      return parsedCart;
    }
    
    return {};
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
    return {};
  }
};

// บันทึกข้อมูลตะกร้าลง localStorage อย่างปลอดภัย
export const saveCartToStorage = (cart: CartObject): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage ไม่สามารถใช้งานได้');
    return false;
  }

  try {
    localStorage.setItem('cart', JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
    return false;
  }
};

// สร้าง cart key สำหรับการจัดการตะกร้า
export const generateCartKey = (
  productId: string, 
  selectedOptions?: {[key: string]: string}, 
  unitLabel?: string
): string => {
  const parts = [productId];
  if (unitLabel) parts.push(unitLabel);
  if (selectedOptions && Object.keys(selectedOptions).length > 0) {
    parts.push(JSON.stringify(selectedOptions));
  }
  return parts.join('-');
};

// เพิ่มสินค้าลงตะกร้า
export const addToCart = (
  product: any,
  quantity: number,
  selectedOptions?: {[key: string]: string},
  unitLabel?: string,
  unitPrice?: number
): boolean => {
  try {
    const cart = getCartFromStorage();
    const cartKey = generateCartKey(product._id, selectedOptions, unitLabel);
    
    if (cart[cartKey]) {
      cart[cartKey] = {
        ...cart[cartKey],
        quantity: cart[cartKey].quantity + quantity
      };
    } else {
      cart[cartKey] = {
        product: product,
        quantity: quantity,
        selectedOptions: selectedOptions || {},
        unitLabel: unitLabel,
        unitPrice: unitPrice,
      };
    }
    
    return saveCartToStorage(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

// แปลง cart object เป็น array สำหรับการแสดงผล
export const cartObjectToArray = (cart: CartObject): CartItem[] => {
  return Object.values(cart).map((item: any) => ({
    productId: item.product._id || item.productId,
    name: item.product.name || item.name,
    price: item.unitPrice || item.price,
    quantity: item.quantity,
    selectedOptions: item.selectedOptions || {},
    unitLabel: item.unitLabel || '',
    unitPrice: item.unitPrice || item.price,
  }));
};
