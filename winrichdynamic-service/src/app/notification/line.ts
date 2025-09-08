import { Client } from '@line/bot-sdk';

function getLineClient(): Client | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) return null;
  return new Client({ channelAccessToken });
}

export async function sendLineTextToGroup(groupId: string, text: string) {
  const client = getLineClient();
  if (!client) throw new Error('LINE is not configured');
  await client.pushMessage(groupId, { type: 'text', text });
}


