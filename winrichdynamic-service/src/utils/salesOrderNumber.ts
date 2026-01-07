export const buildSalesOrderNumber = (
  source: string | { toString(): string } | null | undefined
) => {
  const raw = String(source || '').trim();
  if (!raw) return '';
  return `SO${raw.slice(-6).toUpperCase()}`;
};
