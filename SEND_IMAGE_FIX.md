# 🔧 การแก้ไขระบบ [SEND_IMAGE:...] ให้ใช้งานได้

## 📋 **ปัญหาที่พบ**

ระบบ `[SEND_IMAGE:...]` ของเราใช้งานไม่ได้เนื่องจาก:

1. **การเรียกใช้ฟังก์ชันซับซ้อนเกินไป** - ใช้ `sendSmartMessage()` ที่มีการตรวจสอบเงื่อนไขหลายชั้น
2. **การตรวจสอบ URL เข้มงวดเกินไป** - มีการตรวจสอบ domain, protocol, accessibility ที่ซับซ้อน
3. **การจัดการ error ที่ซับซ้อน** - มีการจัดการ error code เฉพาะของ Facebook ที่ไม่จำเป็น

## 🛠️ **การแก้ไขที่ทำ**

### 1. **สร้างฟังก์ชัน `sendTextMessage()` ใหม่**
- เรียบง่ายเหมือนโค้ดตัวอย่างที่คุณให้มา
- ลดความซับซ้อนของการตรวจสอบ
- ใช้ regex pattern เดียวกับโค้ดตัวอย่าง

### 2. **ปรับปรุงฟังก์ชัน `sendImageMessage()`**
- ลดการตรวจสอบ URL ให้เหลือแค่พื้นฐาน
- ลบการตรวจสอบ domain ที่ซับซ้อน
- ลบการตรวจสอบ accessibility ที่ไม่จำเป็น

### 3. **แก้ไขการเรียกใช้ใน `entry.ts`**
- เปลี่ยนจาก `sendSmartMessage()` เป็น `sendTextMessage()`
- ลบการส่ง parameter `includeMenu` ที่ไม่จำเป็น

## 📁 **ไฟล์ที่แก้ไข**

### `src/utils/messenger-utils.ts`
```typescript
// เพิ่มฟังก์ชันใหม่
export async function sendTextMessage(
  recipientId: string, 
  response: string
): Promise<void> {
  // เรียบง่ายเหมือนโค้ดตัวอย่าง
  // แบ่งข้อความเป็นส่วนๆ ตาม [cut]
  // ส่งรูปภาพและข้อความทีละส่วน
}

// ปรับปรุงฟังก์ชันเดิม
async function sendImageMessage(recipientId: string, imageUrl: string): Promise<void> {
  // ลดการตรวจสอบ URL ให้เหลือแค่พื้นฐาน
  // ลบการตรวจสอบ domain ที่ซับซ้อน
}
```

### `src/bot/flows/entry.ts`
```typescript
// เปลี่ยนการ import
import { sendTextMessage, hasCutOrImageCommands } from '@/utils/messenger-utils';

// เปลี่ยนการเรียกใช้
if (hasCutOrImageCommands(answer)) {
  await sendTextMessage(psid, answer); // เรียบง่าย
} else {
  // ส่งข้อความธรรมดา
}
```

## 🧪 **การทดสอบ**

สร้างไฟล์ `src/utils/messenger-test.ts` เพื่อทดสอบระบบ:
- ทดสอบข้อความธรรมดา
- ทดสอบข้อความที่มีรูปภาพ
- ทดสอบข้อความที่มี [cut] และรูปภาพ
- ทดสอบกรณีพิเศษต่างๆ

## ✅ **ผลลัพธ์ที่คาดหวัง**

หลังจากแก้ไขแล้ว ระบบ `[SEND_IMAGE:...]` ควรจะ:

1. **ทำงานได้เหมือนโค้ดตัวอย่าง** - ใช้ logic เดียวกัน
2. **ส่งรูปภาพได้** - แม้ URL จะไม่ใช่ domain ที่รู้จัก
3. **จัดการ error ได้** - ส่งข้อความแจ้งเตือนแทนรูปภาพที่ส่งไม่ได้
4. **ทำงานได้เร็วขึ้น** - ลดการตรวจสอบที่ไม่จำเป็น

## 🔍 **ข้อแตกต่างหลักกับโค้ดตัวอย่าง**

