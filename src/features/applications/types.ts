import type { applicationStatuses } from "../../lib/constants";
import type { applicationSchema } from "./schemas/applicationSchema";
import type { z } from "zod";
import type {
  followUpReviewOutcomes,
  followUpReviewSchema,
} from "./schemas/followUpReviewSchema";
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type FollowUpReviewOutcome = (typeof followUpReviewOutcomes)[number];
export interface FollowUpReview {
  outcome: FollowUpReviewOutcome;
  reviewed_at: string;
}
export type FollowUpReviewInput = z.infer<
  ReturnType<typeof followUpReviewSchema>
>;
export interface Application {
  id: string;
  owner_id: string;
  company: string;
  job_title: string;
  job_url: string | null;
  status: ApplicationStatus;
  application_date: string | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  revision: string;
  follow_up_review: FollowUpReview | null;
}
export type ApplicationInput = z.infer<typeof applicationSchema>;
