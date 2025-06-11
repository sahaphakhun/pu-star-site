/* ใช้ MongoDB เก็บ session เพื่อให้คงอยู่ข้าม cold-start */

import connectDB from '@/lib/mongodb';
import SessionModel, { ISession } from '@/models/Session';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  unitLabel?: string;
  unitPrice?: number;
}

export interface Session {
  step: string;
  cart: CartItem[];
  tempData?: Record<string, unknown>;
}

// Utility: แปลงจากเอกสาร Mongoose เป็น Session plain object
function docToSession(doc: ISession): Session {
  return {
    step: doc.step,
    cart: (doc.cart as unknown as CartItem[]) || [],
    tempData: doc.tempData || {},
  };
}

export async function getSession(psid: string): Promise<Session> {
  await connectDB();
  let doc = await SessionModel.findOne({ psid }).lean<ISession>();
  if (!doc) {
    // create default session lazily (do not wait for write)
    doc = await SessionModel.create({ psid, step: 'browse', cart: [] }) as unknown as ISession;
  }
  return docToSession(doc);
}

export async function updateSession(psid: string, partial: Partial<Session>): Promise<void> {
  await connectDB();
  await SessionModel.findOneAndUpdate(
    { psid },
    { ...partial, updatedAt: new Date() },
    { upsert: true }
  );
}

export async function addToCart(psid: string, item: CartItem): Promise<void> {
  const session = await getSession(psid);
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

export async function clearSession(psid: string): Promise<void> {
  await connectDB();
  await SessionModel.deleteOne({ psid });
}

export async function removeFromCart(psid: string, idx?: number): Promise<void> {
  const session = await getSession(psid);
  if (session.cart.length === 0) return;

  // ถ้าไม่ได้ระบุ index ให้นำออกตัวสุดท้าย
  if (idx === undefined) {
    session.cart.pop();
  } else if (idx >= 0 && idx < session.cart.length) {
    session.cart.splice(idx, 1);
  }

  await updateSession(psid, { cart: session.cart });
} 