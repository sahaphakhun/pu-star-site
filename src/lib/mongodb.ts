import mongoose from 'mongoose';

// รองรับได้หลายชื่อ เพื่อให้ทำงานได้ทั้งใน Railway, Vercel, Docker ฯลฯ
const MONGODB_URI =
  (process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URL) as string;

// log ใน production ด้วยเพื่อดีบัก Railway
console.log('[DB] Environment variables check:');
console.log('[DB] MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('[DB] MONGO_URL exists:', !!process.env.MONGO_URL);
console.log('[DB] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[DB] MONGODB_URL exists:', !!process.env.MONGODB_URL);
console.log('[DB] NODE_ENV:', process.env.NODE_ENV);

if (MONGODB_URI && process.env.NODE_ENV !== 'production') {
  console.log('[DB] using connection string =', MONGODB_URI.slice(0, 30) + '...');
}

// เพิ่ม fallback สำหรับ development
if (!MONGODB_URI) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DB] No MongoDB URI found, using fallback for development');
    // ใช้ fallback สำหรับ development
    process.env.MONGODB_URI = 'mongodb://localhost:27017/winrich-site-dev';
  } else {
    console.error('[DB] No MongoDB URI found in production environment');
    throw new Error(
      'กรุณากำหนดค่า MONGODB_URI, MONGO_URL, DATABASE_URL หรือ MONGODB_URL ในตัวแปรสภาพแวดล้อม Railway'
    );
  }
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
  try {
    if (cached.conn) {
      console.log('[DB] Using cached connection');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 30000, // 30 วินาที หากหาเซิร์ฟเวอร์ไม่เจอจะ throw เร็วขึ้น
        maxPoolSize: 10, // เพิ่ม connection pool size
        minPoolSize: 1,
        maxIdleTimeMS: 30000, // ปิด connection ที่ไม่ได้ใช้หลังจาก 30 วินาที
      };

      console.log('[DB] Creating new connection...');
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('[DB] Connection established successfully');
        return mongoose;
      });
    }
    
    const instance = await cached.promise;
    cached.conn = instance.connection;
    
    // เพิ่ม event listeners สำหรับ connection
    cached.conn.on('error', (err) => {
      console.error('[DB] Connection error:', err);
      cached.conn = null;
      cached.promise = null;
    });

    cached.conn.on('disconnected', () => {
      console.log('[DB] Connection disconnected');
      cached.conn = null;
      cached.promise = null;
    });

    cached.conn.on('connected', () => {
      console.log('[DB] Connection connected');
    });
    
    return cached.conn;
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    // รีเซ็ต cache เมื่อเกิดข้อผิดพลาด
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

export default connectDB;

// Export function สำหรับใช้ใน API routes
export async function connectToDatabase() {
  try {
    const connection = await connectDB();
    return connection;
  } catch (error) {
    console.error('[DB] Failed to connect to database:', error);
    throw error;
  }
}