import type { applicationStatuses } from "./constants";
export function todayDate(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T12:00:00");
  return !Number.isNaN(parsed.getTime()) && todayDate(parsed) === value;
}
export function addDays(value: string, days: number): string {
  const date = new Date(value + "T12:00:00");
  date.setDate(date.getDate() + days);
  return todayDate(date);
}
export type FollowUpState = "overdue" | "today" | "upcoming" | "later" | "none";
export function followUpState(
  value: string | null,
  today = todayDate(),
): FollowUpState {
  if (!value) return "none";
  if (value < today) return "overdue";
  if (value === today) return "today";
  return value <= addDays(today, 7) ? "upcoming" : "later";
}
export function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
        new Date(value + "T12:00:00"),
      )
    : "\u2014";
}
export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

// Hiring stage and the scheduled date determine attention, never the last review outcome.
export function scheduledFollowUpState(
  value: string | null,
  status: (typeof applicationStatuses)[number],
  today: string,
): FollowUpState {
  if (status !== "saved" && status !== "applied" && status !== "interviewing")
    return "none";
  return followUpState(value, today);
}

export function millisecondsUntilNextLocalDay(now: Date): number {
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return midnight.getTime() - now.getTime();
}
