import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
  unitPrice?: number;
}

interface Session {
  step: string;
  cart: CartItem[];
  tempData?: Record<string, unknown>;
}

const sessions = new Map<string, Session>();

// สร้าง schema อย่างยืดหยุ่นสำหรับ session
const botSessionSchema = new mongoose.Schema({
  psid: { type: String, unique: true },
  data: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true, strict: false });

const BotSession = mongoose.models.BotSession || mongoose.model('BotSession', botSessionSchema);

async function loadSessionFromDB(psid: string): Promise<Session | null> {
  await connectDB();
  const doc = await BotSession.findOne({ psid }).lean<any>();
  return doc && doc.data ? (doc.data as Session) : null;
}

async function saveSessionToDB(psid: string, session: Session) {
  await connectDB();
  await BotSession.updateOne({ psid }, { data: session }, { upsert: true });
}

export async function getSession(psid: string): Promise<Session> {
  if (!sessions.has(psid)) {
    const dbSess = await loadSessionFromDB(psid);
    if (dbSess) {
      sessions.set(psid, dbSess);
    } else {
      sessions.set(psid, { step: 'browse', cart: [] });
    }
  }
  return sessions.get(psid)!;
}

export async function updateSession(psid: string, partial: Partial<Session>) {
  const current = await getSession(psid);
  const updated = { ...current, ...partial } as Session;
  sessions.set(psid, updated);
  await saveSessionToDB(psid, updated);
}

export async function addToCart(psid: string, item: CartItem) {
  const session = await getSession(psid);
  // สร้าง key สำหรับการเปรียบเทียบ item ที่เหมือนกัน
  const itemKey = `${item.productId}-${item.unitLabel || 'default'}-${JSON.stringify(item.selectedOptions || {})}`;
  const existing = session.cart.find((c) => {
    const existingKey = `${c.productId}-${c.unitLabel || 'default'}-${JSON.stringify(c.selectedOptions || {})}`;
    return existingKey === itemKey;
  });
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    session.cart.push(item);
  }
  await updateSession(psid, { cart: session.cart });
}

export async function clearSession(psid: string) {
  sessions.delete(psid);
  await BotSession.deleteOne({ psid });
} 