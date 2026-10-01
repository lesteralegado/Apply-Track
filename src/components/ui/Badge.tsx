import type { ApplicationStatus } from "../../features/applications/types";
import { statusLabels } from "../../lib/constants";
export function Badge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={"badge status-" + status}>
      <span aria-hidden="true" className="badge-dot" />
      {statusLabels[status]}
    </span>
  );
}
