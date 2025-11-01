'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import AdvancedRichTextEditor from '@/components/AdvancedRichTextEditor';
import { IContentBlock, IArticle, ISEOMetadata, IArticleTag } from '@/models/Article';

export default function CreateArticlePage() {
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Available tags
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [content, setContent] = useState<IContentBlock[]>([]);
  const [selectedTags, setSelectedTags] = useState<IArticleTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [author, setAuthor] = useState({
    name: 'ทีมงาน PU STAR',
    email: '',
    avatar: ''
  });

  // SEO state
  const [seo, setSeo] = useState<ISEOMetadata>({
    title: '',
    description: '',
    keywords: [],
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonicalUrl: ''
  });

  const canCreate = hasPermission(PERMISSIONS.ARTICLES_CREATE);
  const canPublish = hasPermission(PERMISSIONS.ARTICLES_PUBLISH);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags?limit=100', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.data.tags);
        }
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };

    loadTags();
  }, []);

  // Auto-generate slug from title
  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
    
    // Auto-update SEO title if empty
    if (!seo.title) {
      setSeo(prev => ({ ...prev, title: newTitle }));
    }
  }, [title, slug, seo.title, generateSlug]);

  // Handle excerpt change
  const handleExcerptChange = useCallback((newExcerpt: string) => {
    setExcerpt(newExcerpt);
    
    // Auto-update SEO description if empty
    if (!seo.description) {
      setSeo(prev => ({ ...prev, description: newExcerpt }));
    }
  }, [seo.description]);

  // Add tag
  const addTag = useCallback((tag: any) => {
    if (!selectedTags.find(t => t.slug === tag.slug)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  }, [selectedTags]);

  // Remove tag
  const removeTag = useCallback((tagSlug: string) => {
    setSelectedTags(prev => prev.filter(t => t.slug !== tagSlug));
  }, []);

  // Create new tag
  const createNewTag = useCallback(async () => {
    if (!newTagName.trim()) return;

    const slug = generateSlug(newTagName);
    const newTag = {
      name: newTagName.trim(),
      slug,
      color: '#3B82F6'
    };

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTag),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const createdTag = data.data.tag;
        setAvailableTags(prev => [...prev, createdTag]);
        addTag(createdTag);
        setNewTagName('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'เกิดข้อผิดพลาดในการสร้างแท็ก');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('เกิดข้อผิดพลาดในการสร้างแท็ก');
    }
  }, [newTagName, generateSlug, addTag]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/admin/articles/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to upload image');
    }
    // รองรับรูปแบบ response ของ endpoint ปัจจุบัน
    return data.data?.url || data.data?.imageUrl;
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!title.trim()) {
        throw new Error('กรุณาระบุชื่อบทความ');
      }

      if (!slug.trim()) {
        throw new Error('กรุณาระบุ slug');
      }

      if (!excerpt.trim()) {
        throw new Error('กรุณาระบุคำอธิบายสั้น');
      }

      if (!seo.title.trim()) {
        throw new Error('กรุณาระบุ SEO Title');
      }

      if (!seo.description.trim()) {
        throw new Error('กรุณาระบุ SEO Description');
      }

      const articleData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        featuredImage: featuredImage.trim() || undefined,
        content,
        tags: selectedTags,
        author,
        seo: {
          ...seo,
          keywords: seo.keywords.filter(k => k.trim())
        },
        status,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt).toISOString() })
      };

      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        router.push('/admin/articles');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'เกิดข้อผิดพลาดในการสร้างบทความ');
      }
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการสร้างบทความ');
    } finally {
      setLoading(false);
    }
  }, [title, slug, excerpt, featuredImage, content, selectedTags, author, seo, status, scheduledAt, router]);

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่ได้รับอนุญาต</h1>
          <p className="text-gray-600">คุณไม่มีสิทธิ์ในการสร้างบทความ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">สร้างบทความใหม่</h1>
            <p className="text-gray-600 mt-2">สร้างและจัดการเนื้อหาบทความของคุณ</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showPreview ? 'แก้ไข' : 'ดูตัวอย่าง'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกบทความ'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showPreview ? (
        // Preview Mode
        <div className="bg-white rounded-xl shadow-sm p-8">
          <article className="prose max-w-none">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{title || 'ชื่อบทความ'}</h1>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTags.map(tag => (
                    <span
                      key={tag.slug}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xl text-gray-600">{excerpt || 'คำอธิบายสั้น'}</p>
              {featuredImage && (
                <div className="mt-6">
                  <img src={featuredImage} alt={title} className="w-full rounded-lg" />
                </div>
              )}
            </header>

            <div className="space-y-6">
              {content.map(block => (
                <div key={block.id}>
                  {/* Render preview of content blocks */}
                  {block.type === 'text' && (
                    <p className={`${
                      block.styles.alignment === 'center' ? 'text-center' :
                      block.styles.alignment === 'right' ? 'text-right' : 'text-left'
                    } ${
                      block.styles.fontSize === 'small' ? 'text-sm' :
                      block.styles.fontSize === 'large' ? 'text-lg' :
                      block.styles.fontSize === 'xlarge' ? 'text-2xl' : 'text-base'
                    } ${block.styles.fontWeight === 'bold' ? 'font-bold' : 'font-normal'}`}
                    style={{ color: block.styles.color, backgroundColor: block.styles.backgroundColor }}
                    >
                      {(block.content as any).text}
                    </p>
                  )}
                  {/* Add other block type previews as needed */}
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : (
        // Edit Mode
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลพื้นฐาน</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อบทความ *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ระบุชื่อบทความ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="url-friendly-slug"
                    pattern="[a-z0-9\-]+"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คำอธิบายสั้น *
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => handleExcerptChange(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="คำอธิบายสั้นๆ เกี่ยวกับบทความ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปภาพหน้าปก
                  </label>
                  <input
                    type="url"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.winrichdynamic.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">เนื้อหาบทความ</h2>
              </div>
              <AdvancedRichTextEditor
                content={content}
                onChange={setContent}
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">การเผยแพร่</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!canPublish && status !== 'draft'}
                  >
                    <option value="draft">แบบร่าง</option>
                    {canPublish && <option value="published">เผยแพร่</option>}
                    <option value="archived">เก็บถาวร</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    กำหนดเผยแพร่ (ไม่บังคับ)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">แท็ก</h3>
              
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag.slug}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTag(tag.slug)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Existing Tag */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกแท็กที่มีอยู่
                </label>
                <select
                  onChange={(e) => {
                    const tag = availableTags.find(t => t.slug === e.target.value);
                    if (tag) {
                      addTag(tag);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingTags}
                >
                  <option value="">เลือกแท็ก...</option>
                  {availableTags
                    .filter(tag => !selectedTags.find(t => t.slug === tag.slug))
                    .map(tag => (
                      <option key={tag.slug} value={tag.slug}>
                        {tag.name} ({tag.articleCount})
                      </option>
                    ))}
                </select>
              </div>

              {/* Create New Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สร้างแท็กใหม่
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อแท็กใหม่..."
                  />
                  <button
                    onClick={createNewTag}
                    disabled={!newTagName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">การตั้งค่า SEO</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title *
                  </label>
                  <input
                    type="text"
                    value={seo.title}
                    onChange={(e) => setSeo(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อสำหรับ SEO..."
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{seo.title.length}/60 ตัวอักษร</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description *
                  </label>
                  <textarea
                    value={seo.description}
                    onChange={(e) => setSeo(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="คำอธิบายสำหรับ SEO..."
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{seo.description.length}/160 ตัวอักษร</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (คั่นด้วยคอมม่า)
                  </label>
                  <input
                    type="text"
                    value={seo.keywords.join(', ')}
                    onChange={(e) => setSeo(prev => ({ 
                      ...prev, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="คำสำคัญ1, คำสำคัญ2, ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OG Image
                  </label>
                  <input
                    type="url"
                    value={seo.ogImage || ''}
                    onChange={(e) => setSeo(prev => ({ ...prev, ogImage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.winrichdynamic.com/og-image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Author Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ผู้เขียน</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อผู้เขียน
                  </label>
                  <input
                    type="text"
                    value={author.name}
                    onChange={(e) => setAuthor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อีเมลผู้เขียน
                  </label>
                  <input
                    type="email"
                    value={author.email}
                    onChange={(e) => setAuthor(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}