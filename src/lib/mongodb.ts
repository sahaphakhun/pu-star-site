import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('กรุณาระบุ MONGODB_URI ใน .env.local file');
}

// โครงสร้างสำหรับ cached connection
interface MongooseConnection {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// ตัวแปร global สำหรับเก็บการเชื่อมต่อ
const globalWithMongoose = global as typeof globalThis & {
  mongoose: MongooseConnection;
};

// ใช้ cached connection หรือสร้างใหม่
const cached: MongooseConnection = globalWithMongoose.mongoose || {
  conn: null,
  promise: null,
};

// สร้าง cache บน global object ถ้ายังไม่มี
if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

async function connectDB(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => mongoose.connection);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB; 