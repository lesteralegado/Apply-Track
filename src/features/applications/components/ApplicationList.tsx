import { useLocalToday } from "../../dashboard/hooks/useLocalToday";
import { Link } from "react-router-dom";
import { ExternalLink, Pencil, Trash2, Eye } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import {
  formatDate,
  formatTimestamp,
  scheduledFollowUpState,
} from "../../../lib/dates";
import { applicationStatuses, statusLabels } from "../../../lib/constants";
import type { Application, ApplicationStatus } from "../types";
type Props = {
  items: Application[];
  readOnly?: boolean;
  busy?: boolean;
  onDelete?: (item: Application) => void;
  onView?: (item: Application) => void;
  onStatus?: (item: Application, status: ApplicationStatus) => void;
};
function FollowUp({ item, today }: { item: Application; today: string }) {
  const state = scheduledFollowUpState(item.follow_up_date, item.status, today);
  return (
    <span className={state === "overdue" ? "date-overdue" : ""}>
      {formatDate(item.follow_up_date)}
      {state === "overdue" && <small>Overdue</small>}
      {state === "today" && <small className="date-today">Today</small>}
    </span>
  );
}
function RowActions({
  item,
  readOnly,
  busy,
  onDelete,
  onView,
}: Props & { item: Application }) {
  return (
    <div className="row-actions">
      {readOnly ? (
        <button
          className="icon-button"
          aria-label={"View " + item.company}
          onClick={() => onView?.(item)}
        >
          <Eye size={16} />
        </button>
      ) : (
        <>
          <Link
            className="icon-button"
            aria-label={"Edit " + item.company}
            to={"/app/applications/" + item.id + "/edit"}
          >
            <Pencil size={16} />
          </Link>
          <button
            className="icon-button danger-icon"
            aria-label={"Delete " + item.company}
            disabled={busy}
            onClick={() => onDelete?.(item)}
          >
            <Trash2 size={16} />
          </button>
        </>
      )}
      {item.job_url && /^https?:\/\//.test(item.job_url) && (
        <a
          className="icon-button"
          href={item.job_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={"Open job link for " + item.company}
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}
export function ApplicationList(props: Props) {
  const { items, readOnly, busy, onStatus } = props;
  const today = useLocalToday();
  function statusControl(item: Application) {
    return readOnly ? (
      <Badge status={item.status} />
    ) : (
      <select
        className={"status-select status-" + item.status}
        aria-label={"Status for " + item.company}
        value={item.status}
        disabled={busy}
        onChange={(e) => onStatus?.(item, e.target.value as ApplicationStatus)}
      >
        {applicationStatuses.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
      </select>
    );
  }
  return (
    <>
      <div className="desktop-applications">
        <table>
          <caption className="sr-only">
            Job applications, most recently updated first
          </caption>
          <thead>
            <tr>
              <th>Company</th>
              <th>Job title</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Follow-up</th>
              <th>Updated</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} data-testid="application-row">
                <td>
                  <div className="company-cell">
                    <span
                      className={
                        "company-avatar avatar-" + (item.company.length % 5)
                      }
                    >
                      {item.company.slice(0, 1)}
                    </span>
                    <strong>{item.company}</strong>
                  </div>
                </td>
                <td>{item.job_title}</td>
                <td>{statusControl(item)}</td>
                <td>{formatDate(item.application_date)}</td>
                <td>
                  <FollowUp item={item} today={today} />
                </td>
                <td>{formatTimestamp(item.updated_at)}</td>
                <td>
                  <RowActions {...props} item={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-applications">
        {items.map((item) => (
          <article
            key={item.id}
            className="application-card"
            data-testid="application-card"
          >
            <div className="card-title">
              <span
                className={"company-avatar avatar-" + (item.company.length % 5)}
              >
                {item.company.slice(0, 1)}
              </span>
              <div>
                <h3>{item.company}</h3>
                <p>{item.job_title}</p>
              </div>
            </div>
            <div className="card-status">{statusControl(item)}</div>
            <dl>
              <div>
                <dt>Applied</dt>
                <dd>{formatDate(item.application_date)}</dd>
              </div>
              <div>
                <dt>Follow-up</dt>
                <dd>
                  <FollowUp item={item} today={today} />
                </dd>
              </div>
            </dl>
            <div className="card-actions">
              <span>Updated {formatTimestamp(item.updated_at)}</span>
              <RowActions {...props} item={item} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
