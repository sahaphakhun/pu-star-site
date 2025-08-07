import Image from "next/image";
import Link from "next/link";
import { Metadata } from 'next';
import { IArticle } from '@/models/Article';
import OptimizedImage from '@/components/OptimizedImage';

export const metadata: Metadata = {
  title: 'บทความและเทคนิค - PU STAR',
  description: 'รวมบทความ คู่มือ และเทคนิคการใช้งานผลิตภัณฑ์ PU, กาว, และซีลแลนท์ จากผู้เชี่ยวชาญ',
  keywords: ['บทความ', 'คู่มือ', 'เทคนิค', 'PU', 'กาว', 'ซีลแลนท์', 'ก่อสร้าง'],
  openGraph: {
    title: 'บทความและเทคนิค - PU STAR',
    description: 'รวมบทความ คู่มือ และเทคนิคการใช้งานผลิตภัณฑ์ PU, กาว, และซีลแลนท์ จากผู้เชี่ยวชาญ',
    type: 'website'
  }
};

interface ArticlesPageProps {
  searchParams?: Promise<{
    page?: string;
    tags?: string; // รองรับหลายแท็ก คั่นด้วยคอมม่า
    search?: string;
  }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1');
  const tags = params?.tags; // แท็กที่เลือก
  const search = params?.search;

  let articles: IArticle[] = [];
  let allTags: any[] = [];
  let popularTags: any[] = [];
  let pagination = {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  try {
    // ดึงข้อมูลบทความ
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '12',
      ...(tags && { tags }),
      ...(search && { search })
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/api/articles?${queryParams}`, {
      next: { revalidate: 300 }
    });

    if (response.ok) {
      const data = await response.json();
      articles = data.data.articles;
      popularTags = data.data.popularTags;
      pagination = data.data.pagination;
    }

    // ดึงข้อมูลแท็กทั้งหมด
    const tagsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/api/tags?limit=100`, {
      next: { revalidate: 600 }
    });

    if (tagsResponse.ok) {
      const tagsData = await tagsResponse.json();
      allTags = tagsData.data.tags;
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
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

  const selectedTags = tags ? tags.split(',').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary via-primary to-[#1e3a8a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              บทความและเทคนิค
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              รวมบทความ คู่มือ และเทคนิคการใช้งานผลิตภัณฑ์ PU, กาว, และซีลแลนท์ จากผู้เชี่ยวชาญ
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form method="GET" className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="ค้นหาบทความ..."
                  className="w-full px-6 py-4 text-gray-900 bg-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 pr-16"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-accent text-white rounded-full hover:opacity-90 transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {/* Hidden inputs to preserve other filters */}
                {tags && <input type="hidden" name="tags" value={tags} />}
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="sticky top-8 space-y-8">
              {/* Tags Filter */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  แท็กยอดนิยม
                </h3>
                <div className="flex flex-wrap gap-2">
                   {popularTags.map((tag: any) => {
                    const isSelected = selectedTags.includes(tag.slug);
                    return (
                      <Link
                        key={tag.slug}
                          href={`/articles?tags=${isSelected 
                          ? selectedTags.filter(t => t !== tag.slug).join(',')
                          : [...selectedTags, tag.slug].join(',')
                        }`}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-800'
                        }`}
                      >
                         {tag?.name || tag?.slug}
                        <span className="ml-1.5 text-xs opacity-75">
                           ({tag.articleCount ?? 0})
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* All Tags */}
              {allTags.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    แท็กทั้งหมด
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 20).map((tag: any) => {
                       const isSelected = selectedTags.includes(tag.slug);
                      return (
                        <Link
                          key={tag.slug}
                          href={`/articles?tags=${isSelected 
                            ? selectedTags.filter(t => t !== tag.slug).join(',')
                            : [...selectedTags, tag.slug].join(',')
                          }`}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                          }`}
                        >
                          {tag?.name || tag?.slug}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Current Filters */}
            {(search || selectedTags.length > 0) && (
              <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">กรองโดย:</span>
                  
                  {search && (
                     <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                       <span>ค้นหา: "{search}"</span>
                      <Link
                        href={`/articles?${selectedTags.length > 0 ? `tags=${tags}` : ''}`}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </Link>
                    </div>
                  )}
                  
                  {selectedTags.map((tagSlug) => {
                     const tag = allTags.find(t => t.slug === tagSlug);
                    if (!tag) return null;
                    
                    return (
                      <div key={tagSlug} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                        <span>{tag?.name || tagSlug}</span>
                        <Link
                     href={`/articles?${search ? `search=${search}&` : ''}tags=${selectedTags.filter(t => t !== tagSlug).join(',')}`}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </Link>
                      </div>
                    );
                  })}
                  
                  <Link
                    href="/articles"
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    ล้างตัวกรองทั้งหมด
                  </Link>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {articles.length > 0 ? (
              <>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {articles.map((article: any) => (
                    <article key={article._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
                      <Link href={`/articles/${article.slug}`}>
                        {article.featuredImage && (
                          <div className="aspect-video overflow-hidden">
                            <OptimizedImage
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
                              {article.tags.slice(0, 2).map((tag: any) => (
                                <span
                                  key={tag.slug}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                          
                          <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                            {article.title}
                          </h2>
                          
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {article.excerpt}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                              <span>{formatReadingTime(article.readingTime)}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {article.viewCount || 0}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      {pagination.hasPreviousPage && (
                        <Link
                          href={`/articles?page=${pagination.currentPage - 1}${search ? `&search=${search}` : ''}${tags ? `&tags=${tags}` : ''}`}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          ก่อนหน้า
                        </Link>
                      )}
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(
                          pagination.currentPage - 2 + i,
                          pagination.totalPages - 4 + i
                        ));
                        
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <Link
                            key={pageNum}
                            href={`/articles?page=${pageNum}${search ? `&search=${search}` : ''}${tags ? `&tags=${tags}` : ''}`}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              pageNum === pagination.currentPage
                                ? 'bg-primary text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                      
                      {pagination.hasNextPage && (
                        <Link
                          href={`/articles?page=${pagination.currentPage + 1}${search ? `&search=${search}` : ''}${tags ? `&tags=${tags}` : ''}`}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          ถัดไป
                        </Link>
                      )}
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <div className="max-w-md mx-auto">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ไม่พบบทความ
                  </h3>
                  <p className="text-gray-600 mb-6">
                    ลองเปลี่ยนคำค้นหาหรือลบตัวกรองบางส่วน
                  </p>
                  <Link
                    href="/articles"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    ดูบทความทั้งหมด
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}