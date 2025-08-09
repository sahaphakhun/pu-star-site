// =============================
// OpenAI Integration Utilities
// =============================
// NOTE: ไฟล์นี้ถูกสร้างอัตโนมัติโดยระบบ AI ตามคำขอของผู้ใช้
// ค่าคอนฟิกสำคัญถูกฝังไว้ในโค้ดตามที่ผู้ใช้ระบุ 

// (ใน Runtime Next.js/Edge มี global fetch อยู่แล้ว จึงไม่จำเป็นต้อง import)

// ---------- ENV / CONFIG ----------
// OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '<OPENAI_API_KEY>';
const OPENAI_MAIN_MODEL = process.env.OPENAI_MAIN_MODEL || 'gpt-4.1';

// Google
const GOOGLE_API_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGhyeINArKZgaV\nitEcK+o89ilPYeRNTNZgJT7VNHB5hgNLLeAcFLJ7IlCIqTLMoJEnnoDQil6aKaz8\nExVL83uSXRrzk4zQvtt3tIP31+9wOCb9D4ZGWfVP1tD0qdD4WJ1qqg1j1/8879pH\nUeQGEMuCnyVbcQ3GbYQjyYb3wEz/Qv7kMVggF+MIaGGw2NQwM0XcufSFtyxvvX2S\nb8uGc1A8R+Dn/tmcgMODhbtEgcMg6yXI5Y26MPfDjVrEbk0lfCr7IGFJX4ASYeKl\n0jhm0RGb+aya2cb55auLN3VPO5MQ+cOp8gHBf5GiC/YgF1gbRgF5b7LgmENBxSfH\nb3WVQodLAgMBAAECggEACKB14M7LdekXZHyAQrZL0EitbzQknLv33Xyw2B3rvJ7M\nr4HM/nC4eBj7y+ciUc8GZQ+CWc2GzTHTa66+mwAia1qdYbPp3LuhGM4Leq5zn/o+\nA3rJuG6PS4qyUMy89msPXW5fSj/oE535QREiFKYP2dtlia2GI4xoag+x9uZwfMUO\nWKEe7tiUoZQEiGhwtjLq9lyST4kGGmlhNee9OyhDJcw4uCt8Cepr++hMDleWUF6c\nX0nbGmoSS0sZ5Boy8ATMhw/3luaOAlTUEz/nVDvbbWlNL9etwLKiAVw+AQXsPHNW\nNWF7gyEIsEi0qSM3PtA1X7IdReRXHqmfiZs0J3qSQQKBgQD1+Yj37Yuqj8hGi5PY\n+M0ieMdGcbUOmJsM1yUmBMV4bfaTiqm504P6DIYAqfDDWeozcHwcdpG1AfFAihEi\nh6lb0qRk8YaGbzvac8mWhwo/jDA5QB97fjFa6uwtlewZ0Er/U3QmOeVVnVC1y1b0\nrbJD5yjvI3ve+gpwAz0glpIMiwKBgQDOnpD7p7ylG4NQunqmzzdozrzZP0L6EZyE\n141st/Hsp9rtO9/ADuH6WhpirQ516l5LLv7mLPA8S9CF/cSdWF/7WlxBPjM8WRs9\nACFNBJIwUfjzPnvECmtsayzRlKuyCAspnNSkzgtdtvf2xI82Z3BGov9goZfu+D4A\n36b1qXsIQQKBgQCO1CojhO0vyjPKOuxL9hTvqmBUWFyBMD4AU8F/dQ/RYVDn1YG+\npMKi5Li/E+75EHH9EpkO0g7Do3AaQNG4UjwWVJcfAlxSHa8Mp2VsIdfilJ2/8KsX\nQ2yXVYh04/Rn/No/ro7oT4AKmcGu/nbstxuncEgFrH4WOOzspATPsn72BwKBgG5N\nBAT0NKbHm0B7bIKkWGYhB3vKY8zvnejk0WDaidHWge7nabkzuLtXYoKO9AtKxG/K\ndNUX5F+r8XO2V0HQLd0XDezecaejwgC8kwp0iD43ZHkmQBgVn+dPB6wSe94coSjj\nyjj4reSnipQ3tmRKsAtldIN3gI5YA3Gf85dtlHqBAoGAD5ePt7cmu3tDZhA3A8f9\no8mNPvqz/WGs7H2Qgjyfc3jUxEGhVt1Su7J1j+TppfkKtJIDKji6rVA9oIjZtpZT\ngxnU6hcYuiwbLh3wGEFIjP1XeYYILudqfWOEbwnxD1RgMkCqfSHf/niWlfiH6p3F\ndnBsLY/qXdKfS/OXyezAm4M=\n-----END PRIVATE KEY-----\n";
const GOOGLE_DOC_ID = '16X8tI1OzQ1yfAKDRehUqnNfbebxeDA7jWH5n844FM1Y';
const INSTRUCTIONS_SPREADSHEET_ID = '1P1nDP9CUtXFkKgW1iAap235V1_UR_1Mtqm5prVKoxf8';

