// =============================
// OpenAI Integration Utilities
// =============================
// NOTE: ไฟล์นี้ถูกสร้างปรับปรุงให้สอดคล้องกับฉบับ Express แรก
// - ใช้ Service Account (JWT) กับ Google Docs/Sheets
// - โหลดทุกแท็บของชีตและ map เป็น Array<Object> ตามหัวตาราง
// - รวม Docs+Sheets เข้า system prompt
// - รองรับ Vision (content เป็น array ที่มี image_url)
// - จำกัดประวัติ 20 รายการ ตัด [cut] ไม่เกิน 10 ช่วง
// - รีเฟรช cache Google ทุก 1 ชม.
// - คงการฝังคีย์ Google ตามคำขอผู้ใช้ (ไม่ย้ายไป ENV)

export const runtime = 'nodejs';

// ---------- ENV / CONFIG ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MAIN_MODEL = process.env.OPENAI_MAIN_MODEL || 'gpt-4.1-mini';

// Google Service Account (คงไว้ในไฟล์นี้ตามคำขอ)
const GOOGLE_CLIENT_EMAIL = "aitar-888@eminent-wares-446512-j8.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGhyeINArKZgaV\nitEcK+o89ilPYeRNTNZgJT7VNHB5hgNLLeAcFLJ7IlCIqTLMoJEnnoDQil6aKaz8\nExVL83uSXRrzk4zQvtt3tIP31+9wOCb9D4ZGWfVP1tD0qdD4WJ1qqg1j1/8879pH\nUeQGEMuCnyVbcQ3GbYQjyYb3wEz/Qv7kMVggF+MIaGGw2NQwM0XcufSFtyxvvX2S\nb8uGc1A8R+Dn/tmcgMODhbtEgcMg6yXI5Y26MPfDjVrEbk0lfCr7IGFJX4ASYeKl\n0jhm0RGb+aya2cb55auLN3VPO5MQ+cOp8gHBf5GiC/YgF1gbRgF5b7LgmENBxSfH\nb3WVQodLAgMBAAECggEACKB14M7LdekXZHyAQrZL0EitbzQknLv33Xyw2B3rvJ7M\nr4HM/nC4eBj7y+ciUc8GZQ+CWc2GzTHTa66+mwAia1qdYbPp3LuhGM4Leq5zn/o+\nA3rJuG6PS4qyUMy89msPXW5fSj/oE535QREiFKYP2dtlia2GI4xoag+x9uZwfMUO\nWKEe7tiUoZQEiGhwtjLq9lyST4kGGmlhNee9OyhDJcw4uCt8Cepr++hMDleWUF6c\nX0nbGmoSS0sZ5Boy8ATMhw/3luaOAlTUEz/nVDvbbWlNL9etwLKiAVw+AQXsPHNW\nNWF7gyEIsEi0qSM3PtA1X7IdReRXHqmfiZs0J3qSQQKBgQD1+Yj37Yuqj8hGi5PY\n+M0ieMdGcbUOmJsM1yUmBMV4bfaTiqm504P6DIYAqfDDWeozcHwcdpG1AfFAihEi\nh6lb0qRk8YaGbzvac8mWhwo/jDA5QB97fjFa6uwtlewZ0Er/U3QmOeVVnVC1y1b0\nrbJD5yjvI3ve+gpwAz0glpIMiwKBgQDOnpD7p7ylG4NQunqmzzdozrzZP0L6EZyE\n141st/Hsp9rtO9/ADuH6WhpirQ516l5LLv7mLPA8S9CF/cSdWF/7WlxBPjM8WRs9\nACFNBJIwUfjzPnvECmtsayzRlKuyCAspnNSkzgtdtvf2xI82Z3BGov9goZfu+D4A\n36b1qXsIQQKBgQCO1CojhO0vyjPKOuxL9hTvqmBUWFyBMD4AU8F/dQ/RYVDn1YG+\npMKi5Li/E+75EHH9EpkO0g7Do3AaQNG4UjwWVJcfAlxSHa8Mp2VsIdfilJ2/8KsX\nQ2yXVYh04/Rn/No/ro7oT4AKmcGu/nbstxuncEgFrH4WOOzspATPsn72BwKBgG5N\nBAT0NKbHm0B7bIKkWGYhB3vKY8zvnejk0WDaidHWge7nabkzuLtXYoKO9AtKxG/K\ndNUX5F+r8XO2V0HQLd0XDezecaejwgC8kwp0iD43ZHkmQBgVn+dPB6wSe94coSjj\nyjj4reSnipQ3tmRKsAtldIN3gI5YA3Gf85dtlHqBAoGAD5ePt7cmu3tDZhA3A8f9\no8mNPvqz/WGs7H2Qgjyfc3jUxEGhVt1Su7J1j+TppfkKtJIDKji6rVA9oIjZtpZT\ngxnU6hcYuiwbLh3wGEFIjP1XeYYILudqfWOEbwnxD1RgMkCqfSHf/niWlfiH6p3F\ndnBsLY/qXdKfS/OXyezAm4M=\n-----END PRIVATE KEY-----\n";

