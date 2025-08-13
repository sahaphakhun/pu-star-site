const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

async function migrateAutoMode() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // อัปเดต Session collection
    console.log('Migrating Session collection...');
    const sessionResult = await db.collection('sessions').updateMany(
      { nonMenuMessageCount: { $exists: false } },
      { 
        $set: { 
          nonMenuMessageCount: 0,
          lastMessageTime: new Date()
        } 
      }
    );
    console.log(`Updated ${sessionResult.modifiedCount} sessions`);
    
    // อัปเดต MessengerUser collection
    console.log('Migrating MessengerUser collection...');
    const userResult = await db.collection('messengerusers').updateMany(
      { aiEnabled: { $exists: false } },
      { 
        $set: { 
          aiEnabled: false,
          autoModeEnabled: false,
          conversationHistory: []
        } 
      }
    );
    console.log(`Updated ${userResult.modifiedCount} messenger users`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// รัน migration
migrateAutoMode().catch(console.error);
