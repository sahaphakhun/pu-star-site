interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

interface Session {
  step: string;
  cart: CartItem[];
  tempData?: Record<string, unknown>;
}

const sessions = new Map<string, Session>();

export function getSession(psid: string): Session {
  if (!sessions.has(psid)) {
    sessions.set(psid, { step: 'browse', cart: [] });
  }
  // non-null asserted because we ensured it's set
  return sessions.get(psid)!;
}

export function updateSession(psid: string, partial: Partial<Session>) {
  const current = getSession(psid);
  sessions.set(psid, { ...current, ...partial });
}

export function addToCart(psid: string, item: CartItem) {
  const session = getSession(psid);
  const existing = session.cart.find((c) => c.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    session.cart.push(item);
  }
  updateSession(psid, { cart: session.cart });
}

export function clearSession(psid: string) {
  sessions.delete(psid);
} 