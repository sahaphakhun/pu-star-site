'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Post {
  _id: string;
  postId: string;
  message: string;
  postType: string;
  permalink?: string;
  createdTime: string;
  automation: {
    enabled: boolean;
    commentReply: {
      enabled: boolean;
      replyText?: string;
    };
    privateMessage: {
      enabled: boolean;
      messageText: string;
    };
    aiInstructions?: string;
    aiContext?: string;
  };
  stats: {
    commentsCount: number;
    messagesCount: number;
  };
}

export default function PostSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(false);
  const [commentReplyText, setCommentReplyText] = useState('');
  const [privateMessageEnabled, setPrivateMessageEnabled] = useState(false);
  const [privateMessageText, setPrivateMessageText] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiContext, setAiContext] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/admin/facebook-automation/posts/${postId}`);
      const data = await res.json();
      if (data.success) {
        const p = data.data;
        setPost(p);
        setEnabled(p.automation.enabled);
        setCommentReplyEnabled(p.automation.commentReply.enabled);
        setCommentReplyText(p.automation.commentReply.replyText || '');
        setPrivateMessageEnabled(p.automation.privateMessage.enabled);
        setPrivateMessageText(p.automation.privateMessage.messageText || '');
        setAiInstructions(p.automation.aiInstructions || '');
        setAiContext(p.automation.aiContext || '');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/facebook-automation/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation: {
            enabled,
            commentReply: {
              enabled: commentReplyEnabled,
              replyText: commentReplyText,
            },
            privateMessage: {
              enabled: privateMessageEnabled,
              messageText: privateMessageText,
            },
            aiInstructions,
            aiContext,
          },
        }),
      });

      if (res.ok) {
        alert('บันทึกสำเร็จ!');
        router.push('/admin/facebook-automation');
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ไม่พบโพสต์</p>
          <Link
            href="/admin/facebook-automation"
            className="text-blue-600 hover:underline"
          >
            กลับไปหน้ารายการ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/facebook-automation"
          className="text-blue-600 hover:underline text-sm mb-2 inline-block"
        >
          ← กลับ
        </Link>
        <h1 className="text-2xl font-bold mb-2">ตั้งค่า Automation</h1>
        <p className="text-gray-600 text-sm">
          {post.message.substring(0, 100)}
          {post.message.length > 100 && '...'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <div>
              <div className="font-semibold">เปิดใช้งาน Automation</div>
              <div className="text-sm text-gray-600">
                เปิด/ปิดการทำงานอัตโนมัติสำหรับโพสต์นี้
              </div>
            </div>
          </label>
        </div>

        {/* Comment Reply */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={commentReplyEnabled}
              onChange={(e) => setCommentReplyEnabled(e.target.checked)}
              className="w-5 h-5"
              disabled={!enabled}
            />
            <div>
              <div className="font-semibold">ตอบกลับคอมเมนต์</div>
              <div className="text-sm text-gray-600">
                ตอบกลับคอมเมนต์โดยอัตโนมัติ
              </div>
            </div>
          </label>

          {commentReplyEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">
                ข้อความตอบกลับ
              </label>
              <textarea
                value={commentReplyText}
                onChange={(e) => setCommentReplyText(e.target.value)}
                placeholder="ขอบคุณที่สนใจครับ {{name}}!"
                className="w-full p-3 border rounded-lg"
                rows={3}
                disabled={!enabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                ใช้ {'{'}
                {'{'}name{'}'} {'}'} สำหรับชื่อผู้คอมเมนต์
              </p>
            </div>
          )}
        </div>

        {/* Private Message */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={privateMessageEnabled}
              onChange={(e) => setPrivateMessageEnabled(e.target.checked)}
              className="w-5 h-5"
              disabled={!enabled}
            />
            <div>
              <div className="font-semibold">ส่งข้อความส่วนตัว</div>
              <div className="text-sm text-gray-600">
                ส่งข้อความทาง Messenger อัตโนมัติ
              </div>
            </div>
          </label>

          {privateMessageEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">
                ข้อความต้อนรับ
              </label>
              <textarea
                value={privateMessageText}
                onChange={(e) => setPrivateMessageText(e.target.value)}
                placeholder="สวัสดีครับคุณ {{name}}! ขอบคุณที่สนใจสินค้าของเรา..."
                className="w-full p-3 border rounded-lg"
                rows={5}
                disabled={!enabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                ตัวแปรที่ใช้ได้: {'{'}
                {'{'}name{'}'} {'}'} {'{'}
                {'{'}comment{'}'} {'}'} {'{'}
                {'{'}post_title{'}'} {'}'}
              </p>
            </div>
          )}
        </div>

        {/* AI Instructions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <div className="font-semibold mb-1">คำสั่งพิเศษสำหรับ AI</div>
            <div className="text-sm text-gray-600">
              บอก AI ว่าควรตอบอย่างไรเมื่อลูกค้าตอบกลับ
            </div>
          </div>

          <textarea
            value={aiInstructions}
            onChange={(e) => setAiInstructions(e.target.value)}
            placeholder="เช่น: ตอบคำถามเกี่ยวกับโปรโมชั่นวิตามินซี ให้ข้อมูลราคาและส่วนลด..."
            className="w-full p-3 border rounded-lg"
            rows={4}
            disabled={!enabled}
          />
        </div>

        {/* AI Context */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <div className="font-semibold mb-1">ข้อมูลเพิ่มเติมสำหรับ AI</div>
            <div className="text-sm text-gray-600">
              ข้อมูลที่ AI ควรรู้เกี่ยวกับโพสต์นี้
            </div>
          </div>

          <textarea
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            placeholder="เช่น: สินค้า: วิตามินซี 1000mg, ราคา: 299 บาท (ลด 20%), จัดส่งฟรี..."
            className="w-full p-3 border rounded-lg"
            rows={4}
            disabled={!enabled}
          />
        </div>

        {/* Stats */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="font-semibold mb-3">สถิติ</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">คอมเมนต์ทั้งหมด</div>
              <div className="text-2xl font-bold">{post.stats.commentsCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">ส่งข้อความแล้ว</div>
              <div className="text-2xl font-bold">{post.stats.messagesCount}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <Link
            href="/admin/facebook-automation"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ยกเลิก
          </Link>
        </div>
      </div>
    </div>
  );
}

