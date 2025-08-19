import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';

// GET: สร้างข้อความสินค้าในรูปแบบ Markdown และ JSON
export async function GET(request: NextRequest, context: unknown) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult || !authResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = (context as { params: { id: string } }).params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'both'; // 'markdown', 'json', 'both'
    
    await connectDB();
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    // สร้างข้อมูลสินค้าพร้อม SKU variants
    const productContent = generateProductContent(product);

    // ส่งข้อมูลตามรูปแบบที่ต้องการ
    if (format === 'markdown') {
      return new NextResponse(productContent.markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${product.name}-content.md"`
        }
      });
    } else if (format === 'json') {
      return NextResponse.json(productContent.json, {
        headers: {
          'Content-Disposition': `attachment; filename="${product.name}-content.json"`
        }
      });
    } else {
      // ส่งทั้งสองรูปแบบ
      return NextResponse.json(productContent);
    }
  } catch (error) {
    console.error('Error generating product content:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างข้อความสินค้า' }, { status: 500 });
  }
}

// ฟังก์ชันสร้างข้อความสินค้า
function generateProductContent(product: any) {
  const { name, description, price, units, options, skuConfig, skuVariants, category, isAvailable } = product;

  // สร้าง Markdown content
  const markdown = generateMarkdownContent(product);
  
  // สร้าง JSON content
  const json = generateJSONContent(product);

  return { markdown, json };
}

// สร้าง Markdown content
function generateMarkdownContent(product: any) {
  const { name, description, price, units, options, skuConfig, skuVariants, category, isAvailable, shippingFee } = product;
  
  let markdown = `# ${name}\n\n`;
  
  // ข้อมูลพื้นฐาน
  markdown += `## ข้อมูลพื้นฐาน\n`;
  markdown += `- **ชื่อสินค้า**: ${name}\n`;
  markdown += `- **หมวดหมู่**: ${category || 'ทั่วไป'}\n`;
  markdown += `- **สถานะ**: ${isAvailable !== false ? 'พร้อมขาย' : 'สินค้าหมด'}\n`;
  markdown += `- **รายละเอียด**: ${description}\n\n`;
  
  // ราคา
  if (price !== undefined) {
    markdown += `## ราคา\n`;
    markdown += `- **ราคาเริ่มต้น**: ฿${price.toLocaleString()}\n`;
    if (typeof shippingFee === 'number') {
      markdown += `- **ค่าส่งเริ่มต้น**: ฿${shippingFee.toLocaleString()}\n`;
    }
    markdown += `\n`;
  }
  
  // หน่วยสินค้า
  if (units && units.length > 0) {
    markdown += `## หน่วยสินค้า\n`;
    units.forEach((unit: any, index: number) => {
      markdown += `${index + 1}. **${unit.label}**\n`;
      markdown += `   - ราคา: ฿${unit.price.toLocaleString()}\n`;
      if (unit.shippingFee !== undefined) {
        markdown += `   - ค่าส่ง: ฿${unit.shippingFee.toLocaleString()}\n`;
      }
      if (unit.multiplier && unit.multiplier > 1) {
        markdown += `   - ตัวคูณ: ${unit.multiplier}x\n`;
      }
      markdown += `\n`;
    });
  }
  
  // ตัวเลือกสินค้า
  if (options && options.length > 0) {
    markdown += `## ตัวเลือกสินค้า\n`;
    options.forEach((option: any, optIndex: number) => {
      markdown += `### ${option.name}\n`;
      option.values.forEach((value: any, valIndex: number) => {
        const status = value.isAvailable !== false ? '✅' : '❌';
        markdown += `${valIndex + 1}. ${status} **${value.label}**\n`;
        if (value.imageUrl) {
          markdown += `   - รูปภาพ: ${value.imageUrl}\n`;
        }
        markdown += `\n`;
      });
    });
  }
  
  // SKU Configuration
  if (skuConfig) {
    markdown += `## การตั้งค่า SKU\n`;
    markdown += `- **ตัวอักษรนำหน้า**: ${skuConfig.prefix}\n`;
    markdown += `- **ตัวคั่น**: ${skuConfig.separator}\n`;
    markdown += `- **วิธีการสร้าง**: ${skuConfig.autoGenerate ? 'อัตโนมัติ' : 'กำหนดเอง'}\n`;
    
    if (!skuConfig.autoGenerate && skuConfig.customSku) {
      markdown += `- **SKU ที่กำหนดเอง**: ${skuConfig.customSku}\n`;
    }
    markdown += `\n`;
  }
  
  // SKU Variants
  if (skuVariants && skuVariants.length > 0) {
    markdown += `## รายการ SKU Variants\n`;
    markdown += `| ลำดับ | Unit | ตัวเลือก | SKU | สถานะ |\n`;
    markdown += `|-------|------|----------|-----|--------|\n`;
    
    skuVariants.forEach((variant: any, index: number) => {
      const unitLabel = variant.unitLabel || '-';
      const optionsText = variant.options && Object.keys(variant.options).length > 0
        ? Object.entries(variant.options).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '-';
      const status = variant.isActive ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน';
      
      markdown += `| ${index + 1} | ${unitLabel} | ${optionsText} | **${variant.sku}** | ${status} |\n`;
    });
    markdown += `\n`;
  }
  
  // คำแนะนำสำหรับ AI
  markdown += `## คำแนะนำสำหรับ AI\n`;
  markdown += `\`\`\`\n`;
  markdown += `INSTRUCTION: ใช้ข้อมูลสินค้านี้เพื่อสร้างเนื้อหาโฆษณา, คำอธิบาย, หรือข้อมูลทางการค้า\n`;
  markdown += `\n`;
  markdown += `PRODUCT DATA:\n`;
  markdown += `- Name: ${name}\n`;
  markdown += `- Category: ${category || 'ทั่วไป'}\n`;
  markdown += `- Description: ${description}\n`;
  
  if (skuConfig) {
    markdown += `- SKU Prefix: ${skuConfig.prefix}\n`;
    markdown += `- SKU Separator: ${skuConfig.separator}\n`;
    markdown += `- SKU Generation: ${skuConfig.autoGenerate ? 'Auto' : 'Manual'}\n`;
  }
  
  if (skuVariants && skuVariants.length > 0) {
    markdown += `- Total SKU Variants: ${skuVariants.length}\n`;
    markdown += `- Active SKUs: ${skuVariants.filter((v: any) => v.isActive).length}\n`;
  }
  
  markdown += `\n`;
  markdown += `REQUIREMENTS:\n`;
  markdown += `1. ใช้ชื่อสินค้าและรายละเอียดที่ให้มา\n`;
  markdown += `2. ระบุ SKU ที่เกี่ยวข้องหากจำเป็น\n`;
  markdown += `3. เน้นคุณสมบัติและประโยชน์ของสินค้า\n`;
  markdown += `4. ใช้ภาษาที่เหมาะสมกับกลุ่มเป้าหมาย\n`;
  markdown += `5. รวมข้อมูลการติดต่อหรือสั่งซื้อหากจำเป็น\n`;
  markdown += `\`\`\`\n\n`;
  
  // ข้อมูลเพิ่มเติม
  markdown += `## ข้อมูลเพิ่มเติม\n`;
  markdown += `- **วันที่สร้าง**: ${new Date().toLocaleDateString('th-TH')}\n`;
  markdown += `- **เวลาที่สร้าง**: ${new Date().toLocaleTimeString('th-TH')}\n`;
  markdown += `- **รูปแบบไฟล์**: Markdown\n`;
  markdown += `- **วัตถุประสงค์**: สำหรับ AI Content Generation\n`;
  
  return markdown;
}

