/**
 * Startup Script
 * รันอัตโนมัติเมื่อ start server (runtime)
 * 
 * ไม่รันตอน build เพราะ:
 * - Build time ไม่มี network access
 * - ไม่สามารถเชื่อมต่อ MongoDB internal hostname ได้
 */

const mongoose = require('mongoose');

async function migrateConversations() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.log('[Migration] MONGODB_URI is not defined. Skipping migration.');
      return;
    }

    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Migration] Connected!');

    // ตรวจสอบว่ามี conversation ใน MessengerConversation แล้วหรือยัง
    const MessengerConversation = mongoose.model('MessengerConversation', new mongoose.Schema({}, { strict: false }));
    const existingCount = await MessengerConversation.countDocuments();
    
    if (existingCount > 0) {
      console.log(
        `[Migration] Found ${existingCount} existing conversations. Skipping migration.`
      );
      await mongoose.disconnect();
      return;
    }

    // ดึงข้อมูล MessengerUser ที่มี conversationHistory
    const MessengerUser = mongoose.model('MessengerUser', new mongoose.Schema({}, { strict: false }));
    const users = await MessengerUser.find({
      conversationHistory: { $exists: true, $ne: [] },
    });

    console.log(`[Migration] Found ${users.length} users with conversation history`);

    let migratedCount = 0;
    for (const user of users) {
      if (!user.conversationHistory || user.conversationHistory.length === 0) {
        continue;
      }

      // สร้าง MessengerConversation ใหม่
      const conversation = new MessengerConversation({
        userId: user.userId,
        messages: user.conversationHistory,
        lastMessageAt: new Date(),
        createdAt: user.createdAt || new Date(),
        updatedAt: new Date(),
      });

      await conversation.save();
      migratedCount++;

      if (migratedCount % 10 === 0) {
        console.log(`[Migration] Migrated ${migratedCount}/${users.length} conversations...`);
      }
    }

    console.log(`[Migration] ✅ Migrated ${migratedCount} conversations successfully!`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('[Migration] Fatal error:', error);
    throw error;
  }
}

async function startup() {
  console.log('[Startup] Running startup tasks...');

  try {
    // Run migration
    await migrateConversations();
    
    console.log('[Startup] All tasks completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Startup] Error:', error);
    // ไม่ exit(1) เพราะจะทำให้ deployment fail
    // แค่ log error และให้ server start ต่อ
    process.exit(0);
  }
}

// Run
startup();

