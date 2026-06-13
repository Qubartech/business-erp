export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}
export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}
export function formatMinutes(m: number | null | undefined): string {
  if (m == null) return "—";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h ? `${h}h ${rem}m` : `${rem}m`;
}
