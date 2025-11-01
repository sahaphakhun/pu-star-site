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
    const detail = searchParams.get('detail') === 'summary' ? 'summary' : 'full';
    
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
    const allProductsContent = generateAllProductsContent(products, detail);

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
function generateAllProductsContent(products: any[], detail: 'full' | 'summary') {
  // สร้าง Markdown content
  const markdown = generateAllProductsMarkdown(products, detail);

  // สร้าง JSON content
  const json = generateAllProductsJSON(products);

  return { markdown, json };
}

// สร้าง Markdown content สำหรับสินค้าทั้งหมด
export function generateAllProductsMarkdown(products: any[], detail: 'full' | 'summary') {
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

    if (detail === 'summary') {
      // ตารางสรุปสินค้าแบบย่อ
      markdown += `| ชื่อสินค้า | สถานะ | ราคาเริ่มต้น | ค่าส่งเริ่มต้น | SKU Variants |\n`;
      markdown += `|---|---|---|---|---|\n`;
      categoryProducts.forEach((product: any) => {
        const status = product.isAvailable !== false ? '✅ พร้อมขาย' : '❌ สินค้าหมด';
        const price = product.price !== undefined ? `฿${product.price.toLocaleString()}` : '-';
        const shippingFee = product.shippingFee !== undefined ? `฿${product.shippingFee.toLocaleString()}` : '-';
        const skuCount = product.skuVariants && product.skuVariants.length > 0 ? product.skuVariants.length : '-';
        markdown += `| ${product.name} | ${status} | ${price} | ${shippingFee} | ${skuCount} |\n`;
      });
      markdown += `\n`;

      // รายละเอียดแบบย่อ
      markdown += `**รายละเอียดแบบย่อ**\n`;
      categoryProducts.forEach((product: any) => {
        const desc = product.description || '';
        const shortDesc = desc.length > 100 ? desc.slice(0, 100) + '...' : desc;
        if (shortDesc) {
          markdown += `**${product.name}**: ${shortDesc}\n`;
        }
      });
      markdown += `\n`;
    } else {
      // รายละเอียดสินค้าแบบเต็ม
      categoryProducts.forEach((product: any, index: number) => {
        markdown += `### ${index + 1}. ${product.name}\n`;
        markdown += `- **สถานะ**: ${product.isAvailable !== false ? '✅ พร้อมขาย' : '❌ สินค้าหมด'}\n`;
        markdown += `- **รายละเอียด**: ${product.description}\n`;

        if (product.price !== undefined) {
          markdown += `- **ราคาเริ่มต้น**: ฿${product.price.toLocaleString()}\n`;
        }
        if (typeof product.shippingFee === 'number') {
          markdown += `- **ค่าส่งเริ่มต้น**: ฿${product.shippingFee.toLocaleString()}\n`;
        }

        if (product.units && product.units.length > 0) {
          markdown += `- **หน่วยสินค้า**: ${product.units.length} หน่วย\n`;
          product.units.forEach((unit: any) => {
            const unitDetails = [
              `ราคา ฿${unit.price.toLocaleString()}`,
              unit.shippingFee !== undefined
                ? `ค่าจัดส่ง ฿${unit.shippingFee.toLocaleString()}`
                : null,
              unit.multiplier !== undefined ? `ตัวคูณ ${unit.multiplier}` : null,
            ]
              .filter(Boolean)
              .join(', ');
            markdown += `  - ${unit.label}: ${unitDetails}\n`;
          });
        }

        if (product.options && product.options.length > 0) {
          markdown += `- **ตัวเลือก**: ${product.options.length} ประเภท\n`;
          product.options.forEach((option: any) => {
            const values = (option.values || [])
              .map(
                (v: any) =>
                  `${v.label} (${v.isAvailable === false ? '❌' : '✅'})`
              )
              .join(', ');
            markdown += `  - ${option.name}: ${values}\n`;
          });
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
    }
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
  markdown += `## 🤖 คำแนะนำ \n`;
  markdown += `\`\`\`\n`;
  markdown += `- **การอัปเดต**: ข้อมูลนี้จะอัปเดต realtime ตามข้อมูลในฐานข้อมูลใน https://www.winrichdynamic.com/\n`;
  markdown += `- **ข้อมูลค่าส่ง**: แสดงค่าส่งเริ่มต้นของแต่ละสินค้า (ถ้ามี)\n`;
  markdown += `\`\`\`\n`;

  return markdown;
}

// สร้าง JSON content สำหรับสินค้าทั้งหมด
export function generateAllProductsJSON(products: any[]) {
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
      shippingFee: product.shippingFee !== undefined ? product.shippingFee : null,
      units: (product.units || []).map((u: any) => ({
        ...u,
        shippingFee: u.shippingFee !== undefined ? u.shippingFee : null,
      })),
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
