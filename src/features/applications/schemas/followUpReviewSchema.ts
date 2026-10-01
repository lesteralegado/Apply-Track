import { z } from "zod";
import { isDateString, todayDate } from "../../../lib/dates";

export const followUpReviewOutcomes = [
  "reviewed",
  "waiting",
  "stopped",
] as const;

export function followUpReviewSchema(today = todayDate()) {
  return z
    .object({
      outcome: z.enum(followUpReviewOutcomes),
      nextFollowUpDate: z
        .string()
        .refine(
          (value) => !value || (isDateString(value) && value > today),
          "Choose a valid date after today, or leave it blank.",
        ),
    })
    .strict()
    .refine((value) => value.outcome !== "stopped" || !value.nextFollowUpDate, {
      message: "Stop following up cannot schedule another date.",
      path: ["nextFollowUpDate"],
    });
}
