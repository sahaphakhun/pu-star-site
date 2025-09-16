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
const OPENAI_MAIN_MODEL = process.env.OPENAI_MAIN_MODEL || 'gpt-4.1';

// Google Service Account (คงไว้ในไฟล์นี้ตามคำขอ)
const GOOGLE_CLIENT_EMAIL = "aitar-888@eminent-wares-446512-j8.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGhyeINArKZgaV\nitEcK+o89ilPYeRNTNZgJT7VNHB5hgNLLeAcFLJ7IlCIqTLMoJEnnoDQil6aKaz8\nExVL83uSXRrzk4zQvtt3tIP31+9wOCb9D4ZGWfVP1tD0qdD4WJ1qqg1j1/8879pH\nUeQGEMuCnyVbcQ3GbYQjyYb3wEz/Qv7kMVggF+MIaGGw2NQwM0XcufSFtyxvvX2S\nb8uGc1A8R+Dn/tmcgMODhbtEgcMg6yXI5Y26MPfDjVrEbk0lfCr7IGFJX4ASYeKl\n0jhm0RGb+aya2cb55auLN3VPO5MQ+cOp8gHBf5GiC/YgF1gbRgF5b7LgmENBxSfH\nb3WVQodLAgMBAAECggEACKB14M7LdekXZHyAQrZL0EitbzQknLv33Xyw2B3rvJ7M\nr4HM/nC4eBj7y+ciUc8GZQ+CWc2GzTHTa66+mwAia1qdYbPp3LuhGM4Leq5zn/o+\nA3rJuG6PS4qyUMy89msPXW5fSj/oE535QREiFKYP2dtlia2GI4xoag+x9uZwfMUO\nWKEe7tiUoZQEiGhwtjLq9lyST4kGGmlhNee9OyhDJcw4uCt8Cepr++hMDleWUF6c\nX0nbGmoSS0sZ5Boy8ATMhw/3luaOAlTUEz/nVDvbbWlNL9etwLKiAVw+AQXsPHNW\nNWF7gyEIsEi0qSM3PtA1X7IdReRXHqmfiZs0J3qSQQKBgQD1+Yj37Yuqj8hGi5PY\n+M0ieMdGcbUOmJsM1yUmBMV4bfaTiqm504P6DIYAqfDDWeozcHwcdpG1AfFAihEi\nh6lb0qRk8YaGbzvac8mWhwo/jDA5QB97fjFa6uwtlewZ0Er/U3QmOeVVnVC1y1b0\nrbJD5yjvI3ve+gpwAz0glpIMiwKBgQDOnpD7p7ylG4NQunqmzzdozrzZP0L6EZyE\n141st/Hsp9rtO9/ADuH6WhpirQ516l5LLv7mLPA8S9CF/cSdWF/7WlxBPjM8WRs9\nACFNBJIwUfjzPnvECmtsayzRlKuyCAspnNSkzgtdtvf2xI82Z3BGov9goZfu+D4A\n36b1qXsIQQKBgQCO1CojhO0vyjPKOuxL9hTvqmBUWFyBMD4AU8F/dQ/RYVDn1YG+\npMKi5Li/E+75EHH9EpkO0g7Do3AaQNG4UjwWVJcfAlxSHa8Mp2VsIdfilJ2/8KsX\nQ2yXVYh04/Rn/No/ro7oT4AKmcGu/nbstxuncEgFrH4WOOzspATPsn72BwKBgG5N\nBAT0NKbHm0B7bIKkWGYhB3vKY8zvnejk0WDaidHWge7nabkzuLtXYoKO9AtKxG/K\ndNUX5F+r8XO2V0HQLd0XDezecaejwgC8kwp0iD43ZHkmQBgVn+dPB6wSe94coSjj\nyjj4reSnipQ3tmRKsAtldIN3gI5YA3Gf85dtlHqBAoGAD5ePt7cmu3tDZhA3A8f9\no8mNPvqz/WGs7H2Qgjyfc3jUxEGhVt1Su7J1j+TppfkKtJIDKji6rVA9oIjZtpZT\ngxnU6hcYuiwbLh3wGEFIjP1XeYYILudqfWOEbwnxD1RgMkCqfSHf/niWlfiH6p3F\ndnBsLY/qXdKfS/OXyezAm4M=\n-----END PRIVATE KEY-----\n";

const GOOGLE_DOC_ID = '16X8tI1OzQ1yfAKDRehUqnNfbebxeDA7jWH5n844FM1Y';
const INSTRUCTIONS_SPREADSHEET_ID = '1qZBeyIbeTwJUiYV6-d_0kOjDF9DV0oZEyI3CEiE6j_A';

// ---------- In-Memory Cache ----------
let _googleDocInstructions = '';
let _sheetJSON: Array<{ sheetName: string; data: any[] }> = [];
let _lastGoogleDocFetchTime = 0;
let _lastSheetsFetchTime = 0;
let _lastCacheRefreshHour = -1; // เก็บชั่วโมงล่าสุดที่รีเฟรชแคช
let _fileInstructions = '';
let _lastFileFetchTime = 0;

