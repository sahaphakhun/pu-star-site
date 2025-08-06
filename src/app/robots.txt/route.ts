import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pustar.co.th';
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# ไม่อนุญาตให้ index หน้าแอดมิน
Disallow: /admin/
Disallow: /api/

# อนุญาตให้ crawl หน้าสำคัญ
Allow: /
Allow: /articles
Allow: /products
Allow: /contact

# Crawl delay (ไม่บังคับ)
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}