const GOOGLE_DOC_ID = '16X8tI1OzQ1yfAKDRehUqnNfbebxeDA7jWH5n844FM1Y';
const INSTRUCTIONS_SPREADSHEET_ID = '1P1nDP9CUtXFkKgW1iAap235V1_UR_1Mtqm5prVKoxf8';

// ---------- In-Memory Cache ----------
let _googleDocInstructions = '';
let _sheetJSON: Array<{ sheetName: string; data: any[] }> = [];
let _lastGoogleDocFetchTime = 0;
let _lastSheetsFetchTime = 0;
const ONE_HOUR_MS = 3_600_000;

interface UserState {
  aiEnabled: boolean;
  autoModeEnabled: boolean;
  history: { role: string; content: string | any[]; timestamp?: Date }[];
}
const _userState = new Map<string, UserState>();

// ---------- Helper ----------
function normalizeRoleContent(role: string = 'user', content: any = '') {
  if (Array.isArray(content)) return { role, content } as const;
  if (typeof content !== 'string') content = JSON.stringify(content);
  return { role, content: content.toString() } as const;
}

function _ensure(userId: string): UserState {
  if (!_userState.has(userId)) {
    _userState.set(userId, { aiEnabled: false, autoModeEnabled: false, history: [] });
  }
  return _userState.get(userId)!;
}

// map header → objects และข้ามแถวว่าง
function parseSheetRowsToObjects(rows: any[] = []) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  const dataRows = rows
    .slice(1)
    .filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''));
  return dataRows.map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((h: string, i: number) => {
      const v = row[i];
      if (v !== undefined && String(v).trim() !== '') {
        const n = Number(v);
        obj[h] = Number.isFinite(n) && String(n) === String(v) ? n : v;
      }
    });
    return obj;
  });
}

// ---------- Google Auth (Service Account JWT) ----------
import { google } from 'googleapis';

const scopes = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

// สร้าง JWT auth client แบบเดียวกับโค้ด Express
function createGoogleAuth() {
  return new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes
  });
}

// ---------- Google Docs ----------
export async function fetchGoogleDocInstructions(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _googleDocInstructions && now - _lastGoogleDocFetchTime < ONE_HOUR_MS) {
    return _googleDocInstructions;
  }
  
  try {
    const auth = createGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    const res = await docs.documents.get({ documentId: GOOGLE_DOC_ID });
    
    const docBody = res.data.body?.content || [];
    let fullText = '';
    
    docBody.forEach((block: any) => {
      if (block.paragraph?.elements) {
        block.paragraph.elements.forEach((elem: any) => {
          if (elem.textRun?.content) {
            fullText += elem.textRun.content;
          }
        });
      }
    });

    _googleDocInstructions = fullText.trim();
    _lastGoogleDocFetchTime = now;
    console.log("[DEBUG] Fetched Google Doc instructions OK.");
    return _googleDocInstructions;
    
  } catch (error) {
    console.error('[Google Docs] Error fetching document:', error);
    // ใช้ข้อมูลเดิมถ้ามี หรือคืนข้อความ fallback
    return _googleDocInstructions || 'Google Docs instructions temporarily unavailable';
  }
}

