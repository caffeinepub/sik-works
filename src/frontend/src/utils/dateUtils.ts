/**
 * Date and week utility functions for SIK Works
 */

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get ISO week number and year: "YYYY-WW"
 */
export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-${String(weekNo).padStart(2, "0")}`;
}

export function getCurrentWeek(): string {
  return getISOWeek(new Date());
}

/**
 * Get the Monday and Sunday of a given ISO week "YYYY-WW"
 */
export function getWeekRange(weekStr: string): { start: Date; end: Date } {
  const [year, week] = weekStr.split("-").map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1));
  const start = new Date(startOfWeek1);
  start.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

export function formatWeekLabel(weekStr: string): string {
  const { start, end } = getWeekRange(weekStr);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `Week of ${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}, ${start.getUTCFullYear()}`;
}

/**
 * Navigate to prev/next week from a given "YYYY-WW" string
 */
export function adjustWeek(weekStr: string, delta: number): string {
  const { start } = getWeekRange(weekStr);
  start.setUTCDate(start.getUTCDate() + delta * 7);
  return getISOWeek(start);
}

/**
 * Get all date strings for a given week "YYYY-WW"
 */
export function getDatesInWeek(weekStr: string): string[] {
  const { start } = getWeekRange(weekStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().split("T")[0];
  });
}

/**
 * Check if a date string falls in a given week
 */
export function isDateInWeek(dateStr: string, weekStr: string): boolean {
  const dates = getDatesInWeek(weekStr);
  return dates.includes(dateStr);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
