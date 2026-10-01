import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  applicationValues,
  decodeApplication,
} from "../../src/features/applications/api/document";
const input = {
  company: "  Acme  ",
  jobTitle: " Developer ",
  jobUrl: "",
  status: "saved" as const,
  applicationDate: "",
  followUpDate: "2026-10-02",
  notes: " Call recruiter ",
};
const stored = {
  ...applicationValues(input),
  owner_id: "user-a",
  created_at: Timestamp.fromDate(new Date("2026-10-01T02:00:00Z")),
  updated_at: Timestamp.fromDate(new Date("2026-10-01T02:01:00Z")),
};
describe("Firestore application documents", () => {
  it("trims input and preserves date-only follow-ups", () => {
    expect(applicationValues(input)).toEqual({
      company: "Acme",
      job_title: "Developer",
      job_url: null,
      status: "saved",
      application_date: null,
      follow_up_date: "2026-10-02",
      notes: "Call recruiter",
    });
  });
  it("normalizes server timestamps for existing UI sorting", () => {
    expect(decodeApplication("record-a", stored, "user-a")).toMatchObject({
      id: "record-a",
      owner_id: "user-a",
      follow_up_date: "2026-10-02",
      created_at: "2026-10-01T02:00:00.000Z",
      updated_at: "2026-10-01T02:01:00.000Z",
    });
  });
  it("rejects mismatched ownership", () => {
    expect(() => decodeApplication("record-a", stored, "user-b")).toThrow(
      /ownership/,
    );
  });
  it("rejects malformed stored dates and statuses", () => {
    expect(() =>
      decodeApplication(
        "record-a",
        { ...stored, follow_up_date: "2026-02-30" },
        "user-a",
      ),
    ).toThrow();
    expect(() =>
      decodeApplication("record-a", { ...stored, status: "unknown" }, "user-a"),
    ).toThrow();
    expect(() =>
      decodeApplication("record-a", { ...stored, status: "applied" }, "user-a"),
    ).toThrow();
  });
  it("rejects uncommitted or client-provided timestamp strings", () => {
    expect(() =>
      decodeApplication("record-a", { ...stored, updated_at: null }, "user-a"),
    ).toThrow();
    expect(() =>
      decodeApplication(
        "record-a",
        { ...stored, created_at: "2026-10-01" },
        "user-a",
      ),
    ).toThrow();
  });
});

describe("last follow-up review decoding", () => {
  it("normalizes absent and null legacy review metadata", () => {
    expect(
      decodeApplication("record-a", stored, "user-a").follow_up_review,
    ).toBeNull();
    expect(
      decodeApplication(
        "record-a",
        { ...stored, follow_up_review: null },
        "user-a",
      ).follow_up_review,
    ).toBeNull();
  });
  it("decodes a committed review without changing the schedule or status", () => {
    expect(
      decodeApplication(
        "record-a",
        {
          ...stored,
          follow_up_review: {
            outcome: "stopped",
            reviewed_at: stored.updated_at,
          },
        },
        "user-a",
      ),
    ).toMatchObject({
      status: "saved",
      follow_up_date: "2026-10-02",
      follow_up_review: {
        outcome: "stopped",
        reviewed_at: "2026-10-01T02:01:00.000Z",
      },
    });
  });
  it.each([
    { outcome: "emailed", reviewed_at: stored.updated_at },
    { outcome: "reviewed" },
    { reviewed_at: stored.updated_at },
    { outcome: "waiting", reviewed_at: stored.updated_at, notes: "extra" },
    { outcome: "waiting", reviewed_at: "2026-10-01T02:01:00Z" },
    { outcome: "waiting", reviewed_at: null },
  ])("rejects malformed review metadata: %j", (follow_up_review) => {
    expect(() =>
      decodeApplication("record-a", { ...stored, follow_up_review }, "user-a"),
    ).toThrow();
  });
  it("uses all timestamp precision in the revision", () => {
    const a = decodeApplication(
      "record-a",
      { ...stored, updated_at: new Timestamp(1790810460, 123456789) },
      "user-a",
    );
    const b = decodeApplication(
      "record-a",
      { ...stored, updated_at: new Timestamp(1790810460, 123456790) },
      "user-a",
    );
    expect(a.updated_at).toBe(b.updated_at);
    expect(a.revision).toBe("1790810460:123456789");
    expect(a.revision).not.toBe(b.revision);
  });
});
