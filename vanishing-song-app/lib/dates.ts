// Date helpers mirroring shared.py's d()/fmt() — parsing is done on the
// ISO date parts directly (not via `new Date(iso)`) so results are stable
// regardless of the server's timezone.

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "Sep 7" or, with withYear, "Sep 7, 2026" */
export function formatShort(iso: string, withYear = false): string {
  const dt = parseIsoDate(iso);
  const label = `${MONTH_ABBR[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
  return withYear ? `${label}, ${dt.getUTCFullYear()}` : label;
}

export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Start of "today" in Hong Kong time, as a UTC-midnight Date for stable comparisons. */
export function todayHK(): Date {
  const now = new Date();
  const hk = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Hong_Kong" }));
  return new Date(Date.UTC(hk.getFullYear(), hk.getMonth(), hk.getDate()));
}

export function todayHKLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Hong_Kong",
  });
}

/** Whole days between `today` and `iso` (positive = future). */
export function daysUntil(iso: string, today: Date): number {
  const target = parseIsoDate(iso);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}