// ---------- In-Memory Cache ----------
let _googleDocInstructions = '';
let _sheetJSON: any[] = [];
let _lastGoogleDocFetchTime = 0;
let _lastSheetsFetchTime = 0;
const ONE_DAY_MS = 86_400_000;

interface UserState {
  aiEnabled: boolean;
  history: { role: string; content: string }[];
}

const _userState = new Map<string, UserState>();

// ---------- Helper ----------
function normalizeRoleContent(role: string = 'user', content: any = '') {
  if (Array.isArray(content)) {
    return { role, content } as const;
  }
  if (typeof content !== 'string') {
    content = JSON.stringify(content);
  }
  return { role, content: content.toString() } as const;
}

function _ensure(userId: string): UserState {
  if (!_userState.has(userId)) {
    _userState.set(userId, { aiEnabled: false, history: [] });
  }
  return _userState.get(userId)!;
}

function parseSheetRowsSkipEmpty(rows: any[] = []) {
  return rows.filter(
    (r) => Array.isArray(r) && r.some((c) => String(c || '').trim() !== '')
  );
}

// ---------- OpenAI ----------
export async function callOpenAI(
  messages: { role: string; content: string }[],
  model: string = OPENAI_MAIN_MODEL
) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('<YOUR_')) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  const body = JSON.stringify({ model, messages, temperature });
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENAI_API_KEY}`
  } as any;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body
  });

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
  history: { role: string; content: string }[] = [],
  userContent: string = ''
) {
  const messages = [normalizeRoleContent('system', systemInstructions), ...history];

  const now = new Date();
  const date = now.toLocaleDateString('th-TH');
  const time = now.toLocaleTimeString('th-TH');
  const userMsg = normalizeRoleContent(
    'user',
    `[ข้อความนี้ส่งจากลูกค้าวันที่ ${date} เวลา ${time}] ${userContent}`
  );
  messages.push(userMsg);

  const json = await callOpenAI(messages);
  let assistantReply = json?.choices?.[0]?.message?.content ?? '';
  if (typeof assistantReply !== 'string') assistantReply = JSON.stringify(assistantReply);

  assistantReply = assistantReply.replace(/\[cut\]{2,}/g, '[cut]');
  const parts = assistantReply.split('[cut]');
  if (parts.length > 10) assistantReply = parts.slice(0, 10).join('[cut]');

  return assistantReply.trim();
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
export async function addHistory(userId: string, role: string, content: string) {
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

// ---------- Google Helpers ----------
async function _fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchGoogleDocInstructions(forceRefresh = false) {
  if (
    !GOOGLE_API_KEY ||
    GOOGLE_API_KEY.startsWith('<YOUR_') ||
    !GOOGLE_DOC_ID
  ) {
    console.warn('[GDOC] Google API not configured');
    return '';
  }

  const now = Date.now();
  if (!forceRefresh && _googleDocInstructions && now - _lastGoogleDocFetchTime < ONE_DAY_MS) {
    return _googleDocInstructions;
  }

  try {
    const url = `https://docs.googleapis.com/v1/documents/${GOOGLE_DOC_ID}?key=${GOOGLE_API_KEY}`;
    const json = await _fetchJSON(url);
    const blocks = (json.body?.content || []) as any[];
    let fullText = '';
    for (const block of blocks) {
      if (block.paragraph?.elements) {
        for (const el of block.paragraph.elements) {
          if (el.textRun?.content) fullText += el.textRun.content;
        }
      }
    }
    _googleDocInstructions = fullText.trim();
    _lastGoogleDocFetchTime = now;
  } catch (err: any) {
    console.error('[GDOC] fetch error:', err.message);
  }

  return _googleDocInstructions;
}

