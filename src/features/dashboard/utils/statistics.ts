import type { Application } from "../../applications/types";
import { scheduledFollowUpState } from "../../../lib/dates";
import { applicationStatuses } from "../../../lib/constants";
export function dashboardStatistics(items: Application[]) {
  return {
    total: items.length,
    ...Object.fromEntries(
      applicationStatuses.map((status) => [
        status,
        items.filter((item) => item.status === status).length,
      ]),
    ),
  } as Record<(typeof applicationStatuses)[number] | "total", number>;
}
function orderFollowUps(a: Application, b: Application) {
  return (
    a.follow_up_date!.localeCompare(b.follow_up_date!) ||
    a.company.localeCompare(b.company) ||
    a.id.localeCompare(b.id)
  );
}
export function dueFollowUps(items: Application[], today: string) {
  return items
    .filter((item) => {
      const state = scheduledFollowUpState(
        item.follow_up_date,
        item.status,
        today,
      );
      return state === "overdue" || state === "today";
    })
    .sort(orderFollowUps);
}
export function upcomingFollowUps(items: Application[], today: string) {
  return items
    .filter(
      (item) =>
        scheduledFollowUpState(item.follow_up_date, item.status, today) ===
        "upcoming",
    )
    .sort(orderFollowUps);
}
