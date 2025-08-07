'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import RichTextEditor from '@/components/RichTextEditor';
import { IContentBlock, IArticle, ISEOMetadata, IArticleTag } from '@/models/Article';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string>('');

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [content, setContent] = useState<IContentBlock[]>([]);
  const [availableTags, setAvailableTags] = useState<IArticleTag[]>([]);
  const [tags, setTags] = useState<IArticleTag[]>([]);
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

  const canEdit = hasPermission(PERMISSIONS.ARTICLES_EDIT);
  const canPublish = hasPermission(PERMISSIONS.ARTICLES_PUBLISH);
  const canUploadImages = hasPermission(PERMISSIONS.ARTICLES_IMAGES_UPLOAD);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setArticleId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (articleId && !permissionsLoading) {
      if (!canEdit) {
        setError('ไม่มีสิทธิ์แก้ไขบทความ');
        setLoading(false);
        return;
      }
      fetchArticle();
    }
  }, [articleId, canEdit, permissionsLoading]);

  // โหลดแท็กทั้งหมด
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags?limit=200', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.data.tags || []);
        }
      } catch (e) {
        console.error('Error loading tags', e);
      }
    };
    loadTags();
  }, []);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/articles/${articleId}`);
      
      if (!response.ok) {
        const error = await response.json();
        setError(error.error || 'ไม่พบบทความที่ระบุ');
        return;
      }

      const data = await response.json();
      const article: IArticle = data.data.article;

      // Load article data
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt);
      setFeaturedImage(article.featuredImage || '');
      setContent(article.content || []);
      setTags(((article.tags as any[]) || []).map((t: any) => (typeof t === 'string' ? { name: t, slug: t } : t)).filter(Boolean));
      setStatus(article.status);
      setAuthor(article.author || { name: 'ทีมงาน PU STAR', email: '', avatar: '' });
      setSeo(article.seo);
      
      if (article.scheduledAt) {
        const date = new Date(article.scheduledAt);
        setScheduledAt(date.toISOString().slice(0, 16));
      }

    } catch (error) {
      console.error('Error fetching article:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลบทความ');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // Auto-update SEO title if it matches the current title
    if (seo.title === title) {
      setSeo(prev => ({ ...prev, title: newTitle }));
    }
  };

  const handleExcerptChange = (newExcerpt: string) => {
    setExcerpt(newExcerpt);
    // Auto-update SEO description if it matches the current excerpt
    if (seo.description === excerpt) {
      setSeo(prev => ({ ...prev, description: newExcerpt }));
    }
  };

  const addTag = (tag: IArticleTag) => {
    if (!tags.find(t => t.slug === tag.slug)) {
      const updated = [...tags, tag];
      setTags(updated);
      setSeo(prev => ({ ...prev, keywords: updated.map(t => t.name) }));
    }
  };

  const removeTag = (slug: string) => {
    const updated = tags.filter(t => t.slug !== slug);
    setTags(updated);
    setSeo(prev => ({ ...prev, keywords: updated.map(t => t.name) }));
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    const slug = newTagName.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const newTag: IArticleTag = { name: newTagName.trim(), slug } as IArticleTag;
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTag)
      });
      if (response.ok) {
        const data = await response.json();
        const createdTag = data.data.tag as IArticleTag;
        setAvailableTags(prev => [...prev, createdTag]);
        addTag(createdTag);
        setNewTagName('');
      } else {
        const err = await response.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการสร้างแท็ก');
      }
    } catch (e) {
      console.error('create tag error', e);
      alert('เกิดข้อผิดพลาดในการสร้างแท็ก');
    }
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    if (!canUploadImages) {
      throw new Error('ไม่มีสิทธิ์อัพโหลดรูปภาพ');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/admin/articles/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    }
    return data.data?.url || data.data?.imageUrl;
  }, [canUploadImages]);

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await handleImageUpload(file);
      setFeaturedImage(imageUrl);
      if (!seo.ogImage) {
        setSeo(prev => ({ ...prev, ogImage: imageUrl }));
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent, newStatus?: 'draft' | 'published' | 'archived') => {
    e.preventDefault();
    
    if (!canEdit) {
      setError('ไม่มีสิทธิ์แก้ไขบทความ');
      return;
    }

    const finalStatus = newStatus || status;
    
    if (finalStatus === 'published' && !canPublish) {
      setError('ไม่มีสิทธิ์เผยแพร่บทความ');
      return;
    }

    // Validation
    if (!title.trim()) {
      setError('กรุณาระบุชื่อบทความ');
      return;
    }

    if (!slug.trim()) {
      setError('กรุณาระบุ slug');
      return;
    }

    if (!excerpt.trim()) {
      setError('กรุณาระบุคำอธิบายสั้น');
      return;
    }

    if (!seo.title.trim()) {
      setError('กรุณาระบุ SEO Title');
      return;
    }

    if (!seo.description.trim()) {
      setError('กรุณาระบุ SEO Description');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const articleData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        featuredImage: featuredImage || undefined,
        content,
        tags,
        author,
        seo,
        status: finalStatus,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) })
      };

      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('แก้ไขบทความสำเร็จ');
        router.push('/admin/articles');
      } else {
        const error = await response.json();
        setError(error.error || 'เกิดข้อผิดพลาดในการแก้ไขบทความ');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  กลับ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">แก้ไขบทความ</h1>
        <p className="text-gray-600">แก้ไขบทความ: {title}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบทความ *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ระบุชื่อบทความ"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="url-friendly-slug"
                    pattern="[a-z0-9\-]+"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">URL: /articles/{slug}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบายสั้น *</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => handleExcerptChange(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="คำอธิบายสั้นของบทความ (จะแสดงในหน้ารายการ)"
                    maxLength={500}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{excerpt.length}/500 ตัวอักษร</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพหลัก</label>
                  <div className="space-y-2">
                    {featuredImage && (
                      <div className="relative">
                        <img
                          src={featuredImage}
                          alt="Featured"
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFeaturedImage('')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">เนื้อหาบทความ</h2>
              <RichTextEditor
                content={content}
                onChange={setContent}
                onImageUpload={canUploadImages ? handleImageUpload : undefined}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">การเผยแพร่</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="draft">ร่าง</option>
                    {canPublish && <option value="published">เผยแพร่</option>}
                    <option value="archived">เก็บถาวร</option>
                  </select>
                </div>

                {canPublish && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">กำหนดเวลาเผยแพร่</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">แท็ก</h2>
              {tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag.slug} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.slug)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">เลือกแท็กที่มีอยู่</label>
                <select
                  onChange={(e) => {
                    const tag = availableTags.find(t => t.slug === e.target.value);
                    if (tag) addTag(tag);
                    e.currentTarget.value = '';
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">เลือกแท็ก...</option>
                  {availableTags
                    .filter(t => !tags.find(tt => tt.slug === t.slug))
                    .map(t => (
                      <option key={t.slug} value={t.slug}>{t.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สร้างแท็กใหม่</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ชื่อแท็กใหม่..."
                  />
                  <button
                    type="button"
                    onClick={createNewTag}
                    disabled={!newTagName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>
            </div>

            {/* เดิมมีส่วนแท็กแบบข้อความ ถูกแทนที่ด้วยส่วนแท็กด้านบน */}

            {/* Author */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">ผู้เขียน</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้เขียน</label>
                  <input
                    type="text"
                    value={author.name}
                    onChange={(e) => setAuthor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                  <input
                    type="email"
                    value={author.email || ''}
                    onChange={(e) => setAuthor(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">SEO</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title *</label>
                  <input
                    type="text"
                    value={seo.title}
                    onChange={(e) => setSeo(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={60}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{seo.title.length}/60 ตัวอักษร</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description *</label>
                  <textarea
                    value={seo.description}
                    onChange={(e) => setSeo(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={160}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{seo.description.length}/160 ตัวอักษร</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Open Graph Title</label>
                  <input
                    type="text"
                    value={seo.ogTitle || ''}
                    onChange={(e) => setSeo(prev => ({ ...prev, ogTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={60}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Open Graph Description</label>
                  <textarea
                    value={seo.ogDescription || ''}
                    onChange={(e) => setSeo(prev => ({ ...prev, ogDescription: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={160}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
                  <input
                    type="url"
                    value={seo.canonicalUrl || ''}
                    onChange={(e) => setSeo(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://www.winrichdynamic.com/articles/slug"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              บันทึกร่าง
            </button>
            
            {canPublish && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'published')}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={saving}
              >
                เผยแพร่
              </button>
            )}
            
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}