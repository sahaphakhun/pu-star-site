/**
 * Mobile Keyboard Fix for Android Devices
 * แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์บนมือถือแอนดรอยด์
 */

// ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
};

// ตรวจสอบว่าเป็นอุปกรณ์แอนดรอยด์หรือไม่
export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android/i.test(navigator.userAgent);
};

// ตรวจสอบว่าเป็นอุปกรณ์ที่มี touch screen หรือไม่
export const hasTouchScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์สำหรับ input field
export const fixInputKeyboard = (inputElement: HTMLInputElement | HTMLTextAreaElement): void => {
  if (!inputElement || !isMobileDevice()) return;

  // เพิ่ม event listeners สำหรับแก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์
  const events = ['touchstart', 'touchend', 'touchmove', 'click', 'focus', 'blur'];
  
  events.forEach(eventType => {
    inputElement.addEventListener(eventType, (e) => {
      // แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์บนแอนดรอยด์
      if (isAndroidDevice()) {
        // บังคับให้ input field เปิดแป้นพิมพ์
        inputElement.setAttribute('readonly', 'readonly');
        inputElement.removeAttribute('readonly');
        
        // Focus input field
        inputElement.focus();
        
        // เปิดแป้นพิมพ์บนมือถือ
        if (inputElement.type === 'tel') {
          inputElement.setAttribute('inputmode', 'numeric');
        } else if (inputElement.type === 'text') {
          inputElement.setAttribute('inputmode', 'text');
        }
        
        // แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์บนแอนดรอยด์
        inputElement.style.webkitUserModify = 'read-write-plaintext-only';
        inputElement.style.webkitTransform = 'translate3d(0, 0, 0)';
        inputElement.style.transform = 'translate3d(0, 0, 0)';
      }
    }, { passive: true });
  });

  // เพิ่ม CSS properties สำหรับแก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์
  if (isAndroidDevice()) {
    inputElement.style.webkitAppearance = 'none';
    inputElement.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
    inputElement.style.touchAction = 'manipulation';
    inputElement.style.minHeight = '48px';
    inputElement.style.minWidth = '48px';
    inputElement.style.fontSize = '16px';
  }
};

// แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์สำหรับ input fields ทั้งหมดในหน้า
export const fixAllInputKeyboards = (): void => {
  if (typeof window === 'undefined' || !isMobileDevice()) return;

  // หา input fields ทั้งหมด
  const inputElements = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], textarea, select');
  
  inputElements.forEach((element) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      fixInputKeyboard(element as HTMLInputElement | HTMLTextAreaElement);
    }
  });
};

// แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์สำหรับ input field ที่สร้างใหม่
export const observeNewInputs = (): void => {
  if (typeof window === 'undefined' || !isMobileDevice()) return;

  // ใช้ MutationObserver เพื่อติดตาม input fields ใหม่
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // ตรวจสอบ input fields ใน node ใหม่
          const inputs = element.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], textarea, select');
          inputs.forEach((input) => {
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
              fixInputKeyboard(input as HTMLInputElement | HTMLTextAreaElement);
            }
          });
          
          // ตรวจสอบว่า node เองเป็น input field หรือไม่
          if (element.matches('input[type="text"], input[type="tel"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], textarea, select')) {
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
              fixInputKeyboard(element as HTMLInputElement | HTMLTextAreaElement);
            }
          }
        }
      });
    });
  });

  // เริ่มต้นการติดตาม
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
};

// แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์สำหรับ input field ที่มี disabled state
export const fixDisabledInputs = (): void => {
  if (typeof window === 'undefined' || !isMobileDevice()) return;

  const disabledInputs = document.querySelectorAll('input[disabled], textarea[disabled], select[disabled]');
  
  disabledInputs.forEach((element) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      // ปรับ appearance ของ disabled input
      element.style.opacity = '0.6';
      element.style.cursor = 'not-allowed';
      element.style.backgroundColor = '#f3f4f6';
      element.style.pointerEvents = 'none';
      element.style.webkitUserSelect = 'none';
      element.style.userSelect = 'none';
      element.style.webkitUserModify = 'read-only';
      element.style.userModify = 'read-only';
    }
  });
};

// แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์สำหรับ input field ที่มี readonly state
export const fixReadonlyInputs = (): void => {
  if (typeof window === 'undefined' || !isMobileDevice()) return;

  const readonlyInputs = document.querySelectorAll('input[readonly], textarea[readonly]');
  
  readonlyInputs.forEach((element) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      // ปรับ appearance ของ readonly input
      element.style.backgroundColor = '#f9fafb';
      element.style.cursor = 'default';
      element.style.webkitUserSelect = 'text';
      element.style.userSelect = 'text';
      element.style.webkitUserModify = 'read-only';
      element.style.userModify = 'read-only';
    }
  });
};

// เริ่มต้นการแก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์
export const initMobileKeyboardFix = (): void => {
  if (typeof window === 'undefined' || !isMobileDevice()) return;

  // รอให้ DOM โหลดเสร็จ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      fixAllInputKeyboards();
      fixDisabledInputs();
      fixReadonlyInputs();
      observeNewInputs();
    });
  } else {
    fixAllInputKeyboards();
    fixDisabledInputs();
    fixReadonlyInputs();
    observeNewInputs();
  }

  // แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์เมื่อมีการ scroll หรือ resize
  window.addEventListener('scroll', () => {
    if (isMobileDevice()) {
      fixAllInputKeyboards();
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (isMobileDevice()) {
      fixAllInputKeyboards();
    }
  }, { passive: true });

  // แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์เมื่อมีการ focus change
  document.addEventListener('focusin', (e) => {
    if (isMobileDevice() && e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
      fixInputKeyboard(e.target as HTMLInputElement | HTMLTextAreaElement);
    }
  });

  document.addEventListener('focusout', (e) => {
    if (isMobileDevice() && e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
      // แก้ไขปัญหาการไม่ขึ้นแป้นพิมพ์เมื่อ blur
      const element = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (element.value) {
        element.style.webkitUserModify = 'read-write-plaintext-only';
        element.style.userModify = 'read-write-plaintext-only';
      }
    }
  });
};

// Export default function
export default {
  isMobileDevice,
  isAndroidDevice,
  hasTouchScreen,
  fixInputKeyboard,
  fixAllInputKeyboards,
  observeNewInputs,
  fixDisabledInputs,
  fixReadonlyInputs,
  initMobileKeyboardFix
};
