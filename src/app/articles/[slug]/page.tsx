import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import ArticleRenderer from '@/components/ArticleRenderer';
import SocialShare from '@/components/SocialShare';
import { IArticle } from '@/models/Article';
import OptimizedImage from '@/components/OptimizedImage';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/api/articles/${slug}`, {
      next: { revalidate: 60 } // Revalidate every minute
    });

    if (!response.ok) {
      return {
        title: 'ไม่พบบทความ - PU STAR',
        description: 'ไม่พบบทความที่คุณต้องการ'
      };
    }

    const data = await response.json();
    const article: IArticle = data.data.article;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com';
    
    const toIso = (d: any): string | undefined => {
      if (!d) return undefined;
      try { return new Date(d as any).toISOString(); } catch { return undefined; }
    };

    return {
      title: article.seo.title,
      description: article.seo.description,
      keywords: article.seo.keywords,
      authors: article.author?.name ? [{ name: article.author.name }] : undefined,
      openGraph: {
        title: article.seo.ogTitle || article.seo.title,
        description: article.seo.ogDescription || article.seo.description,
        images: (article.seo.ogImage || article.featuredImage) ? [{
          url: article.seo.ogImage || article.featuredImage!,
          width: 1200,
          height: 630,
          alt: article.title
        }] : undefined,
        type: 'article',
        publishedTime: toIso(article.publishedAt as any),
        modifiedTime: toIso(article.updatedAt as any),
        tags: Array.isArray(article.tags) ? article.tags.map((tag: any) => (typeof tag === 'string' ? tag : tag.name)).filter(Boolean) : [],
        url: `${baseUrl}/articles/${article.slug}`
      },
      twitter: {
        card: 'summary_large_image',
        title: article.seo.ogTitle || article.seo.title,
        description: article.seo.ogDescription || article.seo.description,
        images: article.seo.ogImage || article.featuredImage ? [article.seo.ogImage || article.featuredImage!] : undefined
      },
      alternates: {
        canonical: article.seo.canonicalUrl || `${baseUrl}/articles/${article.slug}`
      },
      other: {
        'article:published_time': toIso(article.publishedAt as any) || '',
        'article:modified_time': toIso(article.updatedAt as any) || '',
        'article:section': Array.isArray(article.tags) ? article.tags.map((t: any) => (typeof t === 'string' ? t : t.name)).filter(Boolean).join(', ') : '',
        'article:tag': Array.isArray(article.tags) ? article.tags.map((t: any) => (typeof t === 'string' ? t : t.name)).filter(Boolean).join(',') : '',
        'article:author': article.author?.name || 'PU STAR'
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'บทความ - PU STAR',
      description: 'อ่านบทความและเทคนิคต่างๆ จาก PU STAR'
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  
  let article: IArticle | null = null;
  let relatedArticles: IArticle[] = [];
  let navigation: { previous: IArticle | null; next: IArticle | null } = { previous: null, next: null };

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/api/articles/${slug}`, {
      next: { revalidate: 60 } // Revalidate every minute
    });

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();
    article = data.data.article;
    relatedArticles = data.data.relatedArticles || [];
    navigation = data.data.navigation || { previous: null, next: null };

  } catch (error) {
    console.error('Error fetching article:', error);
    notFound();
  }

  if (!article) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com';
  const pageUrl = `${baseUrl}/articles/${article.slug}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Bangkok'
    });
  };

  const formatReadingTime = (minutes: number) => {
    return `${minutes} นาที`;
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featuredImage
      ? (article.featuredImage.startsWith('http')
        ? article.featuredImage
        : `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}${article.featuredImage}`)
      : undefined,
    "author": {
      "@type": "Person",
      "name": article.author?.name || 'PU STAR',
      "email": article.author?.email
    },
    "publisher": {
      "@type": "Organization",
      "name": (typeof window !== 'undefined' && (window as any).__SITE_NAME__) || 'PU STAR',
      "logo": {
        "@type": "ImageObject",
        "url": (typeof window !== 'undefined' && (window as any).__SITE_LOGO_URL__) || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/logo.jpg`
      }
    },
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/articles/${article.slug}`
    },
    "articleSection": Array.isArray(article.tags) ? (typeof article.tags[0] === 'string' ? article.tags[0] : article.tags[0]?.name) : undefined,
    "keywords": Array.isArray(article.tags) ? article.tags.map((t: any) => (typeof t === 'string' ? t : t.name)).filter(Boolean).join(', ') : undefined,
    "wordCount": article.readingTime * 200, // Approximate word count
    "timeRequired": `PT${article.readingTime}M`
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex text-sm text-gray-600" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">หน้าแรก</Link>
            <span className="mx-2">/</span>
            <Link href="/articles" className="hover:text-primary">บทความ</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">{article.title}</span>
          </nav>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <main className="lg:col-span-8">
            <article className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
              {/* Article Header */}
              <header className="mb-6">
                {/* Featured Image */}
                {article.featuredImage && (
                  <div className="relative h-56 sm:h-72 md:h-80 w-full">
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                      <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
                        {article.title}
                      </h1>
                    </div>
                  </div>
                )}

                {/* Meta Information */}
                <div className="px-4 sm:px-6 mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    {article.author?.avatar && (
                      <img
                        src={article.author.avatar}
                        alt={article.author?.name || 'ผู้เขียน'}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>โดย {article.author?.name || 'PU STAR'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <time dateTime={new Date(article.publishedAt as any).toISOString()}>
                      {formatDate(new Date(article.publishedAt as any).toISOString())}
                    </time>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>อ่าน {formatReadingTime(article.readingTime)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{article.viewCount.toLocaleString()} ครั้ง</span>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="px-4 sm:px-6 mt-4">
                  <div className="text-base md:text-lg text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
                    {article.excerpt}
                  </div>
                </div>

                {/* Tags */}
                {article.tags && (article.tags as any[]).length > 0 && (
                  <div className="px-4 sm:px-6 mt-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(article.tags as any[]).map((tag: any, index: number) => {
                        const name = typeof tag === 'string' ? tag : tag.name;
                        const slug = typeof tag === 'string' ? tag : tag.slug;
                        const color = typeof tag === 'object' ? tag.color : undefined;
                        return (
                          <Link
                            key={`${slug}-${index}`}
                            href={`/articles?tags=${encodeURIComponent(slug)}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors"
                            style={{ backgroundColor: color ? `${color}20` : '#f3f4f6', color: color || '#374151' }}
                          >
                            #{name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </header>

              {/* Article Content */}
              <div className="px-4 sm:px-6 pb-8">
                <ArticleRenderer content={article.content} />
              </div>

              {/* Article Footer */}
              <footer className="px-4 sm:px-6 pb-8 border-t border-gray-200">
                {/* Author Info */}
                <div className="bg-gray-50 rounded-lg p-6 mt-8">
                  <div className="flex items-start gap-4">
                    {article.author?.avatar && (
                      <img
                        src={article.author.avatar}
                        alt={article.author?.name || 'ผู้เขียน'}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        เกี่ยวกับ {article.author?.name || 'PU STAR'}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        ทีมผู้เชี่ยวชาญด้านผลิตภัณฑ์ PU และวัสดุก่อสร้าง พร้อมแบ่งปันความรู้และประสบการณ์เพื่อช่วยให้คุณเลือกใช้ผลิตภัณฑ์ได้อย่างเหมาะสม
                      </p>
                      {article.author?.email && (
                        <p className="text-sm text-gray-500">
                          ติดต่อ: {article.author.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Share Buttons - mobile/tablet only */}
                <div className="mt-8 block lg:hidden">
                  <SocialShare url={pageUrl} title={article.title} description={article.excerpt} />
                </div>
              </footer>
            </article>

            {/* Navigation */}
            {(navigation.previous || navigation.next) && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {navigation.previous && (
                  <Link
                    href={`/articles/${navigation.previous.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <div className="text-sm text-gray-500 mb-1">บทความก่อนหน้า</div>
                    <div className="font-medium text-gray-900 group-hover:text-primary">
                      {navigation.previous.title}
                    </div>
                  </Link>
                )}
                {navigation.next && (
                  <Link
                    href={`/articles/${navigation.next.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group text-right"
                  >
                    <div className="text-sm text-gray-500 mb-1">บทความถัดไป</div>
                    <div className="font-medium text-gray-900 group-hover:text-primary">
                      {navigation.next.title}
                    </div>
                  </Link>
                )}
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">บทความที่เกี่ยวข้อง</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedArticles.map((relatedArticle) => (
                        <article
                      key={String(relatedArticle._id)}
                      className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <Link href={`/articles/${relatedArticle.slug}`}>
                        {relatedArticle.featuredImage && (
                          <div className="relative h-48 w-full">
                            <OptimizedImage
                              src={relatedArticle.featuredImage}
                              alt={relatedArticle.title}
                              fill={true}
                              className="object-cover"
                            />
                          </div>
                        )}
                      </Link>
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                        {Array.isArray((relatedArticle as any).tags) && (relatedArticle as any).tags.length > 0 && (
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: ((relatedArticle as any).tags[0]?.color ? `${(relatedArticle as any).tags[0].color}20` : '#f3f4f6'),
                              color: (relatedArticle as any).tags[0]?.color || '#6b7280'
                            }}
                          >
                            {(relatedArticle as any).tags[0]?.name || (relatedArticle as any).tags[0]?.slug}
                          </span>
                        )}
                          <span className="text-xs text-gray-500">
                            {formatDate(new Date(relatedArticle.publishedAt as any).toISOString())}
                          </span>
                        </div>
                        <Link href={`/articles/${relatedArticle.slug}`}>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors line-clamp-2">
                            {relatedArticle.title}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{relatedArticle.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatReadingTime(relatedArticle.readingTime)}</span>
                          <span>{relatedArticle.viewCount.toLocaleString()} ครั้ง</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Articles */}
            <div className="mt-10 text-center">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                กลับไปยังบทความทั้งหมด
              </Link>
            </div>
          </main>

          {/* Aside - TOC & Share */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 hidden lg:block">
                <SocialShare url={pageUrl} title={article.title} description={article.excerpt} />
              </div>

              {/* Table of Contents */}
              {Array.isArray(article.content) && article.content.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">สารบัญ</h3>
                  <nav className="text-sm text-gray-700">
                    <ul className="space-y-2">
                      {[...article.content]
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((block: any, index: number) => ({ block, index }))
                        .filter(({ block }) => block.type === 'heading')
                        .map(({ block, index }) => {
                          const text = (block.content?.text as string) || '';
                          const id = `${text.toLowerCase().trim().replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')}-${index}`;
                          const level = block.content?.level || 2;
                          const indentClass = level >= 6
                            ? 'pl-12'
                            : level === 5
                            ? 'pl-9'
                            : level === 4
                            ? 'pl-6'
                            : level === 3
                            ? 'pl-3'
                            : 'pl-0';
                          return (
                            <li key={id} className={`${indentClass}`}>
                              <a href={`#${id}`} className="hover:text-primary">
                                {text}
                              </a>
                            </li>
                          );
                        })}
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}