import type { Application, ApplicationStatus } from "../applications/types";
import { addDays, todayDate } from "../../lib/dates";
export function demoApplications(today = todayDate()): Application[] {
  const samples: [string, string, ApplicationStatus, number | null][] = [
    ["Forma Studio", "Frontend Developer", "interviewing", 0],
    ["Northstar Labs", "Full-stack Developer", "applied", 2],
    ["Bloom Digital", "React Developer", "offer", 3],
    ["Orbit Systems", "Software Engineer", "applied", -2],
    ["Kindred", "Junior Web Developer", "saved", null],
    ["Paperplane", "Frontend Engineer", "interviewing", 5],
    ["Fieldwork", "Full-stack Developer", "rejected", null],
    ["Morrow", "UI Engineer", "applied", 9],
  ];
  return samples.map(([company, job_title, status, follow], i) => ({
    id: "demo-" + i,
    owner_id: "fictional-demo",
    follow_up_review:
      i === 0 || i === 1 || i === 4
        ? {
            outcome: i === 0 ? "reviewed" : i === 1 ? "waiting" : "stopped",
            reviewed_at: addDays(today, -1) + "T12:00:00Z",
          }
        : null,
    revision: "fictional-" + i,
    company,
    job_title,
    status,
    job_url: null,
    application_date: status === "saved" ? null : addDays(today, -i - 2),
    follow_up_date: follow === null ? null : addDays(today, follow),
    notes: [
      "Prepare a short walkthrough of my portfolio and recent projects.",
      "Follow up with the hiring team about next steps.",
      "Review the offer and prepare questions.",
    ][i % 3],
    created_at: addDays(today, -i - 2) + "T12:00:00Z",
    updated_at: addDays(today, -i) + "T12:00:00Z",
  }));
}
