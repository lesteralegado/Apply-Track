import { Timestamp } from "firebase/firestore";
import { z } from "zod";
import { applicationSchema } from "../schemas/applicationSchema";
import { followUpReviewOutcomes } from "../schemas/followUpReviewSchema";
import type { Application, ApplicationInput } from "../types";
const documentSchema = z
  .object({
    owner_id: z.string().min(1),
    company: z.string(),
    job_title: z.string(),
    job_url: z.string().nullable(),
    status: z.string(),
    application_date: z.string().nullable(),
    follow_up_date: z.string().nullable(),
    notes: z.string().nullable(),
    created_at: z.instanceof(Timestamp),
    updated_at: z.instanceof(Timestamp),
    follow_up_review: z
      .object({
        outcome: z.enum(followUpReviewOutcomes),
        reviewed_at: z.instanceof(Timestamp),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();
export function applicationValues(input: ApplicationInput) {
  const parsed = applicationSchema.parse(input);
  return {
    company: parsed.company,
    job_title: parsed.jobTitle,
    job_url: parsed.jobUrl || null,
    status: parsed.status,
    application_date: parsed.applicationDate || null,
    follow_up_date: parsed.followUpDate || null,
    notes: parsed.notes || null,
  };
}
export function decodeApplication(
  id: string,
  value: unknown,
  ownerId: string,
): Application {
  const data = documentSchema.parse(value);
  if (data.owner_id !== ownerId)
    throw new Error("Application ownership does not match this workspace.");
  // Validate stored data as well as form input.
  const validated = applicationSchema.parse({
    company: data.company,
    jobTitle: data.job_title,
    jobUrl: data.job_url ?? "",
    status: data.status,
    applicationDate: data.application_date ?? "",
    followUpDate: data.follow_up_date ?? "",
    notes: data.notes ?? "",
  });
  return {
    ...data,
    id,
    status: validated.status,
    created_at: data.created_at.toDate().toISOString(),
    updated_at: data.updated_at.toDate().toISOString(),
    revision: `${data.updated_at.seconds}:${data.updated_at.nanoseconds}`,
    follow_up_review: data.follow_up_review
      ? {
          outcome: data.follow_up_review.outcome,
          reviewed_at: data.follow_up_review.reviewed_at.toDate().toISOString(),
        }
      : null,
  };
}