// ตั้งค่าเวลาแคช (x:44 ทุกชั่วโมง)
const CACHE_REFRESH_MINUTE = 44; // นาทีที่ 44
const CACHE_REFRESH_INTERVAL_MS = 60 * 1000; // ตรวจสอบทุก 1 นาที
const ONE_HOUR_MS = 3_600_000;

interface UserState {
  aiEnabled: boolean;
  autoModeEnabled: boolean;
  filterDisabled: boolean; // true = ไม่กรองข้อความ, false = กรองข้อความ
  history: { role: string; content: string | any[]; timestamp?: Date }[];
}
const _userState = new Map<string, UserState>();

// ---------- Helper ----------
function normalizeRoleContent(role: string = 'user', content: any = '') {
  if (Array.isArray(content)) return { role, content } as const;
  if (typeof content !== 'string') content = JSON.stringify(content);
  return { role, content: content.toString() } as const;
}

/**
 * กรองข้อความให้เหลือเฉพาะในแท็ก THAI_REPLY (ยกเว้นคำสั่ง /tag)
 * @param text ข้อความที่ต้องการกรอง
 * @param isTagCommand เป็นคำสั่ง /tag หรือไม่
 * @param filterDisabled สถานะการกรองข้อความของผู้ใช้ (true = ไม่กรอง, false = กรอง)
 * @returns ข้อความที่กรองแล้ว
 */
export function filterThaiReplyContent(text: string, isTagCommand: boolean = false, filterDisabled: boolean = false): string {
  if (isTagCommand || filterDisabled) {
    return text; // ถ้าเป็นคำสั่ง /tag หรือปิดการกรอง ให้แสดงข้อความทั้งหมด
  }
  
  // ตรวจสอบว่ามีแท็ก THAI_REPLY หรือไม่
  const thaiReplyMatch = text.match(/<THAI_REPLY>([\s\S]*?)<\/THAI_REPLY>/);
  if (thaiReplyMatch && thaiReplyMatch[1]) {
    return thaiReplyMatch[1].trim();
  }
  
  // ถ้าไม่มีแท็ก THAI_REPLY ให้ส่งคืนข้อความเดิม
  return text;
}

function _ensure(userId: string): UserState {
  if (!_userState.has(userId)) {
    _userState.set(userId, { aiEnabled: false, autoModeEnabled: false, filterDisabled: false, history: [] });
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
import fs from 'fs';
import path from 'path';

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
  // ตรวจสอบเวลารีเฟรชแคช
  if (!forceRefresh && shouldRefreshCache()) {
    console.log("[DEBUG] Cache refresh time reached, refreshing Google Docs...");
    forceRefresh = true;
  }
  
  const now = Date.now();
  if (!forceRefresh && _googleDocInstructions && now - _lastGoogleDocFetchTime < ONE_HOUR_MS) {
    console.log("[DEBUG] Using cached Google Docs instructions");
    return _googleDocInstructions;
  }
  
  try {
    const auth = createGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    const res = await docs.documents.get({ documentId: GOOGLE_DOC_ID });
    
    // Extract text from document
    let docText = '';
    if (res.data.body && res.data.body.content) {
      for (const element of res.data.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun) {
              docText += textElement.textRun.content || '';
            }
          }
        }
      }
    }
    
    _googleDocInstructions = docText.trim();
    _lastGoogleDocFetchTime = now;
    _lastCacheRefreshHour = new Date().getHours();
    
    console.log(`[DEBUG] Google Docs fetched successfully: ${_googleDocInstructions.length} characters`);
    return _googleDocInstructions;
    
  } catch (error) {
    console.error('[Google Docs] Error fetching document:', error);
    // ใช้ข้อมูลเดิมถ้ามี หรือคืนข้อความ fallback
    return _googleDocInstructions || 'Google Docs instructions temporarily unavailable';
  }
}

// ---------- Local instruction.txt (ถ้ามี) ----------
export async function fetchInstructionFile(forceRefresh = false) {
  try {
    const now = Date.now();
    if (!forceRefresh && _fileInstructions && now - _lastFileFetchTime < ONE_HOUR_MS) {
      return _fileInstructions;
    }

    const filePath = path.resolve(process.cwd(), 'instruction.txt');
    const exists = fs.existsSync(filePath);
    if (!exists) {
      _fileInstructions = '';
      _lastFileFetchTime = now;
      return _fileInstructions;
    }

    const buf = await fs.promises.readFile(filePath);
    const txt = buf.toString('utf-8').trim();
    _fileInstructions = txt;
    _lastFileFetchTime = now;
    return _fileInstructions;
  } catch (error) {
    console.error('[Instruction File] Error reading instruction.txt:', error);
    return _fileInstructions || '';
  }
}

// ---------- Cache Management Functions ----------
/**
 * ตรวจสอบว่าควรรีเฟรชแคชหรือไม่ (x:44 ทุกชั่วโมง)
 */
