const { connectDB } = require('../src/lib/mongodb');
const { migrateAllUserNamesFromOrders } = require('../src/utils/userNameSync');

async function fixCustomerNames() {
  try {
    await connectDB();
    console.log('เริ่มแก้ไขชื่อลูกค้า...');
    
    const result = await migrateAllUserNamesFromOrders();
    console.log(`แก้ไขสำเร็จ: ${result.updated} จาก ${result.total} คน`);
    
    process.exit(0);
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    process.exit(1);
  }
}

fixCustomerNames();
