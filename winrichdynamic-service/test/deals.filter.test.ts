import { describe, it, expect } from 'vitest';
import { buildDealsFilter } from '../src/app/api/deals/filter';

function sp(params: Record<string, string>) {
  const u = new URL('http://x');
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.searchParams;
}

describe('buildDealsFilter', () => {
  it('should filter by q with $or regex', () => {
    const f = buildDealsFilter(sp({ q: 'abc' }), {});
    expect(f.$or).toBeTruthy();
  });
  it('seller should be restricted to own ownerId and team', () => {
    const f = buildDealsFilter(sp({ team: 'A', ownerId: 'someone' }), { role: 'seller', adminId: 'me', team: 'A' });
    expect(f.ownerId).toBe('me');
    expect(f.team).toBe('A');
  });
  it('manager should be restricted to team, can narrow owner', () => {
    const f = buildDealsFilter(sp({ ownerId: 'u2' }), { role: 'manager', adminId: 'me', team: 'T' });
    expect(f.team).toBe('T');
    expect(f.ownerId).toBe('u2');
  });
  it('admin can set team and owner freely', () => {
    const f = buildDealsFilter(sp({ ownerId: 'u3', team: 'X' }), { role: 'admin' });
    expect(f.ownerId).toBe('u3');
    expect(f.team).toBe('X');
  });
});


