// Scheduler utility สำหรับจัดการงาน cron job
let isSchedulerRunning = false;

export function startAutoCartClearScheduler() {
  if (isSchedulerRunning) return;
  
  isSchedulerRunning = true;
  console.log('[SCHEDULER] Starting auto cart clear scheduler');
  
  // ตรวจสอบเวลาทุกๆ 1 นาที
  setInterval(async () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // ถ้าเป็นเวลา 0:00 น. (00:00)
    if (hours === 0 && minutes === 0) {
      console.log('[SCHEDULER] Triggering auto cart clear at 00:00');
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/worker/clear-carts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('[SCHEDULER] Auto cart clear completed:', result);
        } else {
          console.error('[SCHEDULER] Auto cart clear failed:', await response.text());
        }
      } catch (error) {
        console.error('[SCHEDULER] Error calling auto cart clear:', error);
      }
    }
  }, 60000); // ตรวจสอบทุกๆ 1 นาที
}

export function stopAutoCartClearScheduler() {
  isSchedulerRunning = false;
  console.log('[SCHEDULER] Stopping auto cart clear scheduler');
} 