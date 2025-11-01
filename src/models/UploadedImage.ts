import { MongoClient, ObjectId } from 'mongodb';

export interface UploadedImage {
  _id?: ObjectId;
  publicId: string;        // Cloudinary public ID
  filename: string;        // ชื่อไฟล์เดิม
  originalName: string;    // ชื่อไฟล์เดิม
  url: string;            // Cloudinary URL
  secureUrl: string;      // Cloudinary secure URL
  size: number;           // ขนาดไฟล์ (bytes)
  mimetype: string;       // ประเภทไฟล์
  width: number;          // ความกว้างรูปภาพ
  height: number;         // ความสูงรูปภาพ
  format: string;         // รูปแบบไฟล์ (jpg, png, etc.)
  uploadedBy: string;     // ผู้อัพโหลด
  uploadedAt: Date;       // วันที่อัพโหลด
  category?: string;      // หมวดหมู่
  tags?: string[];        // แท็ก
  isPublic?: boolean;     // สถานะ public/private
  cloudinaryData?: any;   // ข้อมูลเพิ่มเติมจาก Cloudinary
}

class UploadedImageModel {
  private collectionName = 'uploaded_images';

  private async getClient(): Promise<MongoClient> {
    const MONGODB_URI = process.env.MONGODB_URI || 
                        process.env.MONGO_URL || 
                        process.env.DATABASE_URL || 
                        process.env.MONGODB_URL;
    
    if (!MONGODB_URI) {
      throw new Error('MongoDB connection string not found');
    }

    return new MongoClient(MONGODB_URI);
  }

  async create(imageData: Omit<UploadedImage, '_id'>): Promise<UploadedImage> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const result = await collection.insertOne({
        ...imageData,
        uploadedAt: new Date(),
        isPublic: imageData.isPublic ?? true
      });

      return {
        _id: result.insertedId,
        ...imageData
      };
    } finally {
      await client.close();
    }
  }

  async findAll(): Promise<UploadedImage[]> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      return await collection
        .find({})
        .sort({ uploadedAt: -1 })
        .toArray() as UploadedImage[];
    } finally {
      await client.close();
    }
  }

  async findPublicImages(): Promise<UploadedImage[]> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      return await collection
        .find({ isPublic: true })
        .sort({ uploadedAt: -1 })
        .toArray() as UploadedImage[];
    } finally {
      await client.close();
    }
  }

  async findById(id: string): Promise<UploadedImage | null> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      return await collection.findOne({ _id: new ObjectId(id) }) as UploadedImage | null;
    } finally {
      await client.close();
    }
  }

  async findByCategory(category: string): Promise<UploadedImage[]> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      return await collection
        .find({ category })
        .sort({ uploadedAt: -1 })
        .toArray() as UploadedImage[];
    } finally {
      await client.close();
    }
  }

  async search(query: string): Promise<UploadedImage[]> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const regex = new RegExp(query, 'i');
      return await collection
        .find({
          $or: [
            { originalName: regex },
            { category: regex },
            { tags: regex }
          ]
        })
        .sort({ uploadedAt: -1 })
        .toArray() as UploadedImage[];
    } finally {
      await client.close();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } finally {
      await client.close();
    }
  }

  async update(id: string, updateData: Partial<UploadedImage>): Promise<boolean> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return result.modifiedCount > 0;
    } finally {
      await client.close();
    }
  }

  async togglePublicStatus(id: string): Promise<boolean> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      // ดึงข้อมูลปัจจุบัน
      const image = await collection.findOne({ _id: new ObjectId(id) });
      if (!image) return false;

      // สลับสถานะ
      const newStatus = !image.isPublic;
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isPublic: newStatus } }
      );

      return result.modifiedCount > 0;
    } finally {
      await client.close();
    }
  }

  async getStats(): Promise<{
    total: number;
    public: number;
    private: number;
    byCategory: Record<string, number>;
    totalSize: number;
  }> {
    const client = await this.getClient();
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const total = await collection.countDocuments();
      const publicCount = await collection.countDocuments({ isPublic: true });
      const privateCount = await collection.countDocuments({ isPublic: false });
      
      const byCategory = await collection.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const totalSize = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' }
          }
        }
      ]).toArray();

      const categoryStats: Record<string, number> = {};
      byCategory.forEach((item: any) => {
        categoryStats[item._id || 'uncategorized'] = item.count;
      });

      return {
        total,
        public: publicCount,
        private: privateCount,
        byCategory: categoryStats,
        totalSize: totalSize[0]?.totalSize || 0
      };
    } finally {
      await client.close();
    }
  }
}

export default new UploadedImageModel();
