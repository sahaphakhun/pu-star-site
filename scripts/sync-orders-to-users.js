const { MongoClient } = require('mongodb');
require('dotenv').config();

async function syncOrdersToUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');
    
    // ดึงผู้ใช้ทั้งหมด
    const users = await usersCollection.find({ role: 'user' }).select('_id phoneNumber').toArray();
    console.log(`Found ${users.length} users to sync orders`);
    
    let totalSynced = 0;
    let totalDuplicates = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        console.log(`\nProcessing user: ${user.phoneNumber}`);
        
        // สร้างรูปแบบเบอร์โทรที่ตรงกัน (รองรับทั้ง +66 และ 0)
        const phonePatterns = [];
        
        // หากเบอร์เริ่มต้นด้วย +66
        if (user.phoneNumber.startsWith('+66')) {
          const numberWithoutPrefix = user.phoneNumber.substring(3);
          phonePatterns.push(
            user.phoneNumber, // +66xxxxxxxxx
            `0${numberWithoutPrefix}` // 0xxxxxxxxx
          );
        }
        // หากเบอร์เริ่มต้นด้วย 0
        else if (user.phoneNumber.startsWith('0')) {
          const numberWithoutPrefix = user.phoneNumber.substring(1);
          phonePatterns.push(
            user.phoneNumber, // 0xxxxxxxxx
            `+66${numberWithoutPrefix}` // +66xxxxxxxxx
          );
        }
        // หากเบอร์เริ่มต้นด้วย 66
        else if (user.phoneNumber.startsWith('66')) {
          const numberWithoutPrefix = user.phoneNumber.substring(2);
          phonePatterns.push(
            `+${user.phoneNumber}`, // +66xxxxxxxxx
            `0${numberWithoutPrefix}` // 0xxxxxxxxx
          );
        }
        
        console.log(`Phone patterns:`, phonePatterns);
        
        // ดึงออเดอร์ที่มีเบอร์ตรงกันและยังไม่มี userId
        const ordersToSync = await ordersCollection.find({
          customerPhone: { $in: phonePatterns },
          userId: { $exists: false } // ออเดอร์ที่ยังไม่มี userId
        }).sort({ createdAt: 1 }).toArray();
        
        console.log(`Found ${ordersToSync.length} orders to sync`);
        
        if (ordersToSync.length === 0) {
          console.log('No orders to sync for this user');
          continue;
        }
        
        // ตรวจสอบออเดอร์ซ้ำโดยใช้ข้อมูลเฉพาะ
        const syncedOrderKeys = new Set();
        let syncedCount = 0;
        let duplicateCount = 0;
        
        for (const order of ordersToSync) {
          try {
            // สร้าง unique key สำหรับตรวจสอบออเดอร์ซ้ำ
            const orderKey = `${order.customerPhone}_${order.totalAmount}_${new Date(order.createdAt).toISOString().split('T')[0]}`;
            
            if (syncedOrderKeys.has(orderKey)) {
              console.log(`Skipping duplicate order: ${order._id} (${orderKey})`);
              duplicateCount++;
              continue;
            }
            
            // อัปเดตออเดอร์ให้มี userId
            await ordersCollection.updateOne(
              { _id: order._id },
              {
                $set: {
                  userId: user._id,
                  // อัปเดตข้อมูลลูกค้าให้ตรงกับข้อมูลในระบบ
                  customerName: order.customerName || 'ลูกค้า'
                }
              }
            );
            
            syncedOrderKeys.add(orderKey);
            syncedCount++;
            
            console.log(`Synced order ${order._id} to user ${user._id}`);
            
          } catch (error) {
            console.error(`Failed to sync order ${order._id}:`, error);
          }
        }
        
        totalSynced += syncedCount;
        totalDuplicates += duplicateCount;
        
        console.log(`User ${user.phoneNumber}: synced ${syncedCount} orders, skipped ${duplicateCount} duplicates`);
        
        // แสดงความคืบหน้าทุก 50 รายการ
        if ((totalSynced + totalDuplicates) % 50 === 0) {
          console.log(`Progress: ${totalSynced + totalDuplicates} orders processed...`);
        }
        
      } catch (error) {
        console.error(`Failed to process user ${user._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nOrder sync completed!`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successfully synced: ${totalSynced} orders`);
    console.log(`Duplicates skipped: ${totalDuplicates} orders`);
    console.log(`Errors: ${errorCount}`);
    
    // แสดงสถิติสรุป
    const stats = await usersCollection.aggregate([
      { $match: { role: 'user' } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'userOrders'
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          customersWithOrders: { $sum: { $cond: [{ $gt: [{ $size: '$userOrders' }, 0] }, 1, 0] } },
          totalOrders: { $sum: { $size: '$userOrders' } },
          totalRevenue: { $sum: { $reduce: { input: '$userOrders', initialValue: 0, in: { $add: ['$$value', { $ifNull: ['$$this.totalAmount', 0] }] } } } }
        }
      }
    ]).toArray();
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`\nCustomer Statistics after sync:`);
      console.log(`Total customers: ${stat.totalCustomers}`);
      console.log(`Customers with orders: ${stat.customersWithOrders}`);
      console.log(`Total orders: ${stat.totalOrders}`);
      console.log(`Total revenue: ฿${stat.totalRevenue.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// รันสคริปต์
syncOrdersToUsers().catch(console.error);
