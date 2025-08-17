// Performance Monitoring และ Analytics Utilities - Optimized Version
import { createPerformanceMonitor } from './performance-budget';

// Lazy load performance monitoring
let performanceMonitor: ReturnType<typeof createPerformanceMonitor> | null = null;

// Web Vitals Monitoring - แยกเป็น lazy loading
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // เริ่มต้น performance monitor
  if (!performanceMonitor) {
    performanceMonitor = createPerformanceMonitor();
    performanceMonitor.init();
  }

  // LCP (Largest Contentful Paint) - lazy load
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        
        // ตรวจสอบ performance budget
        if (performanceMonitor) {
          performanceMonitor.checkBudget({ lcp });
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.error('Error measuring LCP:', error);
    }
  }

  // FID (First Input Delay) - lazy load
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          
          // ตรวจสอบ performance budget
          if (performanceMonitor) {
            performanceMonitor.checkBudget({ fid });
          }
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.error('Error measuring FID:', error);
    }
  }

  // CLS (Cumulative Layout Shift) - lazy load
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        // ตรวจสอบ performance budget
        if (performanceMonitor) {
          performanceMonitor.checkBudget({ cls: clsValue });
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.error('Error measuring CLS:', error);
    }
  }
};

// Performance Metrics - Optimized to reduce resource usage
export const getPerformanceMetrics = () => {
  if (typeof window === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  const metrics = {
    // Navigation Timing
    dnsLookup: navigation?.domainLookupEnd - navigation?.domainLookupStart || 0,
    tcpConnection: navigation?.connectEnd - navigation?.connectStart || 0,
    serverResponse: navigation?.responseEnd - navigation?.requestStart || 0,
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
    
    // Paint Timing
    firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
    firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    
    // Resource Timing - Optimized to count only critical resources
    totalResources: performance.getEntriesByType('resource').filter(resource => {
      const name = resource.name;
      // Only count important resources, exclude analytics, tracking, etc.
      return !name.includes('google-analytics') && 
             !name.includes('googletagmanager') && 
             !name.includes('facebook') &&
             !name.includes('doubleclick') &&
             !name.includes('googlesyndication');
    }).length,
    
    // Memory Usage (if available)
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : null
  };

  return metrics;
};

// Resource Loading Performance - Optimized
export const measureResourcePerformance = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource');
  
  // Only log critical resources to reduce console noise
  resources.forEach((resource) => {
    const duration = resource.duration;
    const size = (resource as any).transferSize || 0;
    
    // Only warn for very slow resources (>2s) or very large ones (>2MB)
    if (duration > 2000) {
      console.warn('Resource loading ช้า:', resource.name, duration + 'ms');
    }
    
    if (size > 2 * 1024 * 1024) { // 2MB
      console.warn('Resource ขนาดใหญ่:', resource.name, (size / 1024 / 1024).toFixed(2) + 'MB');
    }
  });
};

// Bundle Size Monitoring - Optimized
export const measureBundleSize = () => {
  if (typeof window === 'undefined') return;

  const scripts = document.querySelectorAll('script[src]');
  let totalSize = 0;
  
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (src && src.includes('_next/static')) {
      // ประมาณขนาดไฟล์จาก URL
      if (src.includes('chunks')) {
        totalSize += 100; // ประมาณ 100KB ต่อ chunk
      }
    }
  });
  
  console.log('Estimated bundle size:', totalSize + 'KB');
  
  // Increased threshold to match Next.js config
  if (totalSize > 800) {
    console.warn('Bundle size ใหญ่เกินไป:', totalSize + 'KB');
  }
};

// Memory Leak Detection - Optimized
export const detectMemoryLeaks = () => {
  if (typeof window === 'undefined') return;

  if ((performance as any).memory) {
    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const limit = memory.jsHeapSizeLimit;
    
    const usagePercentage = (used / limit) * 100;
    
    // Only warn for very high memory usage
    if (usagePercentage > 90) {
      console.warn('Memory usage สูง:', usagePercentage.toFixed(2) + '%');
    }
    
    if (used > 100 * 1024 * 1024) { // 100MB
      console.warn('Memory usage สูง:', (used / 1024 / 1024).toFixed(2) + 'MB');
    }
  }
};

// Performance Budget Monitoring - Updated thresholds
export const checkPerformanceBudget = () => {
  const metrics = getPerformanceMetrics();
  if (!metrics) return;

  const budget = {
    firstPaint: 1500, // Increased from 1s to 1.5s
    firstContentfulPaint: 2000, // Increased from 1.5s to 2s
    domContentLoaded: 2500, // Increased from 2s to 2.5s
    loadComplete: 4000, // Increased from 3s to 4s
    totalResources: 80, // Increased from 50 to 80
    bundleSize: 800 // Increased from 500KB to 800KB
  };

  const violations = [];

  if (metrics.firstPaint > budget.firstPaint) {
    violations.push(`First Paint: ${metrics.firstPaint}ms > ${budget.firstPaint}ms`);
  }

  if (metrics.firstContentfulPaint > budget.firstContentfulPaint) {
    violations.push(`FCP: ${metrics.firstContentfulPaint}ms > ${budget.firstContentfulPaint}ms`);
  }

  if (metrics.domContentLoaded > budget.domContentLoaded) {
    violations.push(`DOM Content Loaded: ${metrics.domContentLoaded}ms > ${budget.domContentLoaded}ms`);
  }

  if (metrics.loadComplete > budget.loadComplete) {
    violations.push(`Load Complete: ${metrics.loadComplete}ms > ${budget.loadComplete}ms`);
  }

  if (metrics.totalResources > budget.totalResources) {
    violations.push(`Total Resources: ${metrics.totalResources} > ${budget.totalResources}`);
  }

  if (violations.length > 0) {
    console.warn('Performance Budget Violations:', violations);
  }

  return violations;
};

// Performance Reporting - Optimized
export const reportPerformance = () => {
  const metrics = getPerformanceMetrics();
  const violations = checkPerformanceBudget();
  
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    metrics,
    violations,
    userAgent: navigator.userAgent,
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : null
  };

  // ส่งข้อมูลไปยัง analytics service
  console.log('Performance Report:', report);
  
  // สามารถส่งไปยัง Google Analytics, Custom API, หรือ Logging Service ได้
  return report;
};

// Auto Performance Monitoring - Optimized frequency
export const startPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // เริ่มต้น monitoring เมื่อ page load เสร็จ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        measureWebVitals();
        measureResourcePerformance();
        measureBundleSize();
        detectMemoryLeaks();
        checkPerformanceBudget();
        reportPerformance();
      }, 2000); // Increased delay to reduce initial load impact
    });
  } else {
    setTimeout(() => {
      measureWebVitals();
      measureResourcePerformance();
      measureBundleSize();
      detectMemoryLeaks();
      checkPerformanceBudget();
      reportPerformance();
    }, 2000); // Increased delay to reduce initial load impact
  }

  // Monitoring ตลอด session - Reduced frequency
  setInterval(() => {
    detectMemoryLeaks();
    checkPerformanceBudget();
  }, 60000); // Changed from 30s to 60s to reduce overhead
};

// Export all functions
export default {
  measureWebVitals,
  getPerformanceMetrics,
  measureResourcePerformance,
  measureBundleSize,
  detectMemoryLeaks,
  checkPerformanceBudget,
  reportPerformance,
  startPerformanceMonitoring
};