// ---------- Google Sheets (ทุกแท็บ) ----------
async function _fetchSheetValues(spreadsheetId: string, sheetName: string) {
  try {
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${sheetName}!A:ZZZ`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });
    
    return { values: response.data.values || [] };
  } catch (error) {
    console.error(`[Google Sheets] Error fetching sheet ${sheetName}:`, error);
    return { values: [] as any[] };
  }
}

export async function fetchAllSheetsData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _sheetJSON.length && now - _lastSheetsFetchTime < ONE_HOUR_MS) {
    return _sheetJSON;
  }

  try {
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const { data } = await sheets.spreadsheets.get({ 
      spreadsheetId: INSTRUCTIONS_SPREADSHEET_ID 
    });
    
    const result: Array<{ sheetName: string; data: any[] }> = [];
    
    for (const sheet of data.sheets || []) {
      const sheetName = sheet.properties?.title;
      if (!sheetName) continue;
      
      const { values } = await _fetchSheetValues(INSTRUCTIONS_SPREADSHEET_ID, sheetName);
      const parsed = parseSheetRowsToObjects(values || []);
      if (parsed.length) result.push({ sheetName, data: parsed });
    }

    _sheetJSON = result;
    _lastSheetsFetchTime = now;
    console.log(`[DEBUG] Fetched ${result.length} sheets data OK.`);
    return result;
    
  } catch (error) {
    console.error('[Google Sheets] Error in fetchAllSheetsData:', error);
    // ใช้ข้อมูลเดิมถ้ามี หรือคืน array ว่าง
    return _sheetJSON.length > 0 ? _sheetJSON : [];
  }
}

// ---------- Google Extra (Docs+Sheets) ----------
export async function getGoogleExtraData() {
  try {
    const [docText, sheetsData] = await Promise.allSettled([
      fetchGoogleDocInstructions(),
      fetchAllSheetsData()
    ]);
    
    return { 
      googleDocInstructions: docText.status === 'fulfilled' ? docText.value : 'Google Docs instructions temporarily unavailable',
      sheets: sheetsData.status === 'fulfilled' ? sheetsData.value : []
    };
  } catch (error) {
    console.error('[Google Extra] Error fetching data:', error);
    return {
      googleDocInstructions: 'Google Docs instructions temporarily unavailable',
      sheets: []
    };
  }
}

// ---------- System Instructions (สไตล์ฉบับแรก) ----------
export function buildSystemInstructions(extraNote: string = 'Rules about images, privacy, etc...') {
  try {
    const sheetsDataString = _sheetJSON && _sheetJSON.length > 0 
      ? JSON.stringify(_sheetJSON, null, 2) 
      : 'No additional sheet data available';
      
    return `
${_googleDocInstructions || 'Google Docs instructions temporarily unavailable'}

Below is additional data from Google Sheets (INSTRUCTIONS) - all tabs:
---
${sheetsDataString}

${extraNote}
`.trim();
  } catch (error) {
    console.error('[buildSystemInstructions] Error:', error);
    return `
${_googleDocInstructions || 'Google Docs instructions temporarily unavailable'}

${extraNote}
`.trim();
  }
}

// ปลั๊กอินแบบ user-aware (ถ้าต้องใช้)
export async function buildSystemInstructionsForUser(userObj: any = {}, extraData: any = '') {
  const base = buildSystemInstructions(
    typeof extraData === 'object' ? JSON.stringify(extraData, null, 2) : String(extraData || '')
  );
  const userInfo = JSON.stringify(
    {
      userId: userObj.userId,
      name: userObj.name,
      totalPurchase: userObj.totalPurchase,
      aiEnabled: userObj.aiEnabled
    },
    null,
    2
  );
  return `${base}\n---------------------------\n(Additional user info)\n${userInfo}\n---------------------------`;
}

// ---------- OpenAI ----------
async function callOpenAI(
  messages: Array<{ role: string; content: string | any[] }>,
  model: string = OPENAI_MAIN_MODEL
) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('<YOUR_')) {
    throw new Error('OPENAI_API_KEY not set');
  }
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = JSON.stringify({ model, temperature: 0.3, store: true, messages });
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` } as any;
  const response = await fetch(url, { method: 'POST', headers, body });
  if (!response.ok) {
    const errText = await response.text();
    const err: any = new Error(`OpenAI HTTP ${response.status}: ${errText}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export async function getAssistantResponse(
  systemInstructions: string,
  history: Array<{ role: string; content: string | any[] }> = [],
  userContent: string | any[] = '',
  userId?: string
) {
  try {
    // รีเฟรช Google cache (TTL 1 ชม.) ด้วย error handling
    await Promise.allSettled([
      fetchGoogleDocInstructions(), 
      fetchAllSheetsData()
    ]);

    // ใช้ enhanced system instructions ที่มี fallback
    const enhancedSystem = await buildEnhancedSystemInstructions(systemInstructions);
    const messages: Array<{ role: string; content: string | any[] }> = [
      normalizeRoleContent('system', enhancedSystem),
      ...history.map((h) => normalizeRoleContent(h.role, h.content))
    ];

    const thNow = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    if (Array.isArray(userContent)) {
      // Vision: แทรก timestamp เป็น text element แรก
      const arr = [...userContent];
      if (!arr.length || !(arr[0] && arr[0].type === 'text')) {
        arr.unshift({ type: 'text', text: `เวลาปัจจุบัน: ${thNow}` });
      } else {
        arr[0] = { ...arr[0], text: `เวลาปัจจุบัน: ${thNow}\n${arr[0].text || ''}` };
      }
      messages.push(normalizeRoleContent('user', arr));
    } else {
      messages.push(normalizeRoleContent('user', `${userContent}\n\nเวลาปัจจุบัน: ${thNow}`));
    }

    const json = await callOpenAI(messages);
    let assistantReply = json?.choices?.[0]?.message?.content ?? '';
    if (typeof assistantReply !== 'string') assistantReply = JSON.stringify(assistantReply);

    assistantReply = assistantReply.replace(/\[cut\]{2,}/g, '[cut]');
    const parts = assistantReply.split('[cut]');
    if (parts.length > 10) assistantReply = parts.slice(0, 10).join('[cut]');
    return assistantReply.trim();
    
  } catch (error) {
    console.error('[getAssistantResponse] Error:', error);
    
    // Fallback response เมื่อเกิดข้อผิดพลาด
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return 'ขออภัยค่ะ ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่ค่ะ';
    }
    
    return 'ขออภัยค่ะ เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งค่ะ';
  }
}

// ---------- AI Toggle ----------
export async function enableAIForUser(userId: string) {
  _ensure(userId).aiEnabled = true;
}
export async function disableAIForUser(userId: string) {
  _ensure(userId).aiEnabled = false;
}
export async function isAIEnabled(userId: string) {
  return _ensure(userId).aiEnabled !== false;
}
export async function addHistory(userId: string, role: string, content: string | any[]) {
  const st = _ensure(userId);
  st.history.push({ role, content });
  if (st.history.length > 20) st.history.shift();
}
export async function getHistory(userId: string) {
  return _ensure(userId).history;
}
export async function clearChatHistory(userId: string) {
  _ensure(userId).history = [];
  return true;
}

// ---------- Enhanced DB-backed helpers (คงโครงสร้างเดิม) ----------
export async function enableAutoModeForUser(psid: string): Promise<void> {
  const state = _ensure(psid);
  state.autoModeEnabled = true;
  state.aiEnabled = true;
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const MessengerUser = (await import('@/models/MessengerUser')).default;
    await MessengerUser.findOneAndUpdate(
      { psid },
      { autoModeEnabled: true, aiEnabled: true, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (err) {
    console.error('[enableAutoModeForUser] DB error:', err);
  }
}

export async function disableAutoModeForUser(psid: string): Promise<void> {
  const state = _ensure(psid);
  state.autoModeEnabled = false;
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const MessengerUser = (await import('@/models/MessengerUser')).default;
    await MessengerUser.findOneAndUpdate(
      { psid },
      { autoModeEnabled: false, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (err) {
    console.error('[disableAutoModeForUser] DB error:', err);
  }
}

export async function isAutoModeEnabled(psid: string): Promise<boolean> {
  const state = _ensure(psid);
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const MessengerUser = (await import('@/models/MessengerUser')).default;
    const user = await MessengerUser.findOne({ psid }).lean();
    if (user) {
      state.autoModeEnabled = (user as any).autoModeEnabled || false;
      return (user as any).autoModeEnabled || false;
    }
  } catch (err) {
    console.error('[isAutoModeEnabled] DB error:', err);
  }
  return state.autoModeEnabled;
}

export async function addToConversationHistory(
  psid: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<void> {
  const state = _ensure(psid);
  const message = { role, content, timestamp: new Date() };
  state.history.push(message);
  if (state.history.length > 20) state.history = state.history.slice(-20);

  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const MessengerUser = (await import('@/models/MessengerUser')).default;
    await MessengerUser.findOneAndUpdate(
      { psid },
      {
        $push: {
          conversationHistory: { $each: [message], $slice: -20 }
        },
        updatedAt: new Date()
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[addToConversationHistory] DB error:', err);
  }
}

export async function getConversationHistory(
  psid: string
): Promise<Array<{ role: string; content: string | any[]; timestamp?: Date }>> {
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const MessengerUser = (await import('@/models/MessengerUser')).default;
    const user = await MessengerUser.findOne({ psid }).lean();
    if (user && (user as any).conversationHistory) {
      const state = _ensure(psid);
      state.history = (user as any).conversationHistory;
      return (user as any).conversationHistory;
    }
  } catch (err) {
    console.error('[getConversationHistory] DB error:', err);
  }
  const state = _ensure(psid);
  return state.history;
}

export function buildAutoModeInitialMessage(
  conversationHistory: Array<{ role: string; content: string; timestamp?: Date }>
): string {
  if (conversationHistory.length === 0) {
    return 'สวัสดีค่ะ ยินดีให้บริการค่ะ กรุณาพิมพ์คำถามหรือความต้องการของคุณได้เลยค่ะ';
  }
  const recentMessages = conversationHistory.slice(-5);
  const summary = recentMessages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
  return `สวัสดีค่ะ ยินดีให้บริการค่ะ\n\nจากที่คุยกันก่อนหน้านี้:\n${summary}\n\nกรุณาพิมพ์คำถามหรือความต้องการเพิ่มเติมได้เลยค่ะ`;
}

export async function getEnhancedConversationHistory(
  psid: string
): Promise<Array<{ role: string; content: string | any[]; timestamp?: Date }>> {
  try {
    const dbHistory = await getConversationHistory(psid);
    if (dbHistory && dbHistory.length > 0) return dbHistory;
    const state = _ensure(psid);
    return state.history;
  } catch (err) {
    console.error('[getEnhancedConversationHistory] error:', err);
    const state = _ensure(psid);
    return state.history;
  }
}

export async function addToConversationHistoryWithContext(
  psid: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  context?: string
): Promise<void> {
  const timestamp = new Date();
  const message: any = { role, content, timestamp, context: context || undefined };
  const state = _ensure(psid);
  state.history.push(message);
  if (state.history.length > 30) state.history = state.history.slice(-30);

  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const MessengerUser = (await import('@/models/MessengerUser')).default;
    await MessengerUser.findOneAndUpdate(
      { psid },
      {
        $push: {
          conversationHistory: { $each: [message], $slice: -30 }
        },
        updatedAt: new Date()
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[addToConversationHistoryWithContext] DB error:', err);
  }
}

// รีเฟรช cache Google
export async function refreshGoogleDataCache(): Promise<void> {
  try {
    _googleDocInstructions = '';
    _sheetJSON = [];
    _lastGoogleDocFetchTime = 0;
    _lastSheetsFetchTime = 0;
    await getGoogleExtraData();
  } catch (error) {
    console.error('[refreshGoogleDataCache] Error:', error);
    // ไม่ต้องทำอะไร เพียงแค่ log error
  }
}

// ---------- Auto Mode with AI Response ----------
export async function enableAutoModeAndRespond(
  psid: string,
  question: string
): Promise<string> {
  // เปิดโหมดอัตโนมัติ
  await enableAutoModeForUser(psid);
  
  // ดึงประวัติการสนทนา
  const conversationHistory = await getConversationHistory(psid);
  
  // สร้าง system instructions และเรียก AI
  const systemInstructions = await buildSystemInstructions('Basic');
  const answer = await getAssistantResponse(systemInstructions, conversationHistory, question);
  
  // เพิ่มข้อความ AI ลงในประวัติ
  await addToConversationHistory(psid, 'assistant', answer);
  
  return answer;
}

// ---------- Google API Status Check ----------
export async function checkGoogleAPIStatus(): Promise<{
  docs: boolean;
  sheets: boolean;
  overall: boolean;
}> {
  try {
    const [docsResult, sheetsResult] = await Promise.allSettled([
      fetchGoogleDocInstructions(true),
      fetchAllSheetsData(true)
    ]);
    
    const docs = docsResult.status === 'fulfilled' && docsResult.value !== 'Google Docs instructions temporarily unavailable';
    const sheets = sheetsResult.status === 'fulfilled' && Array.isArray(sheetsResult.value) && sheetsResult.value.length > 0;
    
    return {
      docs,
      sheets,
      overall: docs || sheets
    };
  } catch (error) {
    console.error('[checkGoogleAPIStatus] Error:', error);
    return { docs: false, sheets: false, overall: false };
  }
}

// ---------- Fallback Mode ----------
export function isFallbackMode(): boolean {
  return !_googleDocInstructions || _sheetJSON.length === 0;
}

// ---------- Fallback Instructions ----------
export function getFallbackInstructions(): string {
  return `
คุณเป็น AI Assistant ที่ให้บริการลูกค้าของบริษัท PU Star

หน้าที่หลัก:
- ตอบคำถามเกี่ยวกับผลิตภัณฑ์และบริการ
- ให้คำแนะนำเกี่ยวกับการใช้งานผลิตภัณฑ์
- ช่วยเหลือลูกค้าในเรื่องต่างๆ
- ให้ข้อมูลเกี่ยวกับราคาและการสั่งซื้อ

หากคุณไม่แน่ใจในข้อมูลใดๆ กรุณาบอกลูกค้าว่าจะติดต่อเจ้าหน้าที่เพื่อยืนยันข้อมูลที่ถูกต้อง

กรุณาตอบคำถามลูกค้าด้วยความสุภาพและเป็นมิตร
`.trim();
}

// ---------- Enhanced System Instructions with Fallback ----------
export async function buildEnhancedSystemInstructions(extraNote: string = 'Rules about images, privacy, etc...') {
  try {
    // ตรวจสอบสถานะ Google API
    const apiStatus = await checkGoogleAPIStatus();
    
    if (apiStatus.overall) {
      // ใช้ข้อมูลจาก Google API
      return buildSystemInstructions(extraNote);
    } else {
      // ใช้ fallback instructions
      console.warn('[System Instructions] Using fallback mode - Google API unavailable');
      return `${getFallbackInstructions()}\n\n${extraNote}`;
    }
  } catch (error) {
    console.error('[buildEnhancedSystemInstructions] Error:', error);
    return `${getFallbackInstructions()}\n\n${extraNote}`;
  }
}

// ---------- Refresh Google Data Cache ----------