| ด้าน | โค้ดเดิม | โค้ดใหม่ (แก้ไขแล้ว) | โค้ดตัวอย่าง |
|------|----------|---------------------|-------------|
| ฟังก์ชันหลัก | `sendSmartMessage()` | `sendTextMessage()` | `sendTextMessage()` |
| ตรวจสอบ URL | ซับซ้อน (domain, protocol, accessibility) | เรียบง่าย (แค่ http/https) | เรียบง่าย |
| การจัดการ error | ซับซ้อน (error code เฉพาะ) | เรียบง่าย (fallback message) | เรียบง่าย |
| การเรียกใช้ | หลายชั้น | ตรงๆ | ตรงๆ |

## 🚀 **วิธีทดสอบ**

1. **ทดสอบด้วยข้อความที่มีรูปภาพ:**
   ```
   สวัสดีค่ะ [SEND_IMAGE:https://i.imgur.com/example.jpg] ยินดีต้อนรับ
   ```

2. **ทดสอบด้วยข้อความที่มี [cut]:**
   ```
   ส่วนที่ 1 [cut] [SEND_IMAGE:https://img1.jpg] ส่วนที่ 2 [cut] [SEND_IMAGE:https://img2.jpg]
   ```

3. **ตรวจสอบ log** เพื่อดูว่า:
   - ระบบแยกข้อความเป็นส่วนๆ ได้ถูกต้อง
   - ส่งรูปภาพได้สำเร็จ
   - จัดการ error ได้เหมาะสม

## 📝 **หมายเหตุ**

- การแก้ไขนี้ทำให้ระบบเรียบง่ายขึ้นและทำงานได้เหมือนโค้ดตัวอย่าง
- ลดความซับซ้อนที่ไม่จำเป็น แต่ยังคงความปลอดภัยพื้นฐาน
- ระบบจะทำงานได้เร็วขึ้นและมีโอกาสเกิด error น้อยลง
/**
 * openai-to-messenger.js
 * โมดูล: เรียก OpenAI รับ assistantMsg แล้วแตก [cut] และ [image/video tokens] เพื่อส่งเข้า Messenger
 * รองรับโทเคน: [SEND_IMAGE:URL], [IMAGE_SEND:URL], [SEND_VIDEO:URL], [VIDEO_SEND:URL]
 * และรูปแบบแบบขีดล่าง: [IMAGE_SEND_URL] / [VIDEO_SEND_URL]
 */

const util = require('util');
const request = require('request');
const requestPost = util.promisify(request.post);
const { OpenAI } = require('openai');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GRAPH_ENDPOINT = 'https://graph.facebook.com/v12.0/me/messages';

/* ---------- A) OpenAI ---------- */

async function getAssistantResponse(systemInstructions, history, userContent, maxHistoryItems = 20, daysLimit = null) {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // ตัดประวัติแบบง่าย: ใช้ท้ายสุดไม่เกิน maxHistoryItems
  const cleanedHistory = Array.isArray(history) ? history.slice(-maxHistoryItems) : [];

  const messages = [
    { role: 'system', content: systemInstructions || '' },
    ...cleanedHistory,
    normalizeRoleContent('user', userContent, true),
  ];

  const res = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages,
    temperature: 0.3,
    store: true,
  });

  let out = res.choices?.[0]?.message?.content ?? '';
  if (typeof out !== 'string') out = JSON.stringify(out);

  // cleanup
  out = out.replace(/\[cut\]{2,}/g, '[cut]');
  const parts = out.split('[cut]');
  if (parts.length > 10) out = parts.slice(0, 10).join('[cut]');
  return out.trim();
}

function normalizeRoleContent(role, content, addTimestampPrefix = false) {
  const prefix = addTimestampPrefix ? getThaiTimestampPrefix() : '';
  if (typeof content === 'string') return { role, content: prefix + content };
  if (Array.isArray(content)) {
    const arr = [...content];
    if (arr.length > 0 && arr[0].type === 'text' && arr[0].text) arr[0] = { ...arr[0], text: prefix + arr[0].text };
    else arr.unshift({ type: 'text', text: prefix });
    return { role, content: arr };
  }
  return { role, content: prefix + JSON.stringify(content) };
}

function getThaiTimestampPrefix() {
  const th = new Date(Date.now() + 7 * 3600 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `[ข้อความนี้ถูกส่งเมื่อ ${th.getFullYear()}-${pad(th.getMonth() + 1)}-${pad(th.getDate())} ${pad(th.getHours())}:${pad(th.getMinutes())}:${pad(th.getSeconds())} (TH)] `;
}

/* ---------- B) Messenger senders ---------- */

function removeThaiTimestampPrefix(text) {
  return text.replace(/^\[ข้อความนี้ถูกส่งเมื่อ [^\]]+\] /, '');
}

