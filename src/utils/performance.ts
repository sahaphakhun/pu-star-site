// Performance Monitoring และ Analytics Utilities

// Web Vitals Monitoring
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // LCP (Largest Contentful Paint)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        
        console.log('LCP:', lcp);
        
        // ส่งข้อมูลไปยัง analytics
        if (lcp > 2500) {
          console.warn('LCP เกินมาตรฐาน:', lcp);
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.error('Error measuring LCP:', error);
    }
  }

  // FID (First Input Delay)
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          
          console.log('FID:', fid);
          
          // ส่งข้อมูลไปยัง analytics
          if (fid > 100) {
            console.warn('FID เกินมาตรฐาน:', fid);
          }
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.error('Error measuring FID:', error);
    }
  }

  // CLS (Cumulative Layout Shift)
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      let clsEntries: any[] = [];
      
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        }
        
        console.log('CLS:', clsValue);
        
        // ส่งข้อมูลไปยัง analytics
        if (clsValue > 0.1) {
          console.warn('CLS เกินมาตรฐาน:', clsValue);
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.error('Error measuring CLS:', error);
    }
  }
};

// Performance Metrics
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
    
    // Resource Timing
    totalResources: performance.getEntriesByType('resource').length,
    
    // Memory Usage (if available)
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : null
  };

  return metrics;
};

// Resource Loading Performance
export const measureResourcePerformance = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource');
  
  resources.forEach((resource) => {
    const duration = resource.duration;
    const size = (resource as any).transferSize || 0;
    
    if (duration > 1000) {
      console.warn('Resource loading ช้า:', resource.name, duration + 'ms');
    }
    
    if (size > 1024 * 1024) { // 1MB
      console.warn('Resource ขนาดใหญ่:', resource.name, (size / 1024 / 1024).toFixed(2) + 'MB');
    }
  });
};

// Bundle Size Monitoring
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
  
  if (totalSize > 500) {
    console.warn('Bundle size ใหญ่เกินไป:', totalSize + 'KB');
  }
};

// Memory Leak Detection
export const detectMemoryLeaks = () => {
  if (typeof window === 'undefined') return;

  if ((performance as any).memory) {
    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const limit = memory.jsHeapSizeLimit;
    
    const usagePercentage = (used / limit) * 100;
    
    if (usagePercentage > 80) {
      console.warn('Memory usage สูง:', usagePercentage.toFixed(2) + '%');
    }
    
    if (used > 50 * 1024 * 1024) { // 50MB
      console.warn('Memory usage สูง:', (used / 1024 / 1024).toFixed(2) + 'MB');
    }
  }
};

// Performance Budget Monitoring
export const checkPerformanceBudget = () => {
  const metrics = getPerformanceMetrics();
  if (!metrics) return;

  const budget = {
    firstPaint: 1000, // 1s
    firstContentfulPaint: 1500, // 1.5s
    domContentLoaded: 2000, // 2s
    loadComplete: 3000, // 3s
    totalResources: 50,
    bundleSize: 500 // 500KB
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

// Performance Reporting
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

// Auto Performance Monitoring
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
      }, 1000);
    });
  } else {
    setTimeout(() => {
      measureWebVitals();
      measureResourcePerformance();
      measureBundleSize();
      detectMemoryLeaks();
      checkPerformanceBudget();
      reportPerformance();
    }, 1000);
  }

  // Monitoring ตลอด session
  setInterval(() => {
    detectMemoryLeaks();
    checkPerformanceBudget();
  }, 30000); // ทุก 30 วินาที
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
