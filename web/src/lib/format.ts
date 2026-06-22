export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  
  return `${dateStr}, ${timeStr}`;
}

export function formatMinutes(m: number | null | undefined): string {
  if (m == null) return "—";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h ? `${h}h ${rem}m` : `${rem}m`;
}
