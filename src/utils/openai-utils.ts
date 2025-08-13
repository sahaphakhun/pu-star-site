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
const GOOGLE_CLIENT_EMAIL = "winrichdynamic@core-outrider-464721-t3.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfnz5+5CaTKvVm\nQ9YHvPMWQVFQkBinemRJPjtP7GWxWf3m5DXlYYp8aQjLJF7DjqHTgl1RHzdB/U5R\naLoN6X/4Gw6cInexsr8EeDUNyDNkTxEVdc2Yc6MA93KF03Wqe6guk1K7Wx7IgcE3\n2jpTDdntLCjJoL35Fp0DQ3ZNXDVUkVwqO5XbsShwbCVdce8IlyuhT9iJtUaISd+I\nqSAqbG6CoNDy/0rY8CzeMAPj1Rd61a4PBYfB+tpFRjNDcpETewgE5j0EJNSgrOHQ\nyxxM2z/vmI0Uxt59CRhTpib9CLcqEjjGGAdHAocAWv/x1Lnf7Eg2WDLzkyHAv1Pq\nhlBkGiihAgMBAAECggEAB641kzls+glz5iA2w52z+R0RD7GpA7Aj0lvld8Khl867\niK1EDOkuztaqH95TkOcxbmipM/0BaVvihj21hH6qGOLGu5zTKgl+1jRkKzzMR6VY\n/e/Fp8BOJksik8GvU/ya3KqpaiGE/Vy4GkJ9nw1cqpVcVrNeudxb5lknCh0Fkwm5\nxhLEDKb4Cp6YutZR6/xfryLrmEhNXWk5UF801KxWBYF7pgMkjEunzfKiFwHlHMDU\nFyM7eLEs634dfYT+P2DGiNyYezMYMJrNJ41AkKdF2omu/B8LuksU9iWvvwvQ8HTk\nFeoWztgqtS4d02XNAjPK6PBfkIxcn3ki4YCJjWxItwKBgQDx3SB7/sOSLUG0NSRS\nMAAe9Kfv7Rh94jVsa0n8xYBnTf2Zw2m0xPnJ5dvUXly8rN4672uHqEC84H1j7Fz5\nDHCpZSY10Z71/A5VClM1Xln67QPE+dJxT+ouUCvo5PdfzcvEvEj3dY27D7t1dSNi\njGh+P8RkVBXoqRYPDZ2danim4wKBgQDssS0nbj/n86C7KcJ/n4EQWnDkuuBlcW28\nO5bX5AFfBARhiwPhzixuDAs7K8ElI6UoqoUDROlqA04SaOjTnvEQ+p9bQnYETlCb\nTxPtcPkAwreSlaq4wKB/Z83D/mXo7/lY2rqQoDzuwDfd02f+0aP6bUOPvR/YxeZd\n/3npNHLFqwKBgQCDYpzv3qA8uwrzKt8VKnAWYM8NnZ1tXMGqqMmjX2J2O76klavJ\ngCs1CwGU5sG32KxMFZ0zLyojsEtNSavjumdFDeZo2/tfItJiTd6PojZ9Ad3HVfKE\njWXoTLLdq+vZhkDIGYQFsT0RveUWVFCpix6EXn2ABtFz9s491SamyZzLAwKBgGx5\nSptekJUp90ive77nh8vJ1yFMb9it4j+5A4mPqf00pxlZD39l8MDCbkdA5zSxIFkB\nxRHZfCukthwDzmhl2E8SvQOi8tlIVvLGi/hupP9vPZhFVUd0qFmbZhbjuSrHB/xr\nycLMXQCCQVg9MdT7mO4FM0hlwXmkQM5lbiatbcgfAoGBAJ7oPcL0C3fB1hLE9fmJ\nhUO7kTY/1hkxXjnV2lJb/tQnLDTCpMdrj5tvmeVl064MkPN26WQXUWvS/yiW+qbO\np/z8dEEAL2lhyP00Vc8GeB0FQHZmSibDw+9iJ0fR4YQF8yOhOzcJAxdClDBIOPXv\nKW40EL7AKV00QKjTpy7kRlJW\n-----END PRIVATE KEY-----\n";

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
import { GoogleAuth } from 'google-auth-library';

const scopes = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

const auth = new GoogleAuth({
  credentials: { client_email: GOOGLE_CLIENT_EMAIL, private_key: GOOGLE_PRIVATE_KEY },
  scopes
});

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token) throw new Error('No Google access token');
  return token;
}

// ---------- Google Docs ----------
export async function fetchGoogleDocInstructions(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _googleDocInstructions && now - _lastGoogleDocFetchTime < ONE_HOUR_MS) {
    return _googleDocInstructions;
  }
  
  try {
    const accessToken = await getAccessToken();
    const url = `https://docs.googleapis.com/v1/documents/${GOOGLE_DOC_ID}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } as any });
    
    if (!res.ok) {
      console.warn(`[Google Docs] Failed to fetch document: HTTP ${res.status}`);
      // ใช้ข้อมูลเดิมถ้ามี หรือคืนข้อความ fallback
      return _googleDocInstructions || 'Google Docs instructions temporarily unavailable';
    }
    
    const json = await res.json();
    let fullText = '';
    for (const block of json.body?.content || []) {
      for (const el of block.paragraph?.elements || []) {
        if (el.textRun?.content) fullText += el.textRun.content;
      }
    }
    _googleDocInstructions = fullText.trim();
    _lastGoogleDocFetchTime = now;
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
    const accessToken = await getAccessToken();
    const range = encodeURIComponent(`${sheetName}!A:ZZZ`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } as any });
    if (!res.ok) {
      console.warn(`[Google Sheets] Failed to fetch sheet ${sheetName}: HTTP ${res.status}`);
      return { values: [] as any[] };
    }
    return res.json(); // { values: [...] }
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
    const accessToken = await getAccessToken();
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${INSTRUCTIONS_SPREADSHEET_ID}`;
    const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${accessToken}` } as any });
    
    if (!metaRes.ok) {
      console.warn(`[Google Sheets] Failed to fetch metadata: HTTP ${metaRes.status}`);
      // ใช้ข้อมูลเดิมถ้ามี หรือคืน array ว่าง
      return _sheetJSON.length > 0 ? _sheetJSON : [];
    }
    
    const metaJson = await metaRes.json();
    const result: Array<{ sheetName: string; data: any[] }> = [];
    
    for (const s of metaJson.sheets || []) {
      const name = s.properties?.title;
      if (!name) continue;
      const { values } = await _fetchSheetValues(INSTRUCTIONS_SPREADSHEET_ID, name);
      const parsed = parseSheetRowsToObjects(values || []);
      if (parsed.length) result.push({ sheetName: name, data: parsed });
    }

    _sheetJSON = result;
    _lastSheetsFetchTime = now;
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
