// Script to seed default categories
const mongoose = require('mongoose');
require('dotenv').config();

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, { 
  timestamps: true 
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const defaultCategories = [
  { name: 'ทั่วไป', description: 'สินค้าทั่วไป', isActive: true, displayOrder: 0 },
  { name: 'กาวและซีลแลนท์', description: 'กาว ซีลแลนท์ และวัสดุยึดติด', isActive: true, displayOrder: 1 },
  { name: 'เครื่องมือ', description: 'เครื่องมือช่างและอุปกรณ์', isActive: true, displayOrder: 2 },
  { name: 'อะไหล่', description: 'อะไหล่และชิ้นส่วน', isActive: true, displayOrder: 3 },
  { name: 'วัสดุก่อสร้าง', description: 'วัสดุก่อสร้างและซ่อมแซม', isActive: true, displayOrder: 4 },
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if categories already exist
    const existingCategories = await Category.find({});
    console.log(`Found ${existingCategories.length} existing categories`);

    if (existingCategories.length === 0) {
      // Insert default categories
      const result = await Category.insertMany(defaultCategories);
      console.log(`✅ Successfully created ${result.length} default categories:`);
      result.forEach(cat => console.log(`  - ${cat.name}`));
    } else {
      console.log('Categories already exist, skipping seed');
      
      // Add missing categories
      for (const defaultCat of defaultCategories) {
        const exists = existingCategories.find(cat => cat.name === defaultCat.name);
        if (!exists) {
          const newCat = await Category.create(defaultCat);
          console.log(`✅ Added missing category: ${newCat.name}`);
        }
      }
    }

    console.log('Category seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding function
seedCategories();