// สร้าง JSON content
function generateJSONContent(product: any) {
  const { name, description, price, units, options, skuConfig, skuVariants, category, isAvailable, shippingFee } = product;
  
  const jsonContent = {
    product: {
      id: product._id,
      name,
      description,
      category: category || 'ทั่วไป',
      isAvailable: isAvailable !== false,
      price: price !== undefined ? price : null,
      shippingFee: shippingFee !== undefined ? shippingFee : null,
      units: units || [],
      options: options || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    },
    sku: {
      config: skuConfig || null,
      variants: skuVariants || [],
      summary: {
        totalVariants: skuVariants ? skuVariants.length : 0,
        activeVariants: skuVariants ? skuVariants.filter((v: any) => v.isActive).length : 0,
        inactiveVariants: skuVariants ? skuVariants.filter((v: any) => !v.isActive).length : 0
      }
    },
    aiInstructions: {
      purpose: "AI Content Generation for Product Marketing",
      requirements: [
        "ใช้ชื่อสินค้าและรายละเอียดที่ให้มา",
        "ระบุ SKU ที่เกี่ยวข้องหากจำเป็น",
        "เน้นคุณสมบัติและประโยชน์ของสินค้า",
        "ใช้ภาษาที่เหมาะสมกับกลุ่มเป้าหมาย",
        "รวมข้อมูลการติดต่อหรือสั่งซื้อหากจำเป็น"
      ],
      contentTypes: [
        "โฆษณาสินค้า",
        "คำอธิบายสินค้า",
        "ข้อมูลทางการค้า",
        "บทความแนะนำสินค้า",
        "โพสต์โซเชียลมีเดีย"
      ],
      tone: "เป็นมิตร, เชื่อถือได้, กระตุ้นการซื้อ",
      targetAudience: "ลูกค้าที่สนใจในสินค้าประเภทนี้"
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      format: "JSON",
      version: "1.0",
      purpose: "AI Content Generation"
    }
  };
  
  return jsonContent;
}

export { generateMarkdownContent, generateJSONContent };
