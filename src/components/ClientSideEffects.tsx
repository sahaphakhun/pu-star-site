'use client';

import { useEffect } from 'react';
import { startAutoCartClearScheduler } from '@/utils/scheduler';
import { startPerformanceMonitoring } from '@/utils/performance';
import { initMobileKeyboardFix } from '@/utils/mobile-keyboard-fix';

export default function ClientSideEffects() {
  useEffect(() => {
    startAutoCartClearScheduler();
    startPerformanceMonitoring();
    initMobileKeyboardFix();
  }, []);

  return null;
}
