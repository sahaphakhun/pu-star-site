'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  _id: string;
  postId: string;
  message: string;
  postType: string;
  createdTime: string;
  automation: {
    enabled: boolean;
    commentReply: {
      enabled: boolean;
    };
    privateMessage: {
      enabled: boolean;
    };
  };
  stats: {
    commentsCount: number;
    messagesCount: number;
  };
}

interface Stats {
  overview: {
    totalPosts: number;
    activePosts: number;
    totalComments: number;
    repliedComments: number;
    sentMessages: number;
  };
  recent: {
    comments: number;
    messages: number;
  };
}

export default function FacebookAutomationPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [page]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/admin/facebook-automation/posts?page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/facebook-automation/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleAutomation = async (postId: string, enabled: boolean) => {
    try {
      const post = posts.find((p) => p.postId === postId);
      if (!post) return;

      const res = await fetch(`/api/admin/facebook-automation/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation: {
            ...post.automation,
            enabled: !enabled,
          },
        }),
      });

      if (res.ok) {
        fetchPosts();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Facebook Automation</h1>
        <p className="text-gray-600">
          จัดการการตอบคอมเมนต์และส่งข้อความอัตโนมัติ
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">โพสต์ทั้งหมด</div>
            <div className="text-2xl font-bold">{stats.overview.totalPosts}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">เปิดใช้งาน</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.overview.activePosts}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-600">คอมเมนต์ทั้งหมด</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.overview.totalComments}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <div className="text-sm text-purple-600">ตอบกลับแล้ว</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.overview.repliedComments}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg shadow">
            <div className="text-sm text-orange-600">ส่งข้อความแล้ว</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.overview.sentMessages}
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">รายการโพสต์</h2>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>ยังไม่มีโพสต์ในระบบ</p>
            <p className="text-sm mt-2">
              โพสต์จะถูกเพิ่มอัตโนมัติเมื่อมีคนคอมเมนต์
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {post.postType}
                      </span>
                      {post.automation.enabled ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-2 line-clamp-2">{post.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>💬 {post.stats.commentsCount} คอมเมนต์</span>
                      <span>✉️ {post.stats.messagesCount} ข้อความ</span>
                      <span>
                        📅 {new Date(post.createdTime).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() =>
                        toggleAutomation(post.postId, post.automation.enabled)
                      }
                      className={`px-3 py-1 rounded text-sm ${
                        post.automation.enabled
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {post.automation.enabled ? 'ปิด' : 'เปิด'}
                    </button>
                    <Link
                      href={`/admin/facebook-automation/${post.postId}`}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      ตั้งค่า
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span className="text-sm text-gray-600">
              หน้า {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

