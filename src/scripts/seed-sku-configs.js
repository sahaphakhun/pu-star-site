const mongoose = require('mongoose');
require('dotenv').config();

// เชื่อมต่อฐานข้อมูล
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pu-star-site');

// Schema สำหรับ SKU Config
const skuConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  prefix: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 10,
  },
  format: {
    type: String,
    required: true,
    trim: true,
    default: '{PREFIX}-{COUNTER}',
  },
  counter: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  category: {
    type: String,
    required: false,
    trim: true,
  },
  isActive: {
    type: Boolean,
    required: false,
    default: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { 
  timestamps: true 
});

const SKUConfig = mongoose.model('SKUConfig', skuConfigSchema);

// ข้อมูล SKU Configuration เริ่มต้น
const initialSKUConfigs = [
  {
    name: 'สินค้าทั่วไป',
    prefix: 'GEN',
    format: '{PREFIX}-{COUNTER}',
    counter: 1,
    category: 'ทั่วไป',
    description: 'รูปแบบ SKU สำหรับสินค้าทั่วไป',
    isActive: true,
  },
  {
    name: 'กาวและซีล',
    prefix: 'SIL',
    format: '{PREFIX}-{CATEGORY}-{COUNTER}',
    counter: 1,
    category: 'กาวและซีล',
    description: 'รูปแบบ SKU สำหรับสินค้ากาวและซีล',
    isActive: true,
  },
  {
    name: 'เครื่องมือ',
    prefix: 'TOOL',
    format: '{PREFIX}-{YEAR}-{COUNTER}',
    counter: 1,
    category: 'เครื่องมือ',
    description: 'รูปแบบ SKU สำหรับเครื่องมือ',
    isActive: true,
  },
  {
    name: 'อะไหล่',
    prefix: 'PART',
    format: '{PREFIX}-{MONTH}{DAY}-{COUNTER}',
    counter: 1,
    category: 'อะไหล่',
    description: 'รูปแบบ SKU สำหรับอะไหล่',
    isActive: true,
  },
  {
    name: 'วัสดุก่อสร้าง',
    prefix: 'MAT',
    format: '{PREFIX}-{CATEGORY}-{YEAR}-{COUNTER}',
    counter: 1,
    category: 'วัสดุก่อสร้าง',
    description: 'รูปแบบ SKU สำหรับวัสดุก่อสร้าง',
    isActive: true,
  },
];

async function seedSKUConfigs() {
  try {
    console.log('เริ่มต้นการสร้าง SKU Configuration...');
    
    // ลบข้อมูลเก่าทั้งหมด
    await SKUConfig.deleteMany({});
    console.log('ลบข้อมูล SKU Configuration เก่าแล้ว');
    
    // สร้างข้อมูลใหม่
    const createdConfigs = await SKUConfig.insertMany(initialSKUConfigs);
    console.log(`สร้าง SKU Configuration สำเร็จ ${createdConfigs.length} รายการ`);
    
    // แสดงข้อมูลที่สร้าง
    createdConfigs.forEach(config => {
      console.log(`- ${config.name}: ${config.prefix} (${config.format})`);
    });
    
    console.log('เสร็จสิ้นการสร้าง SKU Configuration');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้าง SKU Configuration:', error);
  } finally {
    mongoose.connection.close();
    console.log('ปิดการเชื่อมต่อฐานข้อมูล');
  }
}

// รันฟังก์ชัน seed
seedSKUConfigs();
