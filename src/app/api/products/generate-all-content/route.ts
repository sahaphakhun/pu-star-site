import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

// GET: สร้างข้อความสินค้าทั้งหมดในรูปแบบ Markdown และ JSON
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'both'; // 'markdown', 'json', 'both'
    const category = searchParams.get('category'); // กรองตามหมวดหมู่
    const includeInactive = searchParams.get('includeInactive') === 'true'; // รวมสินค้าที่ไม่เปิดใช้งาน
    
    await connectDB();
    
    // สร้าง query สำหรับดึงสินค้า
    let query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (!includeInactive) {
      query.isAvailable = { $ne: false };
    }
    
    const products = await Product.find(query).sort({ category: 1, name: 1 }).lean();
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    // สร้างข้อมูลสินค้าทั้งหมด
    const allProductsContent = generateAllProductsContent(products);

    // ส่งข้อมูลตามรูปแบบที่ต้องการ
    if (format === 'markdown') {
      return new NextResponse(allProductsContent.markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="all-products-content.md"`
        }
      });
    } else if (format === 'json') {
      return NextResponse.json(allProductsContent.json, {
        headers: {
          'Content-Disposition': `attachment; filename="all-products-content.json"`
        }
      });
    } else {
      // ส่งทั้งสองรูปแบบ
      return NextResponse.json(allProductsContent);
    }
  } catch (error) {
    console.error('Error generating all products content:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างข้อความสินค้าทั้งหมด' }, { status: 500 });
  }
}

// ฟังก์ชันสร้างข้อความสินค้าทั้งหมด
function generateAllProductsContent(products: any[]) {
  // สร้าง Markdown content
  const markdown = generateAllProductsMarkdown(products);
  
  // สร้าง JSON content
  const json = generateAllProductsJSON(products);

  return { markdown, json };
}

// สร้าง Markdown content สำหรับสินค้าทั้งหมด
function generateAllProductsMarkdown(products: any[]) {
  let markdown = `# รายการสินค้าทั้งหมด\n\n`;
  markdown += `**วันที่สร้าง**: ${new Date().toLocaleDateString('th-TH')}\n`;
  markdown += `**เวลาที่สร้าง**: ${new Date().toLocaleTimeString('th-TH')}\n`;
  markdown += `**จำนวนสินค้าทั้งหมด**: ${products.length}\n\n`;
  
  // จัดกลุ่มสินค้าตามหมวดหมู่
  const productsByCategory = products.reduce((acc: any, product) => {
    const category = product.category || 'ทั่วไป';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  // แสดงสินค้าแต่ละหมวดหมู่
  Object.keys(productsByCategory).sort().forEach(category => {
    const categoryProducts = productsByCategory[category];
    
    markdown += `## 📁 ${category}\n`;
    markdown += `**จำนวนสินค้า**: ${categoryProducts.length}\n\n`;
    
    categoryProducts.forEach((product: any, index: number) => {
      markdown += `### ${index + 1}. ${product.name}\n`;
      markdown += `- **สถานะ**: ${product.isAvailable !== false ? '✅ พร้อมขาย' : '❌ สินค้าหมด'}\n`;
      markdown += `- **รายละเอียด**: ${product.description}\n`;
      
      if (product.price !== undefined) {
        markdown += `- **ราคาเริ่มต้น**: ฿${product.price.toLocaleString()}\n`;
      }
      
      if (product.units && product.units.length > 0) {
        markdown += `- **หน่วยสินค้า**: ${product.units.length} หน่วย\n`;
      }
      
      if (product.options && product.options.length > 0) {
        markdown += `- **ตัวเลือก**: ${product.options.length} ประเภท\n`;
      }
      
      // SKU Information
      if (product.skuConfig) {
        markdown += `- **SKU**: ${product.skuConfig.autoGenerate ? 'สร้างอัตโนมัติ' : 'กำหนดเอง'}\n`;
        if (product.skuVariants && product.skuVariants.length > 0) {
          markdown += `- **SKU Variants**: ${product.skuVariants.length} รายการ\n`;
        }
      } else {
        markdown += `- **SKU**: ไม่มี\n`;
      }
      
      markdown += `\n`;
    });
  });

  // สรุปข้อมูล SKU
  markdown += `## 📊 สรุปข้อมูล SKU\n`;
  const skuStats = getSkuStatistics(products);
  markdown += `- **สินค้าที่มี SKU**: ${skuStats.productsWithSku}\n`;
  markdown += `- **สินค้าที่ไม่มี SKU**: ${skuStats.productsWithoutSku}\n`;
  markdown += `- **SKU Variants ทั้งหมด**: ${skuStats.totalSkuVariants}\n`;
  markdown += `- **SKU ที่เปิดใช้งาน**: ${skuStats.activeSkuVariants}\n`;
  markdown += `- **SKU ที่ปิดใช้งาน**: ${skuStats.inactiveSkuVariants}\n\n`;

  // คำแนะนำสำหรับ AI
  markdown += `## 🤖 คำแนะนำสำหรับ AI\n`;
  markdown += `\`\`\`\n`;
  markdown += `INSTRUCTION: ใช้ข้อมูลสินค้าทั้งหมดนี้เพื่อสร้างเนื้อหาโฆษณา, คำอธิบาย, หรือข้อมูลทางการค้า\n`;
  markdown += `\n`;
  markdown += `PRODUCTS DATA:\n`;
  markdown += `- Total Products: ${products.length}\n`;
  markdown += `- Categories: ${Object.keys(productsByCategory).join(', ')}\n`;
  markdown += `- Products with SKU: ${skuStats.productsWithSku}\n`;
  markdown += `- Total SKU Variants: ${skuStats.totalSkuVariants}\n`;
  markdown += `\n`;
  markdown += `REQUIREMENTS:\n`;
  markdown += `1. ใช้ชื่อสินค้าและรายละเอียดที่ให้มา\n`;
  markdown += `2. ระบุ SKU ที่เกี่ยวข้องหากจำเป็น\n`;
  markdown += `3. เน้นคุณสมบัติและประโยชน์ของสินค้า\n`;
  markdown += `4. ใช้ภาษาที่เหมาะสมกับกลุ่มเป้าหมาย\n`;
  markdown += `5. รวมข้อมูลการติดต่อหรือสั่งซื้อหากจำเป็น\n`;
  markdown += `6. จัดกลุ่มสินค้าตามหมวดหมู่\n`;
  markdown += `7. สร้างเนื้อหาที่ครอบคลุมสินค้าทั้งหมด\n`;
  markdown += `\`\`\`\n\n`;
  
  // ข้อมูลเพิ่มเติม
  markdown += `## 📋 ข้อมูลเพิ่มเติม\n`;
  markdown += `- **รูปแบบไฟล์**: Markdown\n`;
  markdown += `- **วัตถุประสงค์**: สำหรับ AI Content Generation\n`;
  markdown += `- **การใช้งาน**: สามารถใช้กับ AI tools ต่างๆ เพื่อสร้างเนื้อหาโฆษณา\n`;
  markdown += `- **การอัปเดต**: ข้อมูลจะอัปเดตตามข้อมูลในฐานข้อมูล\n`;
  
  return markdown;
}

// สร้าง JSON content สำหรับสินค้าทั้งหมด
function generateAllProductsJSON(products: any[]) {
  const skuStats = getSkuStatistics(products);
  
  const jsonContent = {
    summary: {
      totalProducts: products.length,
      generatedAt: new Date().toISOString(),
      format: "JSON",
      version: "1.0",
      purpose: "AI Content Generation for All Products"
    },
    categories: Object.keys(products.reduce((acc: any, product) => {
      const category = product.category || 'ทั่วไป';
      acc[category] = true;
      return acc;
    }, {})),
    skuStatistics: skuStats,
    products: products.map(product => ({
      id: product._id,
      name: product.name,
      description: product.description,
      category: product.category || 'ทั่วไป',
      isAvailable: product.isAvailable !== false,
      price: product.price !== undefined ? product.price : null,
      units: product.units || [],
      options: product.options || [],
      skuConfig: product.skuConfig || null,
      skuVariants: product.skuVariants || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    })),
    aiInstructions: {
      purpose: "AI Content Generation for All Products Marketing",
      requirements: [
        "ใช้ชื่อสินค้าและรายละเอียดที่ให้มา",
        "ระบุ SKU ที่เกี่ยวข้องหากจำเป็น",
        "เน้นคุณสมบัติและประโยชน์ของสินค้า",
        "ใช้ภาษาที่เหมาะสมกับกลุ่มเป้าหมาย",
        "รวมข้อมูลการติดต่อหรือสั่งซื้อหากจำเป็น",
        "จัดกลุ่มสินค้าตามหมวดหมู่",
        "สร้างเนื้อหาที่ครอบคลุมสินค้าทั้งหมด"
      ],
      contentTypes: [
        "แคตตาล็อกสินค้าทั้งหมด",
        "โฆษณาสินค้าทั้งหมด",
        "บทความแนะนำสินค้าทั้งหมด",
        "โพสต์โซเชียลมีเดียรวม",
        "รายงานสินค้าทั้งหมด"
      ],
      tone: "เป็นมิตร, เชื่อถือได้, กระตุ้นการซื้อ, ครอบคลุม",
      targetAudience: "ลูกค้าที่สนใจในสินค้าประเภทต่างๆ"
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      format: "JSON",
      version: "1.0",
      purpose: "AI Content Generation for All Products"
    }
  };
  
  return jsonContent;
}

// ฟังก์ชันคำนวณสถิติ SKU
function getSkuStatistics(products: any[]) {
  let productsWithSku = 0;
  let productsWithoutSku = 0;
  let totalSkuVariants = 0;
  let activeSkuVariants = 0;
  let inactiveSkuVariants = 0;

  products.forEach(product => {
    if (product.skuConfig) {
      productsWithSku++;
      if (product.skuVariants && product.skuVariants.length > 0) {
        totalSkuVariants += product.skuVariants.length;
        product.skuVariants.forEach((variant: any) => {
          if (variant.isActive) {
            activeSkuVariants++;
          } else {
            inactiveSkuVariants++;
          }
        });
      }
    } else {
      productsWithoutSku++;
    }
  });

  return {
    productsWithSku,
    productsWithoutSku,
    totalSkuVariants,
    activeSkuVariants,
    inactiveSkuVariants
  };
}