function shouldRefreshCache(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // ตรวจสอบว่าเป็นนาทีที่ 44 และยังไม่อัปเดตในชั่วโมงนี้
  if (currentMinute === CACHE_REFRESH_MINUTE && _lastCacheRefreshHour !== currentHour) {
    console.log(`[DEBUG] Cache refresh time reached: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    return true;
  }
  
  return false;
}

/**
 * ตรวจสอบสถานะแคช
 */
export function getCacheStatus(): {
  googleDoc: { hasData: boolean; lastFetch: Date | null; lastRefreshHour: number };
  sheets: { hasData: boolean; lastFetch: Date | null; itemCount: number };
  nextRefreshTime: string;
} {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // คำนวณเวลารีเฟรชครั้งถัดไป
  let nextRefreshHour = currentHour;
  let nextRefreshMinute = CACHE_REFRESH_MINUTE;
  
  if (currentMinute >= CACHE_REFRESH_MINUTE) {
    nextRefreshHour = (currentHour + 1) % 24;
  }
  
  const nextRefreshTime = `${nextRefreshHour.toString().padStart(2, '0')}:${nextRefreshMinute.toString().padStart(2, '0')}`;
  
  return {
    googleDoc: {
      hasData: !!_googleDocInstructions,
      lastFetch: _lastGoogleDocFetchTime ? new Date(_lastGoogleDocFetchTime) : null,
      lastRefreshHour: _lastCacheRefreshHour
    },
    sheets: {
      hasData: _sheetJSON.length > 0,
      lastFetch: _lastSheetsFetchTime ? new Date(_lastSheetsFetchTime) : null,
      itemCount: _sheetJSON.length
    },
    nextRefreshTime
  };
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
  // ตรวจสอบเวลารีเฟรชแคช
  if (!forceRefresh && shouldRefreshCache()) {
    console.log("[DEBUG] Cache refresh time reached, refreshing Google Sheets...");
    forceRefresh = true;
  }
  
  const now = Date.now();
  if (!forceRefresh && _sheetJSON.length && now - _lastSheetsFetchTime < ONE_HOUR_MS) {
    console.log("[DEBUG] Using cached Google Sheets data");
    return _sheetJSON;
  }

  try {
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const { data } = await sheets.spreadsheets.get({ 
      spreadsheetId: INSTRUCTIONS_SPREADSHEET_ID 
    });
    
    const sheetNames = data.sheets?.map(s => s.properties?.title).filter(Boolean) || [];
    const allSheetsData = [];
    
    for (const sheetName of sheetNames) {
      const sheetData = await _fetchSheetValues(INSTRUCTIONS_SPREADSHEET_ID, sheetName as string);
      const parsedData = parseSheetRowsToObjects(sheetData.values);
      allSheetsData.push({ sheetName, data: parsedData });
    }
    
    _sheetJSON = allSheetsData.filter(sheet => sheet.sheetName !== null && sheet.sheetName !== undefined) as { sheetName: string; data: any[]; }[];
    _lastSheetsFetchTime = now;
    _lastCacheRefreshHour = new Date().getHours();
    
    console.log(`[DEBUG] Google Sheets fetched successfully: ${_sheetJSON.length} sheets`);
    return _sheetJSON;
    
  } catch (error) {
    console.error('[Google Sheets] Error in fetchAllSheetsData:', error);
    // ใช้ข้อมูลเดิมถ้ามี หรือคืน array ว่าง
    return _sheetJSON.length > 0 ? _sheetJSON : [];
  }
}

// ---------- Google Extra (Docs+Sheets) ----------
export async function getGoogleExtraData() {
  try {
    console.log("[DEBUG] Fetching Google extra data...");
    const [docText, sheetsData] = await Promise.allSettled([
      fetchGoogleDocInstructions(),
      fetchAllSheetsData()
    ]);
    
    const result = { 
      googleDocInstructions: docText.status === 'fulfilled' ? docText.value : 'Google Docs instructions temporarily unavailable',
      sheets: sheetsData.status === 'fulfilled' ? sheetsData.value : []
    };
    
    console.log(`[DEBUG] Google extra data fetched - Docs: ${!!result.googleDocInstructions}, Sheets: ${result.sheets.length} items`);
    return result;
  } catch (error) {
    console.error('[Google Extra] Error fetching data:', error);
    return {
      googleDocInstructions: 'Google Docs instructions temporarily unavailable',
      sheets: []
    };
  }
}

// ---------- System Instructions (สไตล์ฉบับแรก) ----------
export function buildSystemInstructions(extraNote: string = '') {
  try {
    // ใช้เฉพาะ instruction.txt; หากว่างจะ fallback เป็นข้อความพื้นฐาน
    const baseText = (_fileInstructions && _fileInstructions.trim())
      ? _fileInstructions
      : getFallbackInstructions();

    return `${baseText}`.trim();
  } catch (error) {
    console.error('[buildSystemInstructions] Error:', error);
    return `${(_fileInstructions && _fileInstructions.trim()) ? _fileInstructions : getFallbackInstructions()}`.trim();
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
  const body = JSON.stringify({ model, store: true, messages });
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
      fetchInstructionFile()
    ]);

    // ใช้ system instructions ที่ถูกส่งเข้ามา หากว่างจึง fallback ไปที่ enhanced
    const sysFromCaller = (systemInstructions || '').trim();
    const enhancedSystem = sysFromCaller ? sysFromCaller : await buildEnhancedSystemInstructions();
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

    // ตรวจสอบคำสั่ง /tag - ถ้าผู้ใช้พิมพ์ /tag ให้แสดงแท็กเหมือนเดิม
    const lastUserMessage = messages[messages.length - 1]?.content;
    const isTagCommand = typeof lastUserMessage === 'string' && lastUserMessage.trim() === '/tag';
    
    // ตรวจสอบสถานะการกรองข้อความของผู้ใช้
    const filterDisabled = userId ? await isFilterDisabled(userId) : false;
    
    // ใช้ฟังก์ชัน helper ในการกรองข้อความ
    assistantReply = filterThaiReplyContent(assistantReply, isTagCommand, filterDisabled);

    // ตรวจสอบและบันทึกข้อมูลการสั่งซื้อจาก AI
    if (userId) {
      try {
        // ใช้ข้อความดิบ (ก่อนกรอง) ในการตรวจสอบ ORDER_JSON
        const rawAssistantReply = json?.choices?.[0]?.message?.content ?? '';
        const rawReplyString = typeof rawAssistantReply !== 'string' ? JSON.stringify(rawAssistantReply) : rawAssistantReply;
        
        console.log('[AI Order Real-time] Checking AI response for order data:', {
          userId,
          filteredResponseLength: assistantReply.length,
          rawResponseLength: rawReplyString.length,
          hasOrderJsonTagInFiltered: assistantReply.includes('<ORDER_JSON>'),
          hasOrderJsonTagInRaw: rawReplyString.includes('<ORDER_JSON>')
        });
        
        const orderData = extractOrderDataFromAIResponse(rawReplyString);
        if (orderData) {
          const userMessage = typeof lastUserMessage === 'string' ? lastUserMessage : JSON.stringify(lastUserMessage);
          console.log('[AI Order Real-time] ✅ Order data found, attempting to save:', {
            userId,
            itemCount: orderData.items?.length || 0,
            orderStatus: orderData.order_status,
            userMessagePreview: userMessage.substring(0, 100)
          });
          
          const saveResult = await saveAIOrder(userId, userMessage, rawReplyString, orderData);
          console.log('[AI Order Real-time] Save result:', { userId, success: saveResult });
        } else {
          console.log('[AI Order Real-time] No valid order data found in AI response');
        }
      } catch (error) {
        console.error('[AI Order Real-time] ❌ Error processing order data:', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          responsePreview: assistantReply.substring(0, 200)
        });
      }
    }

    assistantReply = assistantReply.replace(/\[cut\]{2,}/g, '[cut]');
    const parts = assistantReply.split('[cut]');
    if (parts.length > 10) assistantReply = parts.slice(0, 10).join('[cut]');
    return assistantReply.trim();
    
  } catch (error) {
    console.error('[getAssistantResponse] Error:', error);
    
    // Fallback response เมื่อเกิดข้อผิดพลาด
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return 'ระบบได้ทำการแจ้งแอดมิน โปรดรอการตอบกลับจากแอดมิน หรือเลือกเมนูด้านล่างเพื่อใช้ระบบอัตโนมัติ';
    }
    
    return 'ระบบได้ทำการแจ้งแอดมิน โปรดรอการตอบกลับจากแอดมิน หรือเลือกเมนูด้านล่างเพื่อใช้ระบบอัตโนมัติ';
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

// ---------- Filter Toggle ----------
export async function enableFilterForUser(userId: string) {
  _ensure(userId).filterDisabled = false;
}
export async function disableFilterForUser(userId: string) {
  _ensure(userId).filterDisabled = true;
}
export async function isFilterDisabled(userId: string) {
  return _ensure(userId).filterDisabled === true;
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
  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const MessengerUser = (await import('@/models/MessengerUser')).default;
    await MessengerUser.findOneAndUpdate(
      { psid: userId },
      { conversationHistory: [], updatedAt: new Date() },
      { upsert: true }
    );
  } catch (err) {
    console.error('[clearChatHistory] DB error:', err);
  }
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
  content: string | any[],
  context?: string | any[]
): Promise<void> {
  const timestamp = new Date();
  // เก็บ content ตามที่ได้รับ (รองรับข้อความหรือมัลติมีเดีย)
  const message: any = { role, content, timestamp };
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

// ---------- Media Helpers ----------
/**
 * แปลง URL รูปภาพเป็น data URI (base64) เพื่อนำไปใช้ใน Vision และเก็บลงประวัติ
 * ถ้าขนาดไฟล์เกิน maxBytes หรือโหลดไม่ได้ จะคืนค่า null
 */
export async function imageUrlToDataUrl(url: string, maxBytes = 2_000_000): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[imageUrlToDataUrl] HTTP error', res.status, url);
      return null;
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (maxBytes && buf.byteLength > maxBytes) {
      console.warn('[imageUrlToDataUrl] file too large, bytes:', buf.byteLength, 'url:', url);
      return null;
    }
    const b64 = buf.toString('base64');
    return `data:${contentType};base64,${b64}`;
  } catch (err) {
    console.error('[imageUrlToDataUrl] error', err);
    return null;
  }
}

/**
 * ตรวจสอบความพร้อมเข้าถึงของ URL ด้วย HEAD ก่อนใช้งานกับ OpenAI
 */
export async function isUrlAccessible(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal as any });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

// รีเฟรช cache Google
export async function refreshGoogleDataCache(): Promise<void> {
  try {
    console.log("[DEBUG] Manually refreshing Google data cache...");
    _googleDocInstructions = '';
    _sheetJSON = [];
    _lastGoogleDocFetchTime = 0;
    _lastSheetsFetchTime = 0;
    _lastCacheRefreshHour = -1;
    _fileInstructions = '';
    _lastFileFetchTime = 0;
    await Promise.allSettled([
      fetchInstructionFile(true)
    ]);
    console.log("[DEBUG] Google data cache refreshed successfully");
  } catch (error) {
    console.error('[refreshGoogleDataCache] Error:', error);
    // ไม่ต้องทำอะไร เพียงแค่ log error
  }
}

/**
 * รีเฟรชแคชตามเวลาที่กำหนด (x:44 ทุกชั่วโมง)
 */
export async function refreshCacheIfNeeded(): Promise<void> {
  if (shouldRefreshCache()) {
    console.log("[DEBUG] Scheduled cache refresh triggered");
    await refreshGoogleDataCache();
  }
}

/**
 * ตั้งค่าการตรวจสอบแคชอัตโนมัติ
 */
export function setupCacheMonitoring(): void {
  console.log(`[DEBUG] Setting up cache monitoring - refresh at x:${CACHE_REFRESH_MINUTE.toString().padStart(2, '0')} every hour`);
  
  // ตรวจสอบทุก 1 นาที
  setInterval(async () => {
    try {
      await refreshCacheIfNeeded();
    } catch (error) {
      console.error('[Cache Monitoring] Error:', error);
    }
  }, CACHE_REFRESH_INTERVAL_MS);
  
  console.log("[DEBUG] Cache monitoring started");
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
  const systemInstructions = await buildSystemInstructions();
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
  cacheStatus: ReturnType<typeof getCacheStatus>;
}> {
  try {
    const [docsResult, sheetsResult] = await Promise.allSettled([
      fetchGoogleDocInstructions(true),
      fetchAllSheetsData(true)
    ]);
    
    const docs = docsResult.status === 'fulfilled' && docsResult.value !== 'Google Docs instructions temporarily unavailable';
    const sheets = sheetsResult.status === 'fulfilled' && Array.isArray(sheetsResult.value) && sheetsResult.value.length > 0;
    
    const cacheStatus = getCacheStatus();
    
    return {
      docs,
      sheets,
      overall: docs || sheets,
      cacheStatus
    };
  } catch (error) {
    console.error('[checkGoogleAPIStatus] Error:', error);
    return { 
      docs: false, 
      sheets: false, 
      overall: false,
      cacheStatus: getCacheStatus()
    };
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
    // ใช้เฉพาะ instruction.txt เป็นหลัก; ไม่แนบข้อความเพิ่มเติม
    const base = buildSystemInstructions();
    if (base && base.trim()) return base;
    return getFallbackInstructions();
  } catch (error) {
    console.error('[buildEnhancedSystemInstructions] Error:', error);
    return getFallbackInstructions();
  }
}

// ---------- AI Order Management ----------
import AIOrder from '@/models/AIOrder';
import connectDB from '@/lib/mongodb';

/**
 * อัปเดตออเดอร์ที่มีอยู่แทนการสร้างใหม่
 */
async function updateExistingAIOrder(
  existingOrder: any,
  newOrderData: any,
  userMessage: string,
  aiResponse: string
): Promise<boolean> {
  try {
    console.log('[AI Order Update] Starting update process:', {
      existingOrderId: existingOrder._id,
      existingStatus: existingOrder.order_status,
      newStatus: newOrderData.order_status,
      existingItemCount: existingOrder.items.length,
      newItemCount: newOrderData.items?.length || 0
    });

    // ตรวจสอบว่าข้อมูลใหม่มีข้อมูลมากกว่าหรือไม่
    const hasMoreCompleteData = checkDataCompleteness(newOrderData, existingOrder);
    
    if (!hasMoreCompleteData) {
      console.log('[AI Order Update] ⚠️ New data is not more complete, skipping update');
      return false;
    }

    // อัปเดตข้อมูลลูกค้า (ใช้ข้อมูลใหม่ถ้ามีข้อมูลมากกว่า)
    const updatedCustomer = mergeCustomerData(existingOrder.customer, newOrderData.customer);
    
    // อัปเดตรายการสินค้า (เพิ่มสินค้าใหม่หรืออัปเดตที่มีอยู่)
    const updatedItems = mergeItemsData(existingOrder.items, newOrderData.items);
    
    // อัปเดตราคา
    const updatedPricing = mergePricingData(existingOrder.pricing, newOrderData.pricing);
    
    // อัปเดตสถานะ (ใช้สถานะใหม่ถ้าสูงกว่า)
    const updatedStatus = getHigherStatus(existingOrder.order_status, newOrderData.order_status);

    // อัปเดตข้อมูลในฐานข้อมูล
    const updateData = {
      order_status: updatedStatus,
      items: updatedItems,
      pricing: updatedPricing,
      customer: updatedCustomer,
      errorMessages: [...(existingOrder.errorMessages || []), ...(newOrderData.errors || [])],
      aiResponse: aiResponse,
      userMessage: userMessage,
      updatedAt: new Date()
    };

    const updatedOrder = await AIOrder.findByIdAndUpdate(
      existingOrder._id,
      updateData,
      { new: true }
    );

    console.log('[AI Order Update] ✅ Order updated successfully:', {
      orderId: updatedOrder._id,
      newStatus: updatedOrder.order_status,
      itemCount: updatedOrder.items.length,
      totalAmount: updatedOrder.pricing.total,
      customerName: updatedOrder.customer.name,
      updatedAt: updatedOrder.updatedAt
    });

    // ส่ง SMS แจ้งเตือนแอดมินเมื่อ AI Order ถูกอัปเดตเป็นสถานะ completed
    if (updatedOrder.order_status === 'completed') {
      try {
        const { sendSMS } = await import('@/app/notification');
        const AdminPhone = (await import('@/models/AdminPhone')).default;
        
        const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
        if (adminList && adminList.length > 0) {
          const customerName = updatedOrder.customer.name || 'ไม่ระบุ';
          const totalAmount = updatedOrder.pricing.total || 0;
          const itemCount = updatedOrder.items.length;
          
          const smsMsg = `🚨 AI Order Completed!\n\nลูกค้า: ${customerName}\nจำนวนสินค้า: ${itemCount} รายการ\nยอดรวม: ฿${totalAmount.toLocaleString()}\nPSID: ${updatedOrder.psid}\n\nกรุณาตรวจสอบในระบบ AI Orders`;
          
          await Promise.allSettled(
            adminList.map((a: any) => sendSMS(a.phoneNumber, smsMsg))
          );
          
          console.log(`[AI Order SMS] ส่ง SMS แจ้งเตือน AI Order completed ไปยังแอดมิน ${adminList.length} คน`);
        } else {
          console.warn('[AI Order SMS] ไม่พบเบอร์โทรแอดมินในระบบ');
        }
      } catch (smsError) {
        console.error('[AI Order SMS] ❌ Error sending SMS notification:', smsError);
      }
    }

    return true;
  } catch (error) {
    console.error('[AI Order Update] ❌ Error updating order:', {
      existingOrderId: existingOrder._id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * ตรวจสอบว่าข้อมูลใหม่มีข้อมูลมากกว่าหรือไม่
 */
function checkDataCompleteness(newData: any, existingData: any): boolean {
  // ตรวจสอบข้อมูลลูกค้า
  const newCustomerComplete = newData.customer && 
    newData.customer.name && 
    newData.customer.phone && 
    newData.customer.address;
  
  const existingCustomerComplete = existingData.customer && 
    existingData.customer.name && 
    existingData.customer.phone && 
    existingData.customer.address;

  // ตรวจสอบข้อมูลสินค้า
  const newItemsComplete = newData.items && newData.items.length > 0;
  const existingItemsComplete = existingData.items && existingData.items.length > 0;

  // ตรวจสอบสถานะ
  const statusPriority: { [key: string]: number } = { 'draft': 1, 'collecting_info': 2, 'pending_confirmation': 3, 'completed': 4, 'canceled': 0 };
  const newStatusPriority = statusPriority[newData.order_status] || 0;
  const existingStatusPriority = statusPriority[existingData.order_status] || 0;

  // ถ้าข้อมูลลูกค้าใหม่ครบถ้วนกว่า หรือ สถานะใหม่สูงกว่า หรือ มีสินค้าใหม่
  return newCustomerComplete || 
         newStatusPriority > existingStatusPriority || 
         (newItemsComplete && !existingItemsComplete);
}

/**
 * รวมข้อมูลลูกค้า (ใช้ข้อมูลใหม่ถ้ามีข้อมูลมากกว่า)
 */
function mergeCustomerData(existingCustomer: any, newCustomer: any): any {
  if (!newCustomer) return existingCustomer;
  if (!existingCustomer) return newCustomer;

  return {
    name: newCustomer.name || existingCustomer.name,
    phone: newCustomer.phone || existingCustomer.phone,
    address: newCustomer.address || existingCustomer.address
  };
}

/**
 * รวมข้อมูลสินค้า (เพิ่มสินค้าใหม่หรืออัปเดตที่มีอยู่)
 */
function mergeItemsData(existingItems: any[], newItems: any[]): any[] {
  if (!newItems || newItems.length === 0) return existingItems;
  if (!existingItems || existingItems.length === 0) return newItems;

  const mergedItems = [...existingItems];
  
  newItems.forEach(newItem => {
    // หาสินค้าที่มีชื่อเดียวกัน
    const existingItemIndex = mergedItems.findIndex(item => 
      item.name === newItem.name && 
      item.variant?.color === newItem.variant?.color && 
      item.variant?.size === newItem.variant?.size
    );

    if (existingItemIndex >= 0) {
      // อัปเดตสินค้าที่มีอยู่
      mergedItems[existingItemIndex] = {
        ...mergedItems[existingItemIndex],
        qty: newItem.qty || mergedItems[existingItemIndex].qty,
        note: newItem.note || mergedItems[existingItemIndex].note,
        sku: newItem.sku || mergedItems[existingItemIndex].sku
      };
    } else {
      // เพิ่มสินค้าใหม่
      mergedItems.push(newItem);
    }
  });

  return mergedItems;
}

/**
 * รวมข้อมูลราคา
 */
function mergePricingData(existingPricing: any, newPricing: any): any {
  if (!newPricing) return existingPricing;
  if (!existingPricing) return newPricing;

  return {
    currency: newPricing.currency || existingPricing.currency || 'THB',
    subtotal: newPricing.subtotal || existingPricing.subtotal || 0,
    discount: newPricing.discount || existingPricing.discount || 0,
    shipping_fee: newPricing.shipping_fee || existingPricing.shipping_fee || 0,
    total: newPricing.total || existingPricing.total || 0
  };
}

/**
 * เปรียบเทียบสถานะและคืนค่าสถานะที่สูงกว่า
 */
function getHigherStatus(existingStatus: string, newStatus: string): string {
  const statusPriority: { [key: string]: number } = { 
    'draft': 1, 
    'collecting_info': 2, 
    'pending_confirmation': 3, 
    'completed': 4, 
    'canceled': 0 
  };
  
  const existingPriority = statusPriority[existingStatus] || 0;
  const newPriority = statusPriority[newStatus] || 0;
  
  return newPriority > existingPriority ? newStatus : existingStatus;
}

/**
 * บันทึกข้อมูลการสั่งซื้อจาก AI
 */
export async function saveAIOrder(
  psid: string,
  userMessage: string,
  aiResponse: string,
  orderData: any
): Promise<boolean> {
  try {
    console.log('[AI Order Save] Starting save process:', {
      psid,
      userMessageLength: userMessage.length,
      aiResponseLength: aiResponse.length,
      orderData: {
        itemCount: orderData.items?.length || 0,
        hasCustomer: !!orderData.customer,
        hasPricing: !!orderData.pricing,
        orderStatus: orderData.order_status
      }
    });
    
    await connectDB();
    console.log('[AI Order Save] Database connected successfully');
    
    // Helper function to convert address object to string
    const formatAddress = (addressData: any): string | null => {
      if (!addressData) return null;
      if (typeof addressData === 'string') return addressData;
      if (typeof addressData === 'object') {
        const { line1, district, province, postcode } = addressData;
        const parts = [line1, district, province, postcode].filter(part => part && part !== 'null');
        return parts.length > 0 ? parts.join(', ') : null;
      }
      return null;
    };
    
    // Helper function to ensure valid quantity
    const validateQuantity = (qty: any): number => {
      const parsedQty = parseInt(qty) || 0;
      return parsedQty < 1 ? 1 : parsedQty; // Default to 1 if invalid
    };
    
    // ตรวจสอบออเดอร์ที่มีอยู่สำหรับผู้ใช้คนนี้
    const existingOrder = await AIOrder.findOne({
      psid,
      order_status: { $in: ['draft', 'collecting_info', 'pending_confirmation'] }
    }).sort({ updatedAt: -1 });
    
    if (existingOrder) {
      console.log('[AI Order Save] 🔄 Found existing order, updating instead of creating new:', {
        psid,
        existingOrderId: existingOrder._id,
        existingStatus: existingOrder.order_status,
        existingItemCount: existingOrder.items.length,
        newItemCount: orderData.items?.length || 0
      });
      
      // อัปเดตออเดอร์ที่มีอยู่แทนการสร้างใหม่
      return await updateExistingAIOrder(existingOrder, orderData, userMessage, aiResponse);
    }
    
    console.log('[AI Order Save] No existing order found, creating new order');
    
    const aiOrder = new AIOrder({
      psid,
      order_status: orderData.order_status || 'draft',
      items: (orderData.items || []).map((item: any) => ({
        ...item,
        qty: validateQuantity(item.qty)
      })),
      pricing: orderData.pricing || {
        currency: 'THB',
        subtotal: 0,
        discount: 0,
        shipping_fee: 0,
        total: 0
      },
      customer: orderData.customer ? {
        name: orderData.customer.name || null,
        phone: orderData.customer.phone || null,
        address: formatAddress(orderData.customer.address)
      } : {
        name: null,
        phone: null,
        address: null
      },
      errorMessages: orderData.errors || [],
      aiResponse,
      userMessage
    });

    const savedOrder = await aiOrder.save();
    console.log('[AI Order Save] ✅ AI Order saved successfully:', {
      psid,
      orderId: savedOrder._id,
      itemCount: savedOrder.items.length,
      status: savedOrder.order_status,
      totalAmount: savedOrder.pricing.total,
      createdAt: savedOrder.createdAt
    });
    
    // ส่ง SMS แจ้งเตือนแอดมินเมื่อ AI Order มีสถานะ completed
    if (savedOrder.order_status === 'completed') {
      try {
        const { sendSMS } = await import('@/app/notification');
        const AdminPhone = (await import('@/models/AdminPhone')).default;
        
        const adminList = await AdminPhone.find({}, 'phoneNumber').lean();
        if (adminList && adminList.length > 0) {
          const customerName = savedOrder.customer.name || 'ไม่ระบุ';
          const totalAmount = savedOrder.pricing.total || 0;
          const itemCount = savedOrder.items.length;
          
          const smsMsg = `🚨 AI Order Completed!\n\nลูกค้า: ${customerName}\nจำนวนสินค้า: ${itemCount} รายการ\nยอดรวม: ฿${totalAmount.toLocaleString()}\nPSID: ${psid}\n\nกรุณาตรวจสอบในระบบ AI Orders`;
          
          await Promise.allSettled(
            adminList.map((a: any) => sendSMS(a.phoneNumber, smsMsg))
          );
          
          console.log(`[AI Order SMS] ส่ง SMS แจ้งเตือน AI Order completed ไปยังแอดมิน ${adminList.length} คน`);
        } else {
          console.warn('[AI Order SMS] ไม่พบเบอร์โทรแอดมินในระบบ');
        }
      } catch (smsError) {
        console.error('[AI Order SMS] ❌ Error sending SMS notification:', smsError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[AI Order Save] ❌ Error saving order:', {
      psid,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderDataPreview: JSON.stringify(orderData, null, 2).substring(0, 500)
    });
    return false;
  }
}

/**
 * ดึงข้อมูล AI Orders ที่ยังไม่ได้แมพ
 */
export async function getUnmappedAIOrders(psid?: string): Promise<any[]> {
  try {
    await connectDB();
    
    const query: any = { 
      mappedOrderId: null,
      order_status: { $in: ['draft', 'collecting_info', 'pending_confirmation', 'completed'] }
    };
    
    if (psid) {
      query.psid = psid;
    }
    
    const orders = await AIOrder.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return orders;
  } catch (error) {
    console.error('[AI Order] Error fetching unmapped orders:', error);
    return [];
  }
}

/**
 * ตรวจสอบว่าข้อความมีข้อมูลการสั่งซื้อหรือไม่
 */
export function extractOrderDataFromAIResponse(aiResponse: string): any | null {
  try {
    // Debug log เพื่อตรวจสอบการมีอยู่ของ ORDER_JSON tags
    const hasOrderJsonStart = aiResponse.includes('<ORDER_JSON>');
    const hasOrderJsonEnd = aiResponse.includes('</ORDER_JSON>');
    
    console.log('[AI Order Extract] Checking response:', {
      responseLength: aiResponse.length,
      hasOrderJsonStart,
      hasOrderJsonEnd,
      preview: aiResponse.substring(0, 200) + '...'
    });
    
    // หา JSON ในแท็ก ORDER_JSON
    const orderJsonMatch = aiResponse.match(/<ORDER_JSON>([\s\S]*?)<\/ORDER_JSON>/);
    
    if (!orderJsonMatch) {
      console.log('[AI Order Extract] ❌ No ORDER_JSON tags found');
      return null;
    }
    
    const jsonString = orderJsonMatch[1].trim();
    console.log('[AI Order Extract] Found ORDER_JSON content:', {
      jsonLength: jsonString.length,
      jsonPreview: jsonString.substring(0, 100) + '...'
    });
    
    const orderData = JSON.parse(jsonString);
    
    // ตรวจสอบว่ามีข้อมูลที่จำเป็นหรือไม่
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.log('[AI Order Extract] ❌ Invalid items data:', {
        hasItems: !!orderData.items,
        isArray: Array.isArray(orderData.items),
        itemCount: orderData.items ? orderData.items.length : 0
      });
      return null;
    }
    
    console.log('[AI Order Extract] ✅ Valid order data extracted:', {
      itemCount: orderData.items.length,
      hasCustomer: !!orderData.customer,
      hasPricing: !!orderData.pricing,
      orderStatus: orderData.order_status
    });
    
    return orderData;
  } catch (error) {
    console.error('[AI Order Extract] ❌ Error parsing order data:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responsePreview: aiResponse.substring(0, 200)
    });
    return null;
  }
}

// ---------- Refresh Google Data Cache ----------
