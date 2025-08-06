import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // ดึงบทความที่เผยแพร่แล้ว
    const articles = await Article.find({
      status: 'published',
      $or: [
        { publishedAt: { $lte: new Date() } },
        { scheduledAt: { $lte: new Date() } }
      ]
    })
    .select('slug updatedAt publishedAt')
    .sort({ updatedAt: -1 })
    .lean();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pustar.co.th';
    
    // สร้าง XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- หน้าหลัก -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- หน้ารวมบทความ -->
  <url>
    <loc>${baseUrl}/articles</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- หน้าผลิตภัณฑ์ -->
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- หน้าติดต่อ -->
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- บทความแต่ละหน้า -->
  ${articles.map(article => `
  <url>
    <loc>${baseUrl}/articles/${article.slug}</loc>
    <lastmod>${(article.updatedAt || article.publishedAt || new Date()).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}