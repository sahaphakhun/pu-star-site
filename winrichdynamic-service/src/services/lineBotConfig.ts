import LineCommand, { LineCommandKey } from '@/models/LineCommand';

export const DEFAULT_LINE_COMMANDS: Array<{
  key: LineCommandKey;
  name: string;
  pattern: string;
  description: string;
  priority: number;
}> = [
  {
    key: 'greeting',
    name: 'ทักทาย',
    pattern: '^(สวัสดี|สวัสดีครับ|สวัสดีค่ะ)$',
    description: 'ตอบข้อความทักทายแบบง่าย',
    priority: 1,
  },
  {
    key: 'link_customer',
    name: 'ผูกกลุ่มกับลูกค้า',
    pattern: '^ลูกค้า#(C\\d{8}|[A-Z]\\d[A-Z]\\d)$',
    description: 'ผูก groupId กับ customerCode (ใช้ capture group #1)',
    priority: 2,
  },
  {
    key: 'quotation',
    name: 'สร้างใบเสนอราคา',
    pattern: '^(?:QT|qt|Qt)\\s+(.+)$',
    description: 'ออกใบเสนอราคา (ใช้ capture group #1 เป็นหัวข้อ)',
    priority: 3,
  },
];

export async function ensureDefaultLineCommands() {
  for (const command of DEFAULT_LINE_COMMANDS) {
    await LineCommand.updateOne(
      { key: command.key },
      { $setOnInsert: command },
      { upsert: true }
    );
  }
}
