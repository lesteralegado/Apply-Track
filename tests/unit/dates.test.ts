import { describe, expect, it } from "vitest";
import {
  addDays,
  followUpState,
  isDateString,
  todayDate,
  scheduledFollowUpState,
  millisecondsUntilNextLocalDay,
} from "../../src/lib/dates";
describe("local calendar dates", () => {
  it.each([
    ["2026-09-30", "overdue"],
    ["2026-10-01", "today"],
    ["2026-10-02", "upcoming"],
    ["2026-10-08", "upcoming"],
    ["2026-10-09", "later"],
    [null, "none"],
  ] as const)("%s becomes %s", (value, state) =>
    expect(followUpState(value, "2026-10-01")).toBe(state),
  );
  it("crosses month, year, and leap-day boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(followUpState("2027-01-04", "2026-12-31")).toBe("upcoming");
  });
  it("preserves a local date without UTC conversion", () =>
    expect(todayDate(new Date(2026, 9, 1, 0, 1))).toBe("2026-10-01"));
  it.each(["2026-02-30", "2026-13-01", "2026-1-01", "not-a-date"])(
    "rejects %s",
    (value) => expect(isDateString(value)).toBe(false),
  );
});

describe("shared scheduled follow-up policy", () => {
  it.each(["saved", "applied", "interviewing"] as const)(
    "labels due attention for %s",
    (status) => {
      expect(scheduledFollowUpState("2026-09-30", status, "2026-10-01")).toBe(
        "overdue",
      );
      expect(scheduledFollowUpState("2026-10-01", status, "2026-10-01")).toBe(
        "today",
      );
      expect(scheduledFollowUpState(null, status, "2026-10-01")).toBe("none");
    },
  );
  it.each(["offer", "rejected", "withdrawn"] as const)(
    "does not label attention for %s",
    (status) => {
      expect(scheduledFollowUpState("2026-09-30", status, "2026-10-01")).toBe(
        "none",
      );
      expect(scheduledFollowUpState("2026-10-01", status, "2026-10-01")).toBe(
        "none",
      );
    },
  );
  it.each([
    [2026, 11, 31],
    [2028, 1, 28],
    [2028, 1, 29],
  ])(
    "schedules the next local midnight at calendar boundaries",
    (year, month, day) => {
      const now = new Date(year, month, day, 23, 59, 59, 900);
      const next = new Date(now.getTime() + millisecondsUntilNextLocalDay(now));
      expect(millisecondsUntilNextLocalDay(now)).toBe(100);
      expect(todayDate(next)).toBe(addDays(todayDate(now), 1));
      expect(next.getHours()).toBe(0);
      expect(next.getMinutes()).toBe(0);
    },
  );
});
