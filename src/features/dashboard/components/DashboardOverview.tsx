import {
  BriefcaseBusiness,
  Send,
  MessagesSquare,
  CheckCheck,
  XCircle,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  dueFollowUps,
  upcomingFollowUps,
  dashboardStatistics,
} from "../utils/statistics";
import { followUpState, formatDate } from "../../../lib/dates";
import type { Application } from "../../applications/types";

export function DashboardOverview({
  items,
  demo = false,
  today,
  onReview,
  isReviewBlocked = () => false,
  complete = true,
  refreshing = false,
}: {
  items: Application[];
  demo?: boolean;
  today: string;
  onReview?: (item: Application) => void;
  isReviewBlocked?: (item: Application) => boolean;
  complete?: boolean;
  refreshing?: boolean;
}) {
  const statistics = dashboardStatistics(items);
  const due = dueFollowUps(items, today);
  const upcoming = upcomingFollowUps(items, today);
  const cards = [
    {
      label: "Total applications",
      value: statistics.total,
      icon: BriefcaseBusiness,
      kind: "total",
      note: "Every opportunity, in one place",
    },
    {
      label: "Applied",
      value: statistics.applied,
      icon: Send,
      kind: "applied",
      note: "Waiting to hear back",
    },
    {
      label: "Interviewing",
      value: statistics.interviewing,
      icon: MessagesSquare,
      kind: "interviewing",
      note: "Conversations in progress",
    },
    {
      label: "Offers",
      value: statistics.offer,
      icon: CheckCheck,
      kind: "offer",
      note: "Your hard work paying off",
    },
    {
      label: "Rejected",
      value: statistics.rejected,
      icon: XCircle,
      kind: "rejected",
      note: "On to the next opportunity",
    },
  ];
  return (
    <>
      <div className="stats-grid">
        {cards.map(({ label, value, icon: Icon, kind, note }) => (
          <article key={kind} className={"stat-card stat-" + kind}>
            <div className="stat-label">
              {label}
              <Icon size={18} />
            </div>
            <strong>{String(value).padStart(2, "0")}</strong>
            <span className="stat-note">{note}</span>
          </article>
        ))}
      </div>

      <section
        className="panel followups-panel"
        aria-labelledby="followups-title"
      >
        <div className="panel-heading">
          <div>
            <h2 id="followups-title" tabIndex={-1} data-review-heading>
              <CalendarDays size={19} />
              Today's follow-up review
            </h2>
            <p>Review overdue follow-ups and those due today.</p>
          </div>
          <span className="subtle-pill">{due.length} DUE</span>
        </div>
        {due.length ? (
          <div className="followup-list">
            {due.map((item) => (
              <FollowUpRow item={item} today={today} key={item.id}>
                {!demo && onReview && (
                  <button
                    className="button secondary review-action"
                    type="button"
                    data-review-action
                    aria-label={"Review follow-up for " + item.company}
                    disabled={isReviewBlocked(item)}
                    onClick={() => onReview(item)}
                  >
                    {isReviewBlocked(item) ? "Saved" : "Review"}
                  </button>
                )}
              </FollowUpRow>
            ))}
          </div>
        ) : complete ? (
          <div className="review-complete">
            <h3 tabIndex={-1} data-review-completion>
              Today's follow-up review is complete
            </h3>
            <p>No scheduled follow-ups are due today.</p>
          </div>
        ) : (
          <p className="review-guidance">
            {refreshing
              ? "Refreshing today's follow-ups…"
              : "Refresh applications to verify today's queue."}
          </p>
        )}
        <p className="review-guidance">
          Applications without a follow-up date aren't included. Add a date in
          the application editor when you want another check.
        </p>
      </section>
      <section
        className="panel followups-panel"
        aria-labelledby="upcoming-title"
      >
        <div className="panel-heading">
          <div>
            <h2 id="upcoming-title">Upcoming follow-ups</h2>
            <p>The next seven days, separate from today's review.</p>
          </div>
        </div>
        {upcoming.length ? (
          <div className="followup-list">
            {upcoming.map((item) => (
              <FollowUpRow item={item} today={today} key={item.id} />
            ))}
          </div>
        ) : (
          <p className="review-guidance">
            No follow-ups scheduled in the next seven days.
          </p>
        )}
      </section>
      <div className="section-heading">
        <div>
          <h2>Recent applications</h2>
          <p>Your latest opportunities at a glance.</p>
        </div>
        <Link
          className="text-link"
          to={demo ? "/demo?view=applications" : "/app/applications"}
        >
          View all <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}

function FollowUpRow({
  item,
  today,
  children,
}: {
  item: Application;
  today: string;
  children?: React.ReactNode;
}) {
  const state = followUpState(item.follow_up_date, today);
  return (
    <div className="followup-item">
      <span className={"followup-marker marker-" + state} aria-hidden="true" />
      <div className="followup-description">
        <strong>{item.company}</strong>
        <span>{item.job_title}</span>
      </div>
      <span className={"followup-date date-" + state}>
        {state === "today" ? "Today" : formatDate(item.follow_up_date)}
        <small>
          {state === "overdue"
            ? "Overdue"
            : state === "today"
              ? "Due today"
              : "Upcoming"}
        </small>
      </span>
      {children}
    </div>
  );
}
