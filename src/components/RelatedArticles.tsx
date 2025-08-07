import Image from 'next/image';
import Link from 'next/link';
import { IArticle } from '@/models/Article';

interface RelatedArticlesProps {
  currentArticleId: string;
  tags: string[]; // Tag slugs
  limit?: number;
}

interface RelatedArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt: string;
  readingTime: number;
  tags: { name: string; slug: string; color: string }[];
  author: { name: string };
}

export default async function RelatedArticles({ 
  currentArticleId, 
  tags, 
  limit = 4 
}: RelatedArticlesProps) {
  let relatedArticles: RelatedArticle[] = [];

  try {
    // ค้นหาบทความที่เกี่ยวข้องจากแท็ก
    const queryParams = new URLSearchParams({
      tags: tags.join(','),
      limit: (limit + 2).toString(), // ขอมากกว่าเพื่อกรองบทความปัจจุบันออก
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/api/articles?${queryParams}`,
      { 
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (response.ok) {
      const data = await response.json();
      // กรองบทความปัจจุบันออกและจำกัดจำนวน
      relatedArticles = data.data.articles
        .filter((article: RelatedArticle) => article._id !== currentArticleId)
        .slice(0, limit);
    }
  } catch (error) {
    console.error('Error fetching related articles:', error);
  }

  if (relatedArticles.length === 0) {
    return null;
  }

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

  return (
    <section className="related-articles bg-gray-50 py-12 mt-12 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            บทความที่เกี่ยวข้อง
          </h2>
          <p className="text-gray-600">
            บทความอื่นๆ ที่น่าสนใจสำหรับคุณ
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {relatedArticles.map((article) => (
            <article key={article._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
              <Link href={`/articles/${article.slug}`}>
                {article.featuredImage && (
                  <div className="aspect-video overflow-hidden">
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      width={400}
                      height={240}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.slug}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: tag.color + '20', 
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {article.tags.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{article.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{formatDate(article.publishedAt)}</span>
                      <span>{formatReadingTime(article.readingTime)}</span>
                    </div>
                    <span className="text-blue-600 font-medium group-hover:text-blue-700">
                      อ่านต่อ →
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* View all articles link */}
        <div className="text-center mt-10">
          <Link
            href="/articles"
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            ดูบทความทั้งหมด
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .related-articles {
            display: none !important;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}