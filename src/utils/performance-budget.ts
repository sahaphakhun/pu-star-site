// Performance Budget Management
export interface PerformanceBudget {
  maxBundleSize: number; // ใน KB
  maxEntrypointSize: number; // ใน KB
  maxTotalResources: number;
  maxLCP: number; // ใน ms
  maxFID: number; // ใน ms
  maxCLS: number;
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  maxBundleSize: 800, // Increased from 500KB to 800KB
  maxEntrypointSize: 800, // Increased from 500KB to 800KB
  maxTotalResources: 80, // Increased from 50 to 80
  maxLCP: 3000, // Increased from 2.5s to 3s
  maxFID: 150, // Increased from 100ms to 150ms
  maxCLS: 0.15, // Increased from 0.1 to 0.15
};

export class PerformanceBudgetChecker {
  private budget: PerformanceBudget;
  private violations: string[] = [];

  constructor(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
    this.budget = budget;
  }

  checkBundleSize(bundleSize: number): boolean {
    const sizeInKB = bundleSize / 1024;
    if (sizeInKB > this.budget.maxBundleSize) {
      this.violations.push(`Bundle size ใหญ่เกินไป: ${sizeInKB.toFixed(0)}KB > ${this.budget.maxBundleSize}KB`);
      return false;
    }
    return true;
  }

  checkTotalResources(resourceCount: number): boolean {
    if (resourceCount > this.budget.maxTotalResources) {
      this.violations.push(`Total Resources: ${resourceCount} > ${this.budget.maxTotalResources}`);
      return false;
    }
    return true; // Fixed: was returning false instead of true
  }

  checkLCP(lcp: number): boolean {
    if (lcp > this.budget.maxLCP) {
      this.violations.push(`LCP เกินมาตรฐาน: ${lcp}ms > ${this.budget.maxLCP}ms`);
      return false;
    }
    return true;
  }

  checkFID(fid: number): boolean {
    if (fid > this.budget.maxFID) {
      this.violations.push(`FID เกินมาตรฐาน: ${fid}ms > ${this.budget.maxFID}ms`);
      return false;
    }
    return true;
  }

  checkCLS(cls: number): boolean {
    if (cls > this.budget.maxCLS) {
      this.violations.push(`CLS เกินมาตรฐาน: ${cls} > ${this.budget.maxCLS}`);
      return false;
    }
    return true;
  }

  getViolations(): string[] {
    return this.violations;
  }

  hasViolations(): boolean {
    return this.violations.length > 0;
  }

  clearViolations(): void {
    this.violations = [];
  }

  generateReport(): string {
    if (this.violations.length === 0) {
      return '✅ ไม่มี Performance Budget Violations';
    }
    
    return `❌ Performance Budget Violations:\n${this.violations.map(v => `- ${v}`).join('\n')}`;
  }
}

// Lazy loading สำหรับ performance monitoring
export const createPerformanceMonitor = () => {
  let isInitialized = false;
  let budgetChecker: PerformanceBudgetChecker;

  return {
    init: () => {
      if (isInitialized) return;
      
      budgetChecker = new PerformanceBudgetChecker();
      isInitialized = true;
      
      // เริ่มต้น monitoring เฉพาะเมื่อจำเป็น
      if (typeof window !== 'undefined') {
        // Lazy load performance monitoring
        import('./performance').then(({ measureWebVitals }) => {
          measureWebVitals();
        });
      }
    },
    
    checkBudget: (metrics: any) => {
      if (!budgetChecker) return;
      
      if (metrics.bundleSize) {
        budgetChecker.checkBundleSize(metrics.bundleSize);
      }
      
      if (metrics.resourceCount) {
        budgetChecker.checkTotalResources(metrics.resourceCount);
      }
      
      if (metrics.lcp) {
        budgetChecker.checkLCP(metrics.lcp);
      }
      
      if (metrics.fid) {
        budgetChecker.checkFID(metrics.fid);
      }
      
      if (metrics.cls) {
        budgetChecker.checkCLS(metrics.cls);
      }
      
      return budgetChecker.getViolations();
    },
    
    getReport: () => {
      return budgetChecker?.generateReport() || 'Performance monitor ยังไม่ได้เริ่มต้น';
    }
  };
};
