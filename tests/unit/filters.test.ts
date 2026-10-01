import { describe, expect, it } from "vitest";
import { demoApplications } from "../../src/features/demo/demoApplications";
import { filterApplications } from "../../src/features/applications/utils/filters";
import {
  dueFollowUps,
  upcomingFollowUps,
  dashboardStatistics,
} from "../../src/features/dashboard/utils/statistics";
const items = demoApplications("2026-10-01");
describe("search and status filters", () => {
  it("finds company ignoring case and whitespace", () =>
    expect(filterApplications(items, "  NORTHSTAR  ", "all")).toHaveLength(1));
  it("finds a job title", () =>
    expect(filterApplications(items, "full-stack", "all")).toHaveLength(2));
  it("combines search and status", () => {
    expect(filterApplications(items, "frontend", "interviewing")).toHaveLength(
      2,
    );
    expect(filterApplications(items, "frontend", "offer")).toHaveLength(0);
  });
  it("returns all items for empty search and sorts without mutation", () => {
    const reversed = [...items].reverse();
    expect(filterApplications(reversed, "", "all").map((x) => x.id)).toEqual(
      items.map((x) => x.id),
    );
    expect(reversed[0].id).toBe("demo-7");
  });
  it("counts every status correctly", () =>
    expect(dashboardStatistics(items)).toEqual({
      total: 8,
      saved: 1,
      applied: 3,
      interviewing: 2,
      offer: 1,
      rejected: 1,
      withdrawn: 0,
    }));
  it("excludes completed and distant follow-ups, ordered earliest first", () => {
    const list = [
      ...dueFollowUps(items, "2026-10-01"),
      ...upcomingFollowUps(items, "2026-10-01"),
    ];
    expect(list.map((x) => x.company)).toEqual([
      "Orbit Systems",
      "Forma Studio",
      "Northstar Labs",
      "Paperplane",
    ]);
    expect(
      dueFollowUps([{ ...items[0], status: "withdrawn" }], "2026-10-01"),
    ).toEqual([]);
  });
});

describe("finite follow-up scheduling", () => {
  const today = "2026-10-01";
  const record = (
    id: string,
    date: string | null,
    status = "applied" as (typeof items)[number]["status"],
  ) => ({
    ...items[0],
    id,
    company: "Same company",
    status,
    follow_up_date: date,
  });
  it("separates overdue/today from tomorrow through day seven", () => {
    const records = [
      record("yesterday", "2026-09-30"),
      record("today", today),
      record("tomorrow", "2026-10-02"),
      record("seven", "2026-10-08"),
      record("eight", "2026-10-09"),
    ];
    expect(dueFollowUps(records, today).map((x) => x.id)).toEqual([
      "yesterday",
      "today",
    ]);
    expect(upcomingFollowUps(records, today).map((x) => x.id)).toEqual([
      "tomorrow",
      "seven",
    ]);
  });
  it("includes dated Saved records and excludes terminal or undated records", () => {
    const records = [
      record("saved", today, "saved"),
      record("interview", today, "interviewing"),
      record("offer", today, "offer"),
      record("rejected", today, "rejected"),
      record("withdrawn", today, "withdrawn"),
      record("undated", null),
    ];
    expect(dueFollowUps(records, today).map((x) => x.id)).toEqual([
      "interview",
      "saved",
    ]);
    expect(upcomingFollowUps(records, today)).toEqual([]);
  });
  it.each(["reviewed", "waiting", "stopped"] as const)(
    "schedules independently of the last %s outcome",
    (outcome) => {
      const consumed = {
        ...record("review", null),
        follow_up_review: { outcome, reviewed_at: "2026-10-01T00:00:00.000Z" },
      };
      expect(dueFollowUps([consumed], today)).toEqual([]);
      const reopened = { ...consumed, follow_up_date: "2026-10-02" };
      expect(upcomingFollowUps([reopened], today)).toEqual([reopened]);
      expect(dueFollowUps([reopened], "2026-10-02")).toEqual([reopened]);
    },
  );
  it("orders by date, company, then ID without changing input", () => {
    const records = [
      record("z", today),
      record("a", today),
      { ...record("b", today), company: "Earlier company" },
      record("past", "2026-09-30"),
    ];
    const original = structuredClone(records);
    expect(dueFollowUps(records, today).map((x) => x.id)).toEqual([
      "past",
      "b",
      "a",
      "z",
    ]);
    expect(records).toEqual(original);
  });
  it.each([
    ["2026-12-31", "2027-01-01"],
    ["2028-02-28", "2028-02-29"],
    ["2028-02-29", "2028-03-01"],
  ])("advances scheduled work across %s", (before, after) => {
    const records = [record("next", after)];
    expect(dueFollowUps(records, before)).toEqual([]);
    expect(upcomingFollowUps(records, before)).toEqual(records);
    expect(dueFollowUps(records, after)).toEqual(records);
  });
});
