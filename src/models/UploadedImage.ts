import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface UploadedImage {
  _id?: ObjectId;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedBy: string;
  uploadedAt: Date;
  category?: string;
  tags?: string[];
  isPublic?: boolean; // เพิ่มฟิลด์สำหรับควบคุมการเข้าถึง
}

class UploadedImageModel {
  private collectionName = 'uploaded_images';

  async create(imageData: Omit<UploadedImage, '_id'>): Promise<UploadedImage> {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(this.collectionName);

    const result = await collection.insertOne({
      ...imageData,
      uploadedAt: new Date(),
      isPublic: imageData.isPublic ?? true // ตั้งค่า default เป็น true
    });

    return {
      _id: result.insertedId,
      ...imageData
    };
  }

  async findAll(): Promise<UploadedImage[]> {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(this.collectionName);

    return await collection
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray() as UploadedImage[];
  }

  async findPublicImages(): Promise<UploadedImage[]> {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(this.collectionName);

    return await collection
      .find({ isPublic: true })
      .sort({ uploadedAt: -1 })
      .toArray() as UploadedImage[];
  }

  async findById(id: string): Promise<UploadedImage | null> {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(this.collectionName);

    return await collection.findOne({ _id: new ObjectId(id) }) as UploadedImage | null;
  }

  async findByCategory(category: string): Promise<UploadedImage[]> {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(this.collectionName);

    return await collection
      .find({ category })
      .sort({ uploadedAt: -1 })
      .toArray() as UploadedImage[];
  }

  async search(query: string): Promise<UploadedImage[]> {
    const client = await connectDB();
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
  }

  async delete(id: string): Promise<boolean> {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(this.collectionName);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async update(id: string, updateData: Partial<UploadedImage>): Promise<boolean> {
    const client = await connectDB();
    const db = client.db();
    const collection = db.collection(this.collectionName);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  async togglePublicStatus(id: string): Promise<boolean> {
    const client = await connectDB();
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
  }

  async getStats(): Promise<{
    total: number;
    public: number;
    private: number;
    byCategory: Record<string, number>;
    totalSize: number;
  }> {
    const client = await connectDB();
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
    byCategory.forEach(item => {
      categoryStats[item._id || 'uncategorized'] = item.count;
    });

    return {
      total,
      public: publicCount,
      private: privateCount,
      byCategory: categoryStats,
      totalSize: totalSize[0]?.totalSize || 0
    };
  }
}

export default new UploadedImageModel();
