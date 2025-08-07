import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import ArticleRenderer from '@/components/ArticleRenderer';
import { IArticle } from '@/models/Article';

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
    
    return {
      title: article.seo.title,
      description: article.seo.description,
      keywords: article.seo.keywords,
      authors: [{ name: article.author.name }],
      openGraph: {
        title: article.seo.ogTitle || article.seo.title,
        description: article.seo.ogDescription || article.seo.description,
        images: article.seo.ogImage || article.featuredImage ? [{
          url: article.seo.ogImage || article.featuredImage!,
          width: 1200,
          height: 630,
          alt: article.title
        }] : undefined,
        type: 'article',
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt,
        tags: article.tags.map(tag => tag.name),
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
        'article:published_time': article.publishedAt,
        'article:modified_time': article.updatedAt,
        'article:section': article.category?.name || (Array.isArray(article.tags) ? article.tags.map(t => t.name || t).join(', ') : ''),
        'article:tag': Array.isArray(article.tags) ? article.tags.map(t => (typeof t === 'string' ? t : t.name)).join(',') : '',
        'article:author': article.author.name
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
            "image": article.featuredImage ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}${article.featuredImage}` : undefined,
    "author": {
      "@type": "Person",
      "name": article.author.name,
      "email": article.author.email
    },
    "publisher": {
      "@type": "Organization",
      "name": "PU STAR",
      "logo": {
        "@type": "ImageObject",
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/logo.jpg`
      }
    },
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/articles/${article.slug}`
    },
    "articleSection": article.category.name,
    "keywords": article.tags.join(', '),
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

      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex text-sm text-gray-600" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">หน้าแรก</Link>
            <span className="mx-2">/</span>
            <Link href="/articles" className="hover:text-primary">บทความ</Link>
            <span className="mx-2">/</span>
            {article.category?.slug && (
              <Link 
                href={`/articles?category=${article.category.slug}`} 
                className="hover:text-primary"
              >
                {article.category?.name}
              </Link>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-400">{article.title}</span>
          </nav>
        </div>

        <article className="bg-white rounded-lg shadow-sm">
          {/* Article Header */}
          <header className="mb-8">
            {/* Category Badge */}
            <div className="mb-4">
              {article.category && (
                <Link 
                  href={`/articles?category=${article.category.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: article.category?.color ? `${article.category.color}20` : '#f3f4f6',
                    color: article.category?.color || '#6b7280'
                  }}
                >
                  {article.category?.name}
                </Link>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                {article.author.avatar && (
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>โดย {article.author.name}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt!)}
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

            {/* Featured Image */}
            {article.featuredImage && (
              <div className="mb-8">
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  width={800}
                  height={400}
                  className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
                  priority
                />
              </div>
            )}

            {/* Excerpt */}
            <div className="text-lg text-gray-700 leading-relaxed mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
              {article.excerpt}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/articles?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <ArticleRenderer content={article.content} />
          </div>

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            {/* Author Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                {article.author.avatar && (
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    เกี่ยวกับ {article.author.name}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    ทีมผู้เชี่ยวชาญด้านผลิตภัณฑ์ PU และวัสดุก่อสร้าง พร้อมแบ่งปันความรู้และประสบการณ์เพื่อช่วยให้คุณเลือกใช้ผลิตภัณฑ์ได้อย่างเหมาะสม
                  </p>
                  {article.author.email && (
                    <p className="text-sm text-gray-500">
                      ติดต่อ: {article.author.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-sm font-medium text-gray-700">แชร์บทความ:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = article.title;
                    if (navigator.share) {
                      navigator.share({ title: text, url });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert('คัดลอกลิงก์แล้ว!');
                    }
                  }}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  title="แชร์"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </footer>
        </article>

        {/* Navigation */}
        {(navigation.previous || navigation.next) && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">บทความที่เกี่ยวข้อง</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <article
                  key={relatedArticle._id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <Link href={`/articles/${relatedArticle.slug}`}>
                    {relatedArticle.featuredImage && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={relatedArticle.featuredImage}
                          alt={relatedArticle.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      {relatedArticle.category && (
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: relatedArticle.category?.color ? `${relatedArticle.category.color}20` : '#f3f4f6',
                            color: relatedArticle.category?.color || '#6b7280'
                          }}
                        >
                          {relatedArticle.category?.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDate(relatedArticle.publishedAt!)}
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
        <div className="mt-12 text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            กลับไปยังบทความทั้งหมด
          </Link>
        </div>
      </div>
    </>
  );
}