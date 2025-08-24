const { MongoClient } = require('mongodb');
require('dotenv').config();

async function updateCustomerStats() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');
    
    // ดึงลูกค้าทั้งหมด
    const customers = await usersCollection.find({ role: 'user' }).toArray();
    console.log(`Found ${customers.length} customers to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const customer of customers) {
      try {
        // ดึงออเดอร์ของลูกค้าที่มีสถานะเสร็จสิ้นแล้ว
        const orders = await ordersCollection.find({ 
          userId: customer._id,
          status: { $in: ['delivered', 'confirmed', 'shipped'] }
        }).sort({ createdAt: 1 }).toArray();
        
        if (orders.length === 0) {
          // หากไม่มีออเดอร์ ให้รีเซ็ตสถิติ
          await usersCollection.updateOne(
            { _id: customer._id },
            {
              $set: {
                totalOrders: 0,
                totalSpent: 0,
                averageOrderValue: 0,
                lastOrderDate: null,
                customerType: 'new'
              }
            }
          );
          console.log(`Reset stats for customer ${customer.phoneNumber || customer._id}`);
        } else {
          // คำนวณสถิติใหม่
          const totalOrders = orders.length;
          const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          const averageOrderValue = totalSpent / totalOrders;
          
          // หาวันที่สั่งซื้อล่าสุด
          const lastOrderDate = orders.reduce((latest, order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate > latest ? orderDate : latest;
          }, new Date(0));
          
          // คำนวณจำนวนวันนับจากออเดอร์ล่าสุด
          const daysSinceLastOrder = Math.floor(
            (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // จัดประเภทลูกค้า
          let customerType = 'new';
          if (daysSinceLastOrder > 90) {
            customerType = 'inactive';
          } else if (totalOrders > 2 && totalSpent > 20000) {
            customerType = 'target';
          } else if (totalOrders > 2 || totalSpent > 5000) {
            customerType = 'regular';
          }
          
          // อัปเดตข้อมูลลูกค้า
          await usersCollection.updateOne(
            { _id: customer._id },
            {
              $set: {
                customerType,
                totalOrders,
                totalSpent,
                averageOrderValue,
                lastOrderDate,
              }
            }
          );
          
          console.log(`Updated customer ${customer.phoneNumber || customer._id}: ${totalOrders} orders, ฿${totalSpent.toLocaleString()}, ${customerType}`);
        }
        
        updatedCount++;
        
        // แสดงความคืบหน้าทุก 100 รายการ
        if (updatedCount % 100 === 0) {
          console.log(`Progress: ${updatedCount}/${customers.length} customers updated...`);
        }
        
      } catch (error) {
        console.error(`Failed to update customer ${customer._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nCustomer stats update completed!`);
    console.log(`Total customers: ${customers.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Failed: ${errorCount}`);
    
    // แสดงสถิติสรุป
    const stats = await usersCollection.aggregate([
      { $match: { role: 'user' } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          newCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'new'] }, 1, 0] } },
          regularCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'regular'] }, 1, 0] } },
          targetCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'target'] }, 1, 0] } },
          inactiveCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'inactive'] }, 1, 0] } },
          totalRevenue: { $sum: { $ifNull: ['$totalSpent', 0] } },
          totalOrders: { $sum: { $ifNull: ['$totalOrders', 0] } }
        }
      }
    ]).toArray();
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`\nCustomer Statistics:`);
      console.log(`New customers: ${stat.newCustomers}`);
      console.log(`Regular customers: ${stat.regularCustomers}`);
      console.log(`Target customers: ${stat.targetCustomers}`);
      console.log(`Inactive customers: ${stat.inactiveCustomers}`);
      console.log(`Total revenue: ฿${stat.totalRevenue.toLocaleString()}`);
      console.log(`Total orders: ${stat.totalOrders}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// รันสคริปต์
updateCustomerStats().catch(console.error);
