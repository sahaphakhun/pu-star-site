import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import "dotenv/config";

// สร้าง admin คนแรกสำหรับระบบ
// รันด้วยคำสั่ง: npx ts-node -r tsconfig-paths/register src/scripts/create-first-admin.ts
async function createFirstAdmin() {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    await connectToDB();
    
    // ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    const existingAdmin = await User.findOne({ role: "admin" });
    
    if (existingAdmin) {
      console.log("มี admin อยู่ในระบบแล้ว");
      process.exit(0);
    }
    
    // ข้อมูล admin คนแรก - ควรเปลี่ยนในการใช้งานจริง
    const username = "admin";
    const email = "admin@pustar.com";
    const password = "admin123456";
    
    // ตรวจสอบว่ามีชื่อผู้ใช้หรืออีเมลซ้ำหรือไม่
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    
    if (existingUser) {
      console.log("ชื่อผู้ใช้หรืออีเมลซ้ำกับผู้ใช้ที่มีอยู่ในระบบแล้ว");
      process.exit(1);
    }
    
    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // สร้างผู้ใช้ admin ใหม่
    const newAdmin = new User({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });
    
    await newAdmin.save();
    
    console.log("สร้าง admin คนแรกสำเร็จ");
    console.log(`ชื่อผู้ใช้: ${username}`);
    console.log(`รหัสผ่าน: ${password}`);
    console.log("กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก");
    
    process.exit(0);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้าง admin:", error);
    process.exit(1);
  }
}

createFirstAdmin(); 