import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}

global.mongoose = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    // อย่า throw ตอน build/import ให้ throw ตอนเรียกใช้งานจริงเท่านั้น
    console.error('[B2B] MONGODB_URI is not defined');
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }
  if (global.mongoose.conn) {
    console.log('[B2B] Using existing MongoDB connection');
    return global.mongoose.conn;
  }

  if (global.mongoose.promise) {
    console.log('[B2B] Waiting for existing MongoDB connection promise');
    return global.mongoose.promise;
  }

  console.log('[B2B] Creating new MongoDB connection');
  
  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true
  };

  global.mongoose.promise = mongoose.connect(MONGODB_URI!, opts);
  
  try {
    global.mongoose.conn = await global.mongoose.promise;
    console.log('[B2B] MongoDB connected successfully');
    
    // ตั้งค่า event listeners
    mongoose.connection.on('connected', () => {
      console.log('[B2B] MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[B2B] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[B2B] MongoDB connection disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[B2B] MongoDB connection closed through app termination');
      process.exit(0);
    });

    return global.mongoose.conn;
  } catch (error) {
    global.mongoose.promise = null;
    console.error('[B2B] MongoDB connection failed:', error);
    throw error;
  }
}

export default connectDB;
