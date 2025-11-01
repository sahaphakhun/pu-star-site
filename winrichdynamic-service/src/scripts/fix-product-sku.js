/**
 * Script สำหรับแก้ไขปัญหา Product SKU Duplicate Key Error
 * รัน script นี้เพื่อแก้ไขข้อมูลที่มีอยู่แล้วในฐานข้อมูล
 */

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/winrichdynamic';
const DB_NAME = process.env.DB_NAME || 'winrichdynamic';

async function fixProductSku() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 เชื่อมต่อฐานข้อมูล...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    
    console.log('📊 ตรวจสอบข้อมูล products...');
    
    // ตรวจสอบ products ที่ไม่มี SKU หรือมี SKU เป็น null
    const productsWithoutSku = await productsCollection.find({
      $or: [
        { sku: { $exists: false } },
        { sku: null },
        { sku: '' }
      ]
    }).toArray();
    
    console.log(`📝 พบ products ที่ไม่มี SKU: ${productsWithoutSku.length} รายการ`);
    
    if (productsWithoutSku.length > 0) {
      console.log('🔧 เริ่มแก้ไขข้อมูล...');
      
      for (const product of productsWithoutSku) {
        // สร้าง SKU ใหม่
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        const prefix = 'PRD';
        const separator = '-';
        
        let newSku = `${prefix}${separator}${timestamp}${separator}${randomStr}`.toUpperCase();
        
        // ตรวจสอบว่า SKU ไม่ซ้ำ
        let existingProduct;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          if (attempts > 0) {
            const extraRandom = Math.random().toString(36).substring(2, 6);
            newSku = `${newSku}${separator}${extraRandom}`.toUpperCase();
          }
          
          existingProduct = await productsCollection.findOne({ sku: newSku });
          attempts++;
        } while (existingProduct && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
          console.error(`❌ ไม่สามารถสร้าง SKU ที่ไม่ซ้ำได้สำหรับ product: ${product._id}`);
          continue;
        }
        
        // อัปเดต product ด้วย SKU ใหม่
        const result = await productsCollection.updateOne(
          { _id: product._id },
          { 
            $set: { 
              sku: newSku,
              updatedAt: new Date()
            } 
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✅ แก้ไข product ${product._id} ด้วย SKU: ${newSku}`);
        } else {
          console.log(`⚠️ ไม่สามารถแก้ไข product ${product._id} ได้`);
        }
      }
    }
    
    // ตรวจสอบ products ที่มี SKU ซ้ำ
    console.log('🔍 ตรวจสอบ SKU ที่ซ้ำ...');
    
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
      console.log(`⚠️ พบ SKU ที่ซ้ำ: ${duplicateSkus.length} รายการ`);
      
      for (const duplicate of duplicateSkus) {
        console.log(`SKU: ${duplicate._id} มี ${duplicate.count} รายการ`);
        
        // แก้ไข SKU ที่ซ้ำ (ยกเว้นรายการแรก)
        for (let i = 1; i < duplicate.products.length; i++) {
          const productId = duplicate.products[i];
          const timestamp = Date.now().toString(36);
          const randomStr = Math.random().toString(36).substring(2, 8);
          const newSku = `${duplicate._id}-${timestamp}-${randomStr}`.toUpperCase();
          
          const result = await productsCollection.updateOne(
            { _id: productId },
            { 
              $set: { 
                sku: newSku,
                updatedAt: new Date()
              } 
            }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`✅ แก้ไข duplicate SKU ${productId} เป็น: ${newSku}`);
          }
        }
      }
    }
    
    // สร้าง unique index บน field sku
    console.log('🔐 สร้าง unique index บน field sku...');
    
    try {
      await productsCollection.createIndex({ sku: 1 }, { unique: true });
      console.log('✅ สร้าง unique index สำเร็จ');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Unique index มีอยู่แล้ว');
      } else {
        console.error('❌ ไม่สามารถสร้าง unique index ได้:', error.message);
      }
    }
    
    console.log('🎉 แก้ไขข้อมูลเสร็จสิ้น!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await client.close();
    console.log('🔌 ปิดการเชื่อมต่อฐานข้อมูล');
  }
}

// รัน script
if (require.main === module) {
  fixProductSku()
    .then(() => {
      console.log('✅ Migration เสร็จสิ้น');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration ล้มเหลว:', error);
      process.exit(1);
    });
}

module.exports = { fixProductSku };
