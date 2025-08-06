import Image from "next/image";
import Link from "next/link";
import { Metadata } from 'next';
import { IArticle } from '@/models/Article';

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
    category?: string;
    tag?: string;
    search?: string;
  }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1');
  const category = params?.category;
  const tag = params?.tag;
  const search = params?.search;

  let articles: IArticle[] = [];
  let categories: any[] = [];
  let popularTags: any[] = [];
  let pagination = {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '12',
      ...(category && { category }),
      ...(tag && { tag }),
      ...(search && { search })
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/articles?${queryParams}`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (response.ok) {
      const data = await response.json();
      articles = data.data.articles;
      categories = data.data.categories;
      popularTags = data.data.popularTags;
      pagination = data.data.pagination;
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
    // Fallback to empty arrays if API fails
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

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">บทความและข่าวสาร</h1>
        <p className="text-gray-600">ข้อมูลเกี่ยวกับผลิตภัณฑ์ เทคนิคการใช้งาน และข่าวสารล่าสุดจาก PU STAR Thailand</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form method="GET" className="max-w-md">
          <div className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="ค้นหาบทความ..."
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Hidden inputs to preserve other filters */}
            {category && <input type="hidden" name="category" value={category} />}
            {tag && <input type="hidden" name="tag" value={tag} />}
          </div>
        </form>
      </div>

      {/* Current Filters */}
      {(search || category || tag) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">ตัวกรอง:</span>
          {search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              ค้นหา: "{search}"
              <Link href="/articles" className="ml-2 text-blue-600 hover:text-blue-800">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              หมวดหมู่: {categories.find(c => c.slug === category)?.name || category}
              <Link href={`/articles${search ? `?search=${search}` : ''}${tag ? `${search ? '&' : '?'}tag=${tag}` : ''}`} className="ml-2 text-green-600 hover:text-green-800">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </span>
          )}
          {tag && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              แท็ก: {tag}
              <Link href={`/articles${search ? `?search=${search}` : ''}${category ? `${search ? '&' : '?'}category=${category}` : ''}`} className="ml-2 text-purple-600 hover:text-purple-800">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </span>
          )}
          <Link 
            href="/articles"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ล้างตัวกรองทั้งหมด
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Articles Grid */}
          {articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {articles.map((article) => (
                  <article
                    key={article._id}
                    className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                  >
                    <Link href={`/articles/${article.slug}`}>
                      {article.featuredImage && (
                        <div className="relative h-48 w-full">
                          <Image
                            src={article.featuredImage}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </Link>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <Link
                          href={`/articles?category=${article.category.slug}`}
                          className="text-xs font-medium px-2 py-1 rounded-full transition-colors"
                          style={{ 
                            backgroundColor: article.category.color ? `${article.category.color}20` : '#f3f4f6',
                            color: article.category.color || '#6b7280'
                          }}
                        >
                          {article.category.name}
                        </Link>
                        <time className="text-xs text-gray-500" dateTime={article.publishedAt}>
                          {formatDate(article.publishedAt!)}
                        </time>
                      </div>
                      <Link href={`/articles/${article.slug}`}>
                        <h2 className="text-xl font-bold text-primary mb-3 hover:text-accent transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                      </Link>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                      
                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <Link
                              key={index}
                              href={`/articles?tag=${encodeURIComponent(tag)}`}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            >
                              #{tag}
                            </Link>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{article.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="text-accent font-medium text-sm hover:underline"
                        >
                          อ่านต่อ
                        </Link>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatReadingTime(article.readingTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {article.viewCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  {pagination.hasPreviousPage && (
                    <Link
                      href={`/articles?page=${pagination.currentPage - 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}${search ? `&search=${search}` : ''}`}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      ก่อนหน้า
                    </Link>
                  )}
                  
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                      const pageNum = Math.max(1, Math.min(pagination.currentPage - 2 + index, pagination.totalPages - 4 + index));
                      const isActive = pageNum === pagination.currentPage;
                      
                      return (
                        <Link
                          key={pageNum}
                          href={`/articles?page=${pageNum}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}${search ? `&search=${search}` : ''}`}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                  </div>
                  
                  {pagination.hasNextPage && (
                    <Link
                      href={`/articles?page=${pagination.currentPage + 1}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}${search ? `&search=${search}` : ''}`}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      ถัดไป
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบบทความ</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || category || tag 
                  ? 'ไม่พบบทความที่ตรงกับเงื่อนไขการค้นหา' 
                  : 'ยังไม่มีบทความในระบบ'
                }
              </p>
              {(search || category || tag) && (
                <div className="mt-6">
                  <Link
                    href="/articles"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                  >
                    ดูบทความทั้งหมด
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">หมวดหมู่</h3>
              <div className="space-y-2">
                <Link
                  href="/articles"
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    !category ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ทั้งหมด
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/articles?category=${cat.slug}`}
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      category === cat.slug ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">แท็กยอดนิยม</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 10).map((tagItem) => (
                  <Link
                    key={tagItem.name}
                    href={`/articles?tag=${encodeURIComponent(tagItem.name)}`}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                      tag === tagItem.name 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tagItem.name}
                    <span className="ml-1 text-xs opacity-75">({tagItem.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="bg-primary/5 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">รับข่าวสารใหม่</h3>
            <p className="text-sm text-gray-600 mb-4">
              สมัครรับข่าวสารและบทความใหม่ล่าสุดจาก PU STAR
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="อีเมลของคุณ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                สมัครรับข่าวสาร
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}