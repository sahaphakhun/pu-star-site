/**
 * Script สำหรับ Debug ปัญหาการแสดงผลสินค้า
 * รัน script นี้เพื่อตรวจสอบสถานะของฐานข้อมูลและสินค้า
 */

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/winrichdynamic';
const DB_NAME = process.env.DB_NAME || 'winrichdynamic';

async function debugProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 เชื่อมต่อฐานข้อมูล...');
    console.log('MongoDB URI:', MONGODB_URI);
    
    await client.connect();
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    
    const db = client.db(DB_NAME);
    console.log('📊 ใช้ฐานข้อมูล:', DB_NAME);
    
    // ตรวจสอบ collections ที่มี
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections ที่มี:', collections.map(c => c.name));
    
    // ตรวจสอบ products collection
    const productsCollection = db.collection('products');
    
    // ตรวจสอบจำนวน products ทั้งหมด
    const totalProducts = await productsCollection.countDocuments();
    console.log('📦 จำนวน products ทั้งหมด:', totalProducts);
    
    if (totalProducts === 0) {
      console.log('⚠️ ไม่มี products ในฐานข้อมูล');
      
      // ตรวจสอบว่า collection มีอยู่หรือไม่
      const collectionExists = await db.listCollections({ name: 'products' }).hasNext();
      if (!collectionExists) {
        console.log('❌ Collection "products" ไม่มีอยู่');
        console.log('🔧 สร้าง collection "products"...');
        
        // สร้าง collection โดยการ insert document เปล่า
        await productsCollection.insertOne({ _id: 'temp', temp: true });
        await productsCollection.deleteOne({ _id: 'temp' });
        console.log('✅ สร้าง collection "products" สำเร็จ');
      }
      
      return;
    }
    
    // ตรวจสอบ products ที่มี
    const products = await productsCollection.find({}).limit(5).toArray();
    console.log('📝 Products ตัวอย่าง (5 รายการแรก):');
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ID: ${product._id}`);
      console.log(`     Name: ${product.name}`);
      console.log(`     SKU: ${product.sku || 'ไม่มี'}`);
      console.log(`     Category: ${product.category}`);
      console.log(`     Created: ${product.createdAt}`);
      console.log('');
    });
    
    // ตรวจสอบ indexes
    console.log('🔍 ตรวจสอบ indexes...');
    const indexes = await productsCollection.indexes();
    console.log('Indexes:', indexes);
    
    // ตรวจสอบ products ที่ไม่มี SKU
    const productsWithoutSku = await productsCollection.countDocuments({
      $or: [
        { sku: { $exists: false } },
        { sku: null },
        { sku: '' }
      ]
    });
    console.log('⚠️ Products ที่ไม่มี SKU:', productsWithoutSku);
    
    // ตรวจสอบ products ที่มี SKU ซ้ำ
    const duplicateSkus = await productsCollection.aggregate([
      {
        $group: {
          _id: '$sku',
          count: { $sum: 1 },
          products: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();
    
    if (duplicateSkus.length > 0) {
      console.log('🚨 พบ SKU ที่ซ้ำ:', duplicateSkus.length, 'รายการ');
      duplicateSkus.forEach(duplicate => {
        console.log(`  SKU: ${duplicate._id} มี ${duplicate.count} รายการ`);
      });
    } else {
      console.log('✅ ไม่มี SKU ที่ซ้ำ');
    }
    
    // ทดสอบการค้นหา products
    console.log('🔍 ทดสอบการค้นหา products...');
    const testQuery = await productsCollection.find({}).limit(1).toArray();
    console.log('ผลการค้นหาทดสอบ:', testQuery.length > 0 ? 'สำเร็จ' : 'ล้มเหลว');
    
    if (testQuery.length > 0) {
      console.log('ตัวอย่าง product:', {
        _id: testQuery[0]._id,
        name: testQuery[0].name,
        sku: testQuery[0].sku,
        category: testQuery[0].category
      });
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 แนะนำ: ตรวจสอบว่า MongoDB server กำลังรันอยู่');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 แนะนำ: ตรวจสอบ username/password ใน MongoDB URI');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 แนะนำ: ตรวจสอบ hostname ใน MongoDB URI');
    }
  } finally {
    await client.close();
    console.log('🔌 ปิดการเชื่อมต่อฐานข้อมูล');
  }
}

// รัน script
if (require.main === module) {
  debugProducts()
    .then(() => {
      console.log('✅ Debug เสร็จสิ้น');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Debug ล้มเหลว:', error);
      process.exit(1);
    });
}

module.exports = { debugProducts };
