// Scheduler utility สำหรับจัดการงาน cron job
let isSchedulerRunning = false;
const isSchedulerDebug: boolean =
  process.env.NODE_ENV === 'development' ||
  (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_DEBUG_SCHEDULER === 'true');

export function startAutoCartClearScheduler() {
  if (isSchedulerRunning) return;
  
  isSchedulerRunning = true;
  if (isSchedulerDebug) {
    console.log('[SCHEDULER] Starting auto cart clear scheduler');
  }
  
  // ตรวจสอบเวลาทุกๆ 1 นาที
  setInterval(async () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // ถ้าเป็นเวลา 0:00 น. (00:00)
    if (hours === 0 && minutes === 0) {
      if (isSchedulerDebug) {
        console.log('[SCHEDULER] Triggering auto cart clear at 00:00');
      }
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/api/worker/clear-carts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (isSchedulerDebug) {
            console.log('[SCHEDULER] Auto cart clear completed:', result);
          }
        } else {
          if (isSchedulerDebug) {
            console.error('[SCHEDULER] Auto cart clear failed:', await response.text());
          }
        }
      } catch (error) {
        if (isSchedulerDebug) {
          console.error('[SCHEDULER] Error calling auto cart clear:', error);
        }
      }
    }
  }, 60000); // ตรวจสอบทุกๆ 1 นาที
}

export function stopAutoCartClearScheduler() {
  isSchedulerRunning = false;
  if (isSchedulerDebug) {
    console.log('[SCHEDULER] Stopping auto cart clear scheduler');
  }
} 