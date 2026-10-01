import type { Application, ApplicationStatus } from "../types";
export function filterApplications(
  items: Application[],
  search: string,
  status: ApplicationStatus | "all",
): Application[] {
  const term = search.trim().toLowerCase();
  return items
    .filter(
      (item) =>
        (status === "all" || item.status === status) &&
        (item.company.toLowerCase().includes(term) ||
          item.job_title.toLowerCase().includes(term)),
    )
    .sort(
      (a, b) =>
        b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id),
    );
}
