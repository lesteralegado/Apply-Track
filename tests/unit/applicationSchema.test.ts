import { describe, expect, it } from "vitest";
import { applicationSchema } from "../../src/features/applications/schemas/applicationSchema";
const valid = {
  company: "Acme",
  jobTitle: "Developer",
  jobUrl: "",
  status: "saved",
  applicationDate: "",
  followUpDate: "",
  notes: "",
};
describe("application validation", () => {
  it("accepts a saved opportunity with no date or URL", () =>
    expect(applicationSchema.safeParse(valid).success).toBe(true));
  it.each(["company", "jobTitle"])("rejects whitespace-only %s", (key) =>
    expect(
      applicationSchema.safeParse({ ...valid, [key]: "   " }).success,
    ).toBe(false),
  );
  it.each(["applied", "interviewing", "offer", "rejected", "withdrawn"])(
    "requires date for %s",
    (status) =>
      expect(applicationSchema.safeParse({ ...valid, status }).success).toBe(
        false,
      ),
  );
  it.each([
    "javascript:alert(1)",
    "ftp://example.com",
    "example.com",
    "broken",
  ])("rejects unsafe/invalid URL %s", (jobUrl) =>
    expect(applicationSchema.safeParse({ ...valid, jobUrl }).success).toBe(
      false,
    ),
  );
  it("accepts a valid application and trims text", () =>
    expect(
      applicationSchema.parse({
        ...valid,
        company: "  Acme  ",
        status: "applied",
        applicationDate: "2026-10-01",
        jobUrl: "https://example.com/jobs",
      }).company,
    ).toBe("Acme"));
  it("rejects impossible dates", () =>
    expect(
      applicationSchema.safeParse({ ...valid, followUpDate: "2026-02-30" })
        .success,
    ).toBe(false));
});
