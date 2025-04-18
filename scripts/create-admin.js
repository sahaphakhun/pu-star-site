// สคริปต์สำหรับสร้างผู้ดูแลระบบ (admin) ในฐานข้อมูล MongoDB
// เราสร้างไฟล์นี้เพื่อใช้ในการสร้าง admin เท่านั้น ไม่ได้ใช้ในการรันจริง

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// เชื่อมต่อกับ MongoDB
const MONGODB_URI = "mongodb+srv://sahaphakhun:lbggF9cT2PvFVtGT@cluster0.tpwmxkz.mongodb.net/pu-star-db?retryWrites=true&w=majority&appName=Cluster0";

// สร้าง Schema ผู้ใช้ (เหมือนกับใน User.ts แต่ตัดบางส่วนให้เหลือแค่ที่จำเป็น)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อผู้ใช้'],
    },
    email: {
      type: String,
      required: [true, 'กรุณาระบุอีเมล'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'กรุณาตั้งรหัสผ่าน'],
      minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// สร้างโมเดล
const User = mongoose.model('User', userSchema);

// ฟังก์ชันสำหรับสร้างผู้ดูแลระบบ
async function createAdmin() {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    await mongoose.connect(MONGODB_URI);
    console.log('เชื่อมต่อกับ MongoDB สำเร็จ');

    // ข้อมูลผู้ดูแลระบบ
    const adminData = {
      name: 'Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123456', 10), // เข้ารหัสรหัสผ่าน
      role: 'admin',
    };

    // ตรวจสอบว่ามีผู้ดูแลระบบนี้อยู่แล้วหรือไม่
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('ผู้ดูแลระบบมีอยู่แล้ว:', existingAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // สร้างผู้ดูแลระบบใหม่
    const admin = await User.create(adminData);
    console.log('สร้างผู้ดูแลระบบสำเร็จ:', admin);

    // ยกเลิกการเชื่อมต่อ
    await mongoose.disconnect();
    console.log('ยกเลิกการเชื่อมต่อ MongoDB');
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    await mongoose.disconnect();
  }
}

// เรียกใช้ฟังก์ชัน
createAdmin(); 