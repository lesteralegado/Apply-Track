import { describe, expect, it } from "vitest";
import { followUpReviewSchema } from "../../src/features/applications/schemas/followUpReviewSchema";

describe("follow-up review input", () => {
  const schema = followUpReviewSchema("2026-10-01");
  it.each(["reviewed", "waiting"])(
    "allows %s without a next date",
    (outcome) => {
      expect(schema.parse({ outcome, nextFollowUpDate: "" })).toEqual({
        outcome,
        nextFollowUpDate: "",
      });
      expect(
        schema.safeParse({ outcome, nextFollowUpDate: "2026-10-02" }).success,
      ).toBe(true);
    },
  );
  it.each(["2026-10-01", "2026-09-30", "2026-02-30", "tomorrow"])(
    "rejects a non-future or malformed next date: %s",
    (nextFollowUpDate) => {
      expect(
        schema.safeParse({ outcome: "waiting", nextFollowUpDate }).success,
      ).toBe(false);
    },
  );
  it("stops without scheduling another obligation", () => {
    expect(
      schema.safeParse({ outcome: "stopped", nextFollowUpDate: "" }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ outcome: "stopped", nextFollowUpDate: "2026-10-02" })
        .success,
    ).toBe(false);
  });
  it("rejects unknown outcomes and fields", () => {
    expect(
      schema.safeParse({ outcome: "emailed", nextFollowUpDate: "" }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        outcome: "reviewed",
        nextFollowUpDate: "",
        status: "withdrawn",
      }).success,
    ).toBe(false);
  });
  it("revalidates when local today changes", () => {
    const input = { outcome: "waiting", nextFollowUpDate: "2026-10-02" };
    expect(schema.safeParse(input).success).toBe(true);
    expect(followUpReviewSchema("2026-10-02").safeParse(input).success).toBe(
      false,
    );
  });
});