async function _fetchSheetValues(spreadsheetId: string, sheetName: string) {
  const range = encodeURIComponent(`${sheetName}!A:ZZZ`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${GOOGLE_API_KEY}`;
  return _fetchJSON(url).then((json) => json.values || []);
}

async function fetchAllSheetsData(tier = 'Basic', forceRefresh = false) {
  if (
    !GOOGLE_API_KEY ||
    GOOGLE_API_KEY.startsWith('<YOUR_') ||
    !INSTRUCTIONS_SPREADSHEET_ID
  ) {
    console.warn('[GSHEET] Google API not configured');
    return [];
  }

  const now = Date.now();
  if (!forceRefresh && _sheetJSON.length && now - _lastSheetsFetchTime < ONE_DAY_MS) {
    return _sheetJSON;
  }

  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${INSTRUCTIONS_SPREADSHEET_ID}?key=${GOOGLE_API_KEY}`;
    const metaJson = await _fetchJSON(metaUrl);
    const sheets = metaJson.sheets || [];

    const basicTabs = ['การถาม/ตอบ', 'ข้อมูลสินค้า', 'FAQ', 'ชื่อสินค้าที่ชอบเรียกผิด'];
    const result: any[] = [];

    for (const sheet of sheets) {
      const name = sheet.properties?.title;
      if (!name) continue;
      if (basicTabs.includes(name) || name.includes(tier)) {
        try {
          const rows = await _fetchSheetValues(INSTRUCTIONS_SPREADSHEET_ID, name);
          const parsed = parseSheetRowsSkipEmpty(rows);
          if (parsed.length) result.push({ sheetName: name, data: parsed });
        } catch (e: any) {
          console.warn(`[GSHEET] skip sheet ${name}:`, e.message);
        }
      }
    }

    _sheetJSON = result;
    _lastSheetsFetchTime = now;
  } catch (err: any) {
    console.error('[GSHEET] fetch error:', err.message);
  }

  return _sheetJSON;
}

async function getGoogleExtraData(tier = 'Basic') {
  const [docText, sheetsData] = await Promise.all([
    fetchGoogleDocInstructions(),
    fetchAllSheetsData(tier)
  ]);

  return {
    googleDocInstructions: docText,
    sheets: sheetsData
  };
}

// ---------- System Instructions ----------
function buildSystemInstructions(tier = 'Basic', extraData: any = '') {
  const currentDateTime = new Date().toLocaleString('th-TH', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Bangkok'
  });

  if (typeof extraData === 'object') {
    try {
      extraData = JSON.stringify(extraData, null, 2);
    } catch (_) {
      extraData = String(extraData);
    }
  }

  return `คุณคือแชตบอตขายของออนไลน์ เทียร์ ${tier} \nวันที่-เวลา: ${currentDateTime}\n${extraData}`.trim();
}

function buildSystemInstructionsForUser(
  userObj: any = {},
  overrideTier: string | null = null,
  extraData: any = ''
) {
  const tier = overrideTier || userObj.tier || 'Basic';
  const base = buildSystemInstructions(tier, extraData);

  const userInfo = JSON.stringify(
    {
      userId: userObj.userId,
      name: userObj.name,
      totalPurchase: userObj.totalPurchase,
      tier,
      aiEnabled: userObj.aiEnabled
    },
    null,
    2
  );

  return `${base}\n---------------------------\n(Additional user info)\n${userInfo}\n---------------------------`;
}

// ---------- Exports ----------
export {
  // System Instructions
  buildSystemInstructions,
  buildSystemInstructionsForUser,
  // Google helpers
  fetchGoogleDocInstructions,
  fetchAllSheetsData,
  getGoogleExtraData
}; 