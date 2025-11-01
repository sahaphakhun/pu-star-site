/**
 * Migration Script: MessengerUser.conversationHistory → MessengerConversation
 * 
 * รันอัตโนมัติเมื่อ deploy หรือรันด้วยตัวเองผ่าน:
 * npx tsx src/scripts/migrate-conversations.ts
 */

import mongoose from 'mongoose';
import MessengerUser from '@/models/MessengerUser';
import MessengerConversation from '@/models/MessengerConversation';

async function migrateConversations() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.log('[Migration] MONGODB_URI is not defined. Skipping migration (this is normal during build).');
      return;
    }

    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Migration] Connected!');

    // ตรวจสอบว่ามี conversation ใน MessengerConversation แล้วหรือยัง
    const existingCount = await MessengerConversation.countDocuments();
    if (existingCount > 0) {
      console.log(
        `[Migration] Found ${existingCount} existing conversations. Skipping migration.`
      );
      await mongoose.disconnect();
      return;
    }

    // ดึง users ที่มี conversationHistory
    const users = await MessengerUser.find({
      conversationHistory: { $exists: true, $ne: [] },
    });

    console.log(
      `[Migration] Found ${users.length} users with conversation history`
    );

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // สร้าง Conversation ใหม่
        await MessengerConversation.create({
          psid: user.psid,
          userId: user.userId,
          messages: user.conversationHistory.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            isAutoReply: false, // default
          })),
          isActive: true,
          lastMessageAt:
            user.conversationHistory[user.conversationHistory.length - 1]
              ?.timestamp || new Date(),
          messageCount: user.conversationHistory.length,
        });

        migratedCount++;
        console.log(`[Migration] ✅ Migrated PSID: ${user.psid}`);
      } catch (error: any) {
        errorCount++;
        console.error(
          `[Migration] ❌ Failed to migrate PSID: ${user.psid}`,
          error.message
        );
      }
    }

    console.log('[Migration] Completed!');
    console.log(`[Migration] ✅ Migrated: ${migratedCount}`);
    console.log(`[Migration] ❌ Errors: ${errorCount}`);

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('[Migration] Fatal error:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateConversations();
}

export default migrateConversations;

