import crypto from 'crypto';
import { sendFilteredMessage, hasCutOrImageCommands, sendTextMessage } from '@/utils/messenger-utils';
import { 
  addToConversationHistory, 
  getConversationHistory, 
  buildSystemInstructions, 
  getAssistantResponse, 
  addToConversationHistoryWithContext
} from '@/utils/openai-utils';
import { sendTypingOn } from '@/utils/messenger';

type UserContent = string | any[];

type BatchState = {
  mids: Set<string>;
  contents: UserContent[];
  timer?: NodeJS.Timeout;
  lastBatchId?: string;
};

const DEBOUNCE_MS = 15_000; // 15 วินาที ตามที่ต้องการ

const pending = new Map<string, BatchState>(); // key = psid

function hashIds(ids: string[]): string {
  const h = crypto.createHash('sha256');
  ids.forEach((id) => h.update(id + '\n'));
  return h.digest('hex');
}

async function processBatch(psid: string) {
  const state = pending.get(psid);
  if (!state) return;

  // ถ้ายังมี timer และยังไม่ถึงเวลา ให้รอ (ป้องกันกรณีเรียกซ้ำ)
  if (state.timer) {
    // หากมีใครเรียกซ้อน ให้ข้ามและปล่อยให้ timer ทำงานตามปกติ
    return;
  }

  const mids = Array.from(state.mids);
  const contents = state.contents.slice();

  if (contents.length === 0 || mids.length === 0) {
    return; // ไม่มีอะไรต้องทำ
  }

  const batchId = hashIds(mids);
  if (batchId === state.lastBatchId) {
    // กันยิงซ้ำจากเหตุกรณีพิเศษ
    state.mids.clear();
    state.texts.length = 0;
    return;
  }

  try {
    // รวมคอนเทนต์ของผู้ใช้ทั้งหมด โดยรองรับทั้งข้อความและมัลติมีเดีย
    let combined: UserContent;
    const hasAnyArray = contents.some((c) => Array.isArray(c));
    if (!hasAnyArray) {
      combined = (contents as string[]).join('\n');
      await addToConversationHistory(psid, 'user', combined as string);
    } else {
      const arr: any[] = [];
      for (const c of contents) {
        if (Array.isArray(c)) arr.push(...c);
        else if (typeof c === 'string') arr.push({ type: 'text', text: c });
      }
      combined = arr;
      await addToConversationHistoryWithContext(psid, 'user', combined);
    }
    const history = await getConversationHistory(psid);
    const system = await buildSystemInstructions();
    const answer = await getAssistantResponse(system, history, combined, psid);

    // เก็บคำตอบลงประวัติ
    await addToConversationHistory(psid, 'assistant', answer);

    // ส่งคำตอบครั้งเดียว (รองรับ [cut] / [SEND_IMAGE:...])
    if (hasCutOrImageCommands(answer)) {
      await sendTextMessage(psid, answer);
    } else {
      await sendFilteredMessage(psid, { text: answer });
    }

    // กันซ้ำรอบถัดไป
    state.lastBatchId = batchId;
  } catch (err) {
    console.error('[AI-Batcher] processBatch error', err);
  } finally {
    // เคลียร์รายการที่ประมวลผลแล้ว
    state.mids.clear();
    state.contents.length = 0;
  }
}

export function enqueueAIMessage(psid: string, mid: string | undefined, text: string) {
  if (!psid || !text) return;

  let state = pending.get(psid);
  if (!state) {
    state = { mids: new Set<string>(), contents: [] };
    pending.set(psid, state);
  }

  // กันซ้ำด้วย mid (ถ้ามี)
  const id = mid || `no-mid:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  if (state.mids.has(id)) {
    return; // ข้าม event ซ้ำ
  }
  state.mids.add(id);
  state.contents.push(text);

  // แจ้ง typing ให้ผู้ใช้ทราบว่าระบบกำลังประมวลผล
  try { sendTypingOn(psid); } catch {}

  // รีเซตเวลา 15 วิ ทุกข้อความใหม่ (reset ไม่ใช่ต่อเวลา)
  if (state.timer) {
    clearTimeout(state.timer);
  }
  state.timer = setTimeout(async () => {
    // เคลียร์ตัวชี้ timer ก่อน เพื่อให้ processBatch ทำงานได้
    if (state) state.timer = undefined;
    await processBatch(psid);
  }, DEBOUNCE_MS);
}

// รองรับการเข้าคิวคอนเทนต์มัลติมีเดีย (ข้อความ + รูป)
export function enqueueAIContent(psid: string, mid: string | undefined, content: UserContent) {
  if (!psid || (!content && content !== '')) return;

  let state = pending.get(psid);
  if (!state) {
    state = { mids: new Set<string>(), contents: [] };
    pending.set(psid, state);
  }

  const id = mid || `no-mid:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  if (state.mids.has(id)) {
    return; // ข้าม event ซ้ำ
  }
  state.mids.add(id);
  state.contents.push(content);

  try { sendTypingOn(psid); } catch {}

  if (state.timer) {
    clearTimeout(state.timer);
  }
  state.timer = setTimeout(async () => {
    if (state) state.timer = undefined;
    await processBatch(psid);
  }, DEBOUNCE_MS);
}
