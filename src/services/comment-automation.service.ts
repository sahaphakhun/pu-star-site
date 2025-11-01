/**
 * Comment Automation Service
 * จัดการการตอบคอมเมนต์และส่งข้อความอัตโนมัติ
 */

import MessengerConversation from '@/models/MessengerConversation';
import FacebookPost from '@/models/FacebookPost';
import FacebookComment from '@/models/FacebookComment';
import FacebookAutomationLog from '@/models/FacebookAutomationLog';
import { sendMessage, replyToComment } from '@/utils/messenger';

class CommentAutomationService {
  /**
   * ตอบกลับคอมเมนต์
   */
  static async replyToCommentIfEnabled(
    post: any,
    comment: any
  ): Promise<void> {
    if (!post.automation.commentReply.enabled) {
      return;
    }

    try {
      // Render reply text
      const replyText = this.renderTemplate(
        post.automation.commentReply.replyText || '',
        {
          name: comment.fromName,
          comment: comment.message,
        }
      );

      // Reply to comment
      await replyToComment(comment.commentId, replyText);

      // Update comment record
      await FacebookComment.updateOne(
        { commentId: comment.commentId },
        {
          $set: {
            'automation.commentReplied': true,
            'automation.commentReplyText': replyText,
            'automation.commentRepliedAt': new Date(),
          },
        }
      );

      // Log
      await FacebookAutomationLog.create({
        postId: post.postId,
        commentId: comment.commentId,
        action: 'comment_reply',
        status: 'success',
        metadata: { replyText },
      });

      console.log(
        `[CommentAutomation] Replied to comment ${comment.commentId}`
      );
    } catch (error: any) {
      console.error('[CommentAutomation] Failed to reply to comment:', error);

      // Log error
      await FacebookAutomationLog.create({
        postId: post.postId,
        commentId: comment.commentId,
        action: 'comment_reply',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  /**
   * ส่งข้อความส่วนตัวหาลูกค้าที่คอมเมนต์
   */
  static async sendPrivateMessageIfEnabled(
    post: any,
    comment: any,
    psid: string
  ): Promise<void> {
    if (!post.automation.privateMessage.enabled) {
      return;
    }

    try {
      // Render welcome message
      const welcomeMessage = this.renderTemplate(
        post.automation.privateMessage.messageText,
        {
          name: comment.fromName,
          comment: comment.message,
          post_title: post.message.substring(0, 50),
          time: new Date().toLocaleString('th-TH'),
        }
      );

      // Send message
      await sendMessage(psid, welcomeMessage);

      // บันทึกลงประวัติการสนทนา
      await this.saveAutoReplyToConversation(
        psid,
        welcomeMessage,
        post,
        comment
      );

      // Update comment record
      await FacebookComment.updateOne(
        { commentId: comment.commentId },
        {
          $set: {
            'automation.privateMessageSent': true,
            'automation.privateMessageText': welcomeMessage,
            'automation.privateMessageSentAt': new Date(),
            'automation.psid': psid,
          },
        }
      );

      // Update post stats
      await FacebookPost.updateOne(
        { postId: post.postId },
        {
          $inc: { 'stats.messagesCount': 1 },
          $set: { 'stats.lastTriggeredAt': new Date() },
        }
      );

      // Log
      await FacebookAutomationLog.create({
        postId: post.postId,
        commentId: comment.commentId,
        psid,
        action: 'private_message',
        status: 'success',
        metadata: { welcomeMessage },
      });

      console.log(
        `[CommentAutomation] Sent private message to PSID ${psid}`
      );
    } catch (error: any) {
      console.error(
        '[CommentAutomation] Failed to send private message:',
        error
      );

      // Log error
      await FacebookAutomationLog.create({
        postId: post.postId,
        commentId: comment.commentId,
        psid,
        action: 'private_message',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  /**
   * บันทึกข้อความอัตโนมัติลงประวัติการสนทนา
   */
  static async saveAutoReplyToConversation(
    psid: string,
    welcomeMessage: string,
    post: any,
    comment: any
  ): Promise<void> {
    // ตรวจสอบว่ามี Conversation อยู่แล้วหรือไม่
    let conversation = await MessengerConversation.findOne({ psid });

    const autoReplyMessage = {
      role: 'assistant' as const,
      content: welcomeMessage,
      timestamp: new Date(),
      isAutoReply: true,
      source: {
        type: 'post_comment' as const,
        postId: post.postId,
        commentId: comment.commentId,
        commentText: comment.message,
        postContext: {
          message: post.message,
          type: post.postType,
          attachments: post.attachments,
        },
        aiInstructions: post.automation.aiInstructions,
        aiContext: post.automation.aiContext,
        triggeredAt: new Date(),
      },
    };

    if (conversation) {
      // มี Conversation แล้ว → เพิ่มข้อความเข้าไป
      await MessengerConversation.updateOne(
        { psid },
        {
          $push: {
            messages: autoReplyMessage,
          },
          $set: {
            lastMessageAt: new Date(),
          },
          $inc: {
            messageCount: 1,
          },
        }
      );
    } else {
      // ไม่มี Conversation → สร้างใหม่
      await MessengerConversation.create({
        psid,
        userId: null,
        messages: [autoReplyMessage],
        isActive: true,
        lastMessageAt: new Date(),
        messageCount: 1,
      });
    }
  }

  /**
   * Render template
   */
  static renderTemplate(template: string, variables: any): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value || '')
      );
    }
    return result;
  }
}

export default CommentAutomationService;

