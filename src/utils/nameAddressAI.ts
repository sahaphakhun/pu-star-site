interface ParsedResult {
  name: string;
  address: string;
}

/**
 * ใช้ OpenAI Chat Completion (gpt-4o-mini หรือรุ่นอื่น) เพื่อแยกชื่อและที่อยู่จากข้อความเดียว
 */
export async function parseNameAddress(input: string): Promise<ParsedResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[NameAddressAI] OPENAI_API_KEY ไม่ถูกตั้งค่า');
    return null;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano', // หรือ gpt-4.1-nano ตามที่มีในบัญชี
        messages: [
          {
            role: 'system',
            content:
              'คุณคือผู้ช่วยแยกชื่อผู้รับและที่อยู่ภาษาไทย จากข้อความของลูกค้า\nตอบกลับเป็น JSON object ที่มี key name และ address เท่านั้น\nหากไม่สามารถแยกได้ให้ตอบ null\n\nตัวอย่างผลลัพธ์:\n{"name":"สมชาย ใจดี","address":"123/45 หมู่ 5 ต.บางรัก ..."}',
          },
          { role: 'user', content: input.substring(0, 2000) },
        ],
      }),
    });

    if (!res.ok) {
      console.error('[NameAddressAI] API error', res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const data = JSON.parse(content);
    if (data && typeof data.name === 'string' && typeof data.address === 'string') {
      return { name: data.name.trim(), address: data.address.trim() };
    }
  } catch (err) {
    console.error('[NameAddressAI] fetch error', err);
  }
  return null;
} 