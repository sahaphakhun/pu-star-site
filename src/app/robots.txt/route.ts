import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com';
  
  const robotsTxt = `# Robots.txt สำหรับ ${baseUrl}
# พัฒนาโดย WinRich Team
# อนุญาตให้ Facebook Bot และ Search Engine เข้าถึง

# อนุญาตให้ Facebook Bot เข้าถึง
User-agent: facebookexternalhit
Allow: /
Crawl-delay: 1

# อนุญาตให้ Facebook Bot อื่นๆ
User-agent: facebookcatalog
Allow: /
Crawl-delay: 1

# อนุญาตให้ LinkedIn Bot
User-agent: LinkedInBot
Allow: /
Crawl-delay: 1

# อนุญาตให้ Twitter Bot
User-agent: Twitterbot
Allow: /
Crawl-delay: 1

# อนุญาตให้ Google Bot
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# อนุญาตให้ Bing Bot
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# อนุญาตให้ search engine ทั้งหมดเข้าถึง
User-agent: *
Allow: /

# ไม่อนุญาตให้ index หน้าแอดมินและ API
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /login
Disallow: /profile
Disallow: /my-orders
Disallow: /cart

# ไม่อนุญาตให้ index ไฟล์ที่ไม่ต้องการ
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /*.txt$
Disallow: /*.pdf$

# อนุญาตให้ crawl หน้าสำคัญสำหรับ SEO
Allow: /shop
Allow: /articles
Allow: /products
Allow: /catalog
Allow: /categories
Allow: /contact
Allow: /customer-service
Allow: /privacy-policy

# อนุญาตให้ crawl เนื้อหาสินค้าและบทความ
Allow: /products/*
Allow: /articles/*
Allow: /catalog/*

# อนุญาตให้ crawl ภาพที่อัพโหลด
Allow: /uploads/
Allow: /uploads/images/

# ไม่อนุญาตให้ index หน้าค้นหาและฟิลเตอร์
Disallow: /search?
Disallow: /*?search=
Disallow: /*?filter=
Disallow: /*?sort=
Disallow: /*?page=

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Host
Host: ${baseUrl}

# Crawl delay (ไม่บังคับ แต่แนะนำ)
Crawl-delay: 1

# ข้อมูลเพิ่มเติม
# เว็บไซต์นี้ใช้ Next.js และ MongoDB
# เนื้อหาหลัก: สินค้า, บทความ, ข้อมูลบริษัท
# ภาษา: ไทย (th-TH)
# ภูมิภาค: ประเทศไทย
# Facebook Bot: อนุญาตให้เข้าถึงเพื่อการแชร์และ preview
# Messenger Bot: รองรับการส่งภาพและข้อความผ่าน [SEND_IMAGE:...]`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}