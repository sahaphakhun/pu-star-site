import mongoose from 'mongoose';

// จัดเก็บการเชื่อมต่อเพื่อไม่ให้ต้องเชื่อมต่อใหม่ทุกครั้ง
const globalWithMongoose = global as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * ฟังก์ชันสำหรับเชื่อมต่อกับฐานข้อมูล MongoDB
 */
export default async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('โปรดกำหนดค่า MONGODB_URI ในไฟล์ .env');
  }

  // หากมีการเชื่อมต่ออยู่แล้ว ให้ใช้การเชื่อมต่อนั้น
  if (globalWithMongoose.mongoose?.conn) {
    return globalWithMongoose.mongoose.conn;
  }

  // หากกำลังเชื่อมต่ออยู่ ให้รอจนกว่าการเชื่อมต่อจะเสร็จสิ้น
  if (!globalWithMongoose.mongoose?.promise) {
    const opts = {
      bufferCommands: false,
    };

    globalWithMongoose.mongoose.promise = mongoose.connect(process.env.MONGODB_URI, opts);
  }

  try {
    globalWithMongoose.mongoose.conn = await globalWithMongoose.mongoose.promise;
  } catch (e) {
    globalWithMongoose.mongoose.promise = null;
    throw e;
  }

  return globalWithMongoose.mongoose.conn;
} 