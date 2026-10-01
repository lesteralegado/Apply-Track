import { z } from "zod";
import { applicationStatuses } from "../../../lib/constants";
import { isDateString } from "../../../lib/dates";
const optionalDate = z
  .string()
  .refine((value) => !value || isDateString(value), "Enter a valid date.");
export const applicationSchema = z
  .object({
    company: z.string().trim().min(1, "Enter the company name."),
    jobTitle: z.string().trim().min(1, "Enter the job title."),
    jobUrl: z
      .string()
      .trim()
      .refine((value) => {
        if (!value) return true;
        try {
          return ["https:", "http:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, "Enter a complete URL starting with https:// or http://."),
    status: z.enum(applicationStatuses),
    applicationDate: optionalDate,
    followUpDate: optionalDate,
    notes: z.string().trim(),
  })
  .refine(
    (value) => value.status === "saved" || Boolean(value.applicationDate),
    {
      message: "Add an application date for this status.",
      path: ["applicationDate"],
    },
  );
