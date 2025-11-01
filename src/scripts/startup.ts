/**
 * Startup Script
 * รันอัตโนมัติเมื่อ deploy
 */

import migrateConversations from './migrate-conversations';

async function startup() {
  console.log('[Startup] Running startup tasks...');

  try {
    // Run migration
    await migrateConversations();
    
    console.log('[Startup] All tasks completed successfully!');
  } catch (error: any) {
    console.error('[Startup] Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  startup();
}

export default startup;

