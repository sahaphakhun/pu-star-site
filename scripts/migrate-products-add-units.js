const { MongoClient } = require('mongodb');

async function migrateProductUnits() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nextstar';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    const db = client.db();
    const collection = db.collection('products');

    // หาสินค้าที่ยังไม่มี units หรือ units เป็น array ว่าง
    const productsWithoutUnits = await collection.find({
      $or: [
        { units: { $exists: false } },
        { units: null },
        { units: [] }
      ]
    }).toArray();

    console.log(`📦 พบสินค้าที่ต้อง migrate จำนวน ${productsWithoutUnits.length} รายการ`);

    let migratedCount = 0;

    for (const product of productsWithoutUnits) {
      if (product.price && product.price > 0) {
        // สร้างหน่วยเริ่มต้นจากราคาปัจจุบัน
        const defaultUnit = {
          label: 'หน่วย',
          price: product.price,
          multiplier: 1
        };

        await collection.updateOne(
          { _id: product._id },
          { 
            $set: { 
              units: [defaultUnit] 
            } 
          }
        );

        migratedCount++;
        console.log(`✅ Migrate สินค้า: ${product.name} (${product.price} บาท → หน่วย: ${product.price} บาท)`);
      } else {
        console.log(`⚠️  ข้าม: ${product.name} (ไม่มีราคาหรือราคา 0)`);
      }
    }

    console.log(`\n🎉 Migration เสร็จสิ้น!`);
    console.log(`   - สินค้าที่ migrate สำเร็จ: ${migratedCount} รายการ`);
    console.log(`   - สินค้าที่ข้าม: ${productsWithoutUnits.length - migratedCount} รายการ`);

  } catch (error) {
    console.error('❌ Migration ล้มเหลว:', error);
  } finally {
    await client.close();
    console.log('🔐 ปิดการเชื่อมต่อ MongoDB แล้ว');
  }
}

// รันสคริปต์
if (require.main === module) {
  migrateProductUnits().catch(console.error);
}

module.exports = { migrateProductUnits }; 