import { useLocalToday } from "../dashboard/hooks/useLocalToday";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { DemoBanner } from "./DemoBanner";
import { demoApplications } from "./demoApplications";
import { DashboardOverview } from "../dashboard/components/DashboardOverview";
import {
  ApplicationFilters,
  useApplicationFilters,
} from "../applications/components/ApplicationFilters";
import { ApplicationList } from "../applications/components/ApplicationList";
import { filterApplications } from "../applications/utils/filters";
import { EmptyState } from "../../components/ui/States";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { formatDate, formatTimestamp } from "../../lib/dates";
import type { Application } from "../applications/types";
export function DemoDashboard() {
  const [params] = useSearchParams();
  const filters = useApplicationFilters();
  const [viewing, setViewing] = useState<Application | null>(null);
  const today = useLocalToday();
  const applications = demoApplications(today);
  const items = filterApplications(
    applications,
    filters.search,
    filters.status,
  );
  const listView = params.get("view") === "applications";
  return (
    <AppShell demo>
      <DemoBanner />
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE CLARITY, EVERY DAY</span>
          <h1>
            {listView ? "Applications" : "Your next chapter"}
            <span className="title-period">.</span>
          </h1>
          <p>
            {listView
              ? "Every possibility deserves a place."
              : "Here's where your job search stands. Let's keep it moving."}
          </p>
        </div>
        <Link className="button primary" to="/sign-up">
          Make it your own <ArrowUpRight size={17} />
        </Link>
      </div>
      {!listView && (
        <DashboardOverview items={applications} today={today} demo />
      )}
      <section className="panel">
        <ApplicationFilters {...filters} />
        {items.length ? (
          <ApplicationList items={items} readOnly onView={setViewing} />
        ) : (
          <EmptyState
            title="No matching applications"
            text="Try changing your search or status filter."
          />
        )}
        <div className="list-footer">
          <span>{items.length} sample applications</span>
          <span>Most recently updated first</span>
        </div>
      </section>
      {viewing && (
        <Modal title={viewing.company} onClose={() => setViewing(null)}>
          <p className="detail-role">{viewing.job_title}</p>
          <Badge status={viewing.status} />
          <dl className="detail-dates">
            <div>
              <dt>Applied</dt>
              <dd>{formatDate(viewing.application_date)}</dd>
            </div>
            <div>
              <dt>Follow-up</dt>
              <dd>{formatDate(viewing.follow_up_date)}</dd>
            </div>
          </dl>
          {viewing.follow_up_review && (
            <p className="last-review">
              Last review:{" "}
              {
                {
                  reviewed: "Reviewed",
                  waiting: "Waiting",
                  stopped: "Stopped following up",
                }[viewing.follow_up_review.outcome]
              }
              {" · "}
              {formatTimestamp(viewing.follow_up_review.reviewed_at)}. Fictional
              review; the scheduled date determines the next check.
            </p>
          )}
          <h3>Notes</h3>
          <p className="notes-text">{viewing.notes || "No notes yet."}</p>
          <p className="form-hint">Fictional sample · Read-only</p>
        </Modal>
      )}
    </AppShell>
  );
}
