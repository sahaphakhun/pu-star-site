import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FacebookPost from '@/models/FacebookPost';
import FacebookComment from '@/models/FacebookComment';
import CommentAutomationService from '@/services/comment-automation.service';
import { getPSIDFromUserId } from '@/utils/messenger';

/**
 * Facebook Comments Worker
 * ประมวลผล comment events จาก Facebook Webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[CommentWorker] Received:', JSON.stringify(body));

    if (body.object !== 'page') {
      return NextResponse.json({ status: 'ignored' });
    }

    await dbConnect();

    // ประมวลผล entries
    for (const entry of body.entry || []) {
      // ประมวลผล changes (feed events)
      for (const change of entry.changes || []) {
        if (change.field === 'feed') {
          await processCommentEvent(change.value);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[CommentWorker] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * ประมวลผล comment event
 */
async function processCommentEvent(value: any) {
  const { item, verb, comment_id, from, message, post_id, created_time } = value;

  // เฉพาะ comment ใหม่
  if (item !== 'comment' || verb !== 'add') {
    console.log('[CommentWorker] Ignored event:', item, verb);
    return;
  }

  console.log('[CommentWorker] New comment:', {
    comment_id,
    post_id,
    from_id: from?.id,
    from_name: from?.name,
    message,
  });

  try {
    // ตรวจสอบว่ามีโพสต์นี้ในระบบหรือไม่
    let post = await FacebookPost.findOne({ postId: post_id });

    if (!post) {
      console.log('[CommentWorker] Post not found, skipping');
      return;
    }

    // ตรวจสอบว่า automation เปิดอยู่หรือไม่
    if (!post.automation.enabled) {
      console.log('[CommentWorker] Automation disabled for this post');
      return;
    }

    // ตรวจสอบว่ามีคอมเมนต์นี้อยู่แล้วหรือไม่
    let comment = await FacebookComment.findOne({ commentId: comment_id });

    if (comment) {
      console.log('[CommentWorker] Comment already processed');
      return;
    }

    // สร้าง comment record
    comment = await FacebookComment.create({
      commentId: comment_id,
      postId: post_id,
      message: message || '',
      fromId: from?.id,
      fromName: from?.name || 'Unknown',
      createdTime: created_time ? new Date(created_time * 1000) : new Date(),
      automation: {
        commentReplied: false,
        privateMessageSent: false,
      },
    });

    // อัพเดทสถิติโพสต์
    await FacebookPost.updateOne(
      { postId: post_id },
      {
        $inc: { 'stats.commentsCount': 1 },
      }
    );

    // ตอบกลับคอมเมนต์ (ถ้าเปิดใช้งาน)
    if (post.automation.commentReply.enabled) {
      await CommentAutomationService.replyToCommentIfEnabled(post, comment);
    }

    // ส่งข้อความส่วนตัว (ถ้าเปิดใช้งาน)
    if (post.automation.privateMessage.enabled) {
      // ดึง PSID จาก Facebook User ID
      const psid = await getPSIDFromUserId(from?.id);

      if (psid) {
        await CommentAutomationService.sendPrivateMessageIfEnabled(
          post,
          comment,
          psid
        );
      } else {
        console.warn('[CommentWorker] Cannot get PSID for user:', from?.id);
      }
    }

    console.log('[CommentWorker] Comment processed successfully');
  } catch (error: any) {
    console.error('[CommentWorker] Error processing comment:', error);
  }
}

// ตั้งค่า runtime เป็น nodejs เพื่อใช้ database
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds

