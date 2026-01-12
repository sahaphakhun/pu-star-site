export function compileLineCommandPattern(pattern: string): RegExp {
  const trimmed = String(pattern || '').trim();
  if (!trimmed) {
    throw new Error('Pattern is required');
  }

  if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
    const lastSlash = trimmed.lastIndexOf('/');
    const body = trimmed.slice(1, lastSlash);
    const flags = trimmed.slice(lastSlash + 1);
    return new RegExp(body, flags || 'i');
  }

  return new RegExp(trimmed, 'i');
}
