import mongoose from 'mongoose';

// รองรับได้หลายชื่อ เพื่อให้ทำงานได้ทั้งใน Railway, Vercel, Docker ฯลฯ
const MONGODB_URI =
  (process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URL) as string;

// log เฉพาะใน dev เพื่อดีบัก
if (process.env.NODE_ENV !== 'production') {
  console.log('[DB] using connection string =', MONGODB_URI ? MONGODB_URI.slice(0, 30) + '...' : undefined);
}

if (!MONGODB_URI) {
  throw new Error(
    'กรุณากำหนดค่า MONGODB_URI ในไฟล์ .env หรือในตัวแปรสภาพแวดล้อม'
  );
}

// กำหนดรูปแบบ interface สำหรับค่า cached
interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Mongoose> | null;
}

// กำหนด global namespace
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // 30 วินาที หากหาเซิร์ฟเวอร์ไม่เจอจะ throw เร็วขึ้น
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  const instance = await cached.promise;
  cached.conn = instance.connection;
  
  return cached.conn;
}

export default connectDB;