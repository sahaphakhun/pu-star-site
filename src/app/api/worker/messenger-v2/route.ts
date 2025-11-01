import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MessengerConversation from '@/models/MessengerConversation';
import MessengerUser from '@/models/MessengerUser';
import AIContextBuilder from '@/utils/ai-context-builder';
import { buildSystemInstructions } from '@/utils/openai-utils';
import { sendMessage } from '@/utils/messenger';

export const maxDuration = 60;

/**
 * Messenger Worker V2
 * รองรับ MessengerConversation และ AI Context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { psid, message, messageId } = body;

    console.log('[MessengerWorkerV2] Received:', { psid, message, messageId });

    await dbConnect();

    // Get conversation
    let conversation = await MessengerConversation.findOne({ psid });

    // Get user settings
    const user = await MessengerUser.findOne({ psid });
    const aiEnabled = user?.aiEnabled ?? true;
    const filterDisabled = user?.filterDisabled ?? false;

    if (!aiEnabled) {
      console.log('[MessengerWorkerV2] AI disabled for user');
      return NextResponse.json({ status: 'ai_disabled' });
    }

    if (!conversation) {
      // สร้าง conversation ใหม่ (กรณีทักมาเอง ไม่ผ่านคอมเมนต์)
      conversation = await MessengerConversation.create({
        psid,
        userId: user?.userId,
        messages: [],
        isActive: true,
        lastMessageAt: new Date(),
        messageCount: 0,
      });
    }

    // สร้าง conversation history
    const history: any[] = [];

    // ตรวจสอบว่ามี auto reply ล่าสุดที่มี source หรือไม่
    const latestSourceMessage = AIContextBuilder.findLatestSourceMessage(
      conversation.messages
    );

    let contextInserted = false;

    for (const msg of conversation.messages) {
      // ถ้าเจอ auto reply ที่มี source → แทรกบริบทก่อน
      if (
        !contextInserted &&
        msg.isAutoReply &&
        msg.source &&
        latestSourceMessage &&
        msg._id.equals(latestSourceMessage._id)
      ) {
        // แทรก user message ที่มีบริบท
        const contextMessage = AIContextBuilder.buildContextMessage(msg.source);
        if (contextMessage) {
          history.push({
            role: 'user',
            content: contextMessage,
          });
        }
        contextInserted = true;
      }

      // เพิ่มข้อความปกติ
      if (msg.role !== 'system') {
        history.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    console.log('[MessengerWorkerV2] Calling AI with', history.length, 'history messages');

    // Build system instructions
    const systemInstructions = await buildSystemInstructions();

    // Call AI (ใช้ getAssistantResponse ที่มีอยู่แล้ว)
    const { getAssistantResponse } = await import('@/utils/openai-utils');
    const aiResponse = await getAssistantResponse(
      systemInstructions,
      history,
      message,
      psid
    );

    const filteredResponse = aiResponse;

    // 7. Save to conversation
    await MessengerConversation.updateOne(
      { psid },
      {
        $push: {
          messages: [
            {
              role: 'user',
              content: message,
              timestamp: new Date(),
              messageId,
              isAutoReply: false,
            },
            {
              role: 'assistant',
              content: filteredResponse,
              timestamp: new Date(),
              isAutoReply: false,
            },
          ],
        },
        $set: {
          lastMessageAt: new Date(),
        },
        $inc: {
          messageCount: 2,
        },
      }
    );

    // 8. Send reply
    await sendMessage(psid, filteredResponse);

    console.log('[MessengerWorkerV2] Response sent successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[MessengerWorkerV2] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