async function sendSimpleTextMessage(userId, text) {
  const reqBody = { recipient: { id: userId }, message: { text: removeThaiTimestampPrefix(text) } };
  await requestPost({ uri: GRAPH_ENDPOINT, qs: { access_token: PAGE_ACCESS_TOKEN }, method: 'POST', json: reqBody });
}

async function sendImageMessage(userId, imageUrl) {
  const reqBody = {
    recipient: { id: userId },
    message: { attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } } },
  };
  await requestPost({ uri: GRAPH_ENDPOINT, qs: { access_token: PAGE_ACCESS_TOKEN }, method: 'POST', json: reqBody });
}

async function sendVideoMessage(userId, videoUrl) {
  const reqBody = {
    recipient: { id: userId },
    message: { attachment: { type: 'video', payload: { url: videoUrl, is_reusable: true } } },
  };
  await requestPost({ uri: GRAPH_ENDPOINT, qs: { access_token: PAGE_ACCESS_TOKEN }, method: 'POST', json: reqBody });
}

/* ---------- C) Parser: [cut], [SEND_IMAGE:], [IMAGE_SEND:], [SEND_VIDEO:], [VIDEO_SEND:] ---------- */

function parseSegmentsWithMedia(raw) {
  const normalized = raw.replace(/\[cut\]{2,}/g, '[cut]');
  let segments = normalized.split('[cut]').map(s => s.trim()).filter(Boolean);
  if (segments.length > 10) segments = segments.slice(0, 10);

  const IMG_COLON = /\[(?:SEND_IMAGE|IMAGE_SEND)\s*:\s*(https?:\/\/[^\]\s]+)\]/gi;
  const VID_COLON = /\[(?:SEND_VIDEO|VIDEO_SEND)\s*:\s*(https?:\/\/[^\]\s]+)\]/gi;

  const IMG_UNDER = /\[(?:SEND_IMAGE|IMAGE_SEND)_(https?:\/\/[^\]\s]+)\]/gi;
  const VID_UNDER = /\[(?:SEND_VIDEO|VIDEO_SEND)_(https?:\/\/[^\]\s]+)\]/gi;

  return segments.map(seg => {
    const images = [];
    const videos = [];

    let s = seg;

    // match colon style
    s = s.replace(IMG_COLON, (_, u) => { images.push(u); return ''; });
    s = s.replace(VID_COLON, (_, u) => { videos.push(u); return ''; });

    // match underscore style
    s = s.replace(IMG_UNDER, (_, u) => { images.push(u); return ''; });
    s = s.replace(VID_UNDER, (_, u) => { videos.push(u); return ''; });

    return { text: s.trim(), images, videos };
  });
}

/* ---------- D) Dispatcher: ส่งผลลัพธ์ถึงผู้ใช้ ---------- */

async function dispatchAssistantReply(userId, assistantMsg) {
  const items = parseSegmentsWithMedia(assistantMsg);

  for (const it of items) {
    for (const img of it.images) {
      try { await sendImageMessage(userId, img); } catch (e) { /* noop */ }
    }
    for (const vid of it.videos) {
      try { await sendVideoMessage(userId, vid); } catch (e) { /* noop */ }
    }
    if (it.text) {
      try { await sendSimpleTextMessage(userId, it.text); } catch (e) { /* noop */ }
    }
  }
}

/* ---------- E) Orchestrator: เรียก OpenAI แล้วส่งเข้า Messenger ---------- */

async function processAndSendFromOpenAI(userId, systemInstructions, history, userContent) {
  const assistantMsg = await getAssistantResponse(systemInstructions, history, userContent);
  await dispatchAssistantReply(userId, assistantMsg);
  return assistantMsg; // เผื่อบันทึกประวัติภายนอก
}

module.exports = {
  getAssistantResponse,
  dispatchAssistantReply,
  processAndSendFromOpenAI,
  // เผย sender เผื่อเรียกตรง
  sendSimpleTextMessage,
  sendImageMessage,
  sendVideoMessage,
};
