import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import {
  useApplications,
  useApplicationMutation,
} from "../features/applications/hooks/useApplications";
import {
  ApplicationFilters,
  useApplicationFilters,
} from "../features/applications/components/ApplicationFilters";
import { ApplicationList } from "../features/applications/components/ApplicationList";
import { filterApplications } from "../features/applications/utils/filters";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { Modal } from "../components/ui/Modal";
import type {
  Application,
  ApplicationStatus,
} from "../features/applications/types";
export function ApplicationsPage() {
  const query = useApplications();
  const mutation = useApplicationMutation();
  const filters = useApplicationFilters();
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const hasFilters = Boolean(filters.search.trim() || filters.status !== "all");
  const items = filterApplications(
    query.data ?? [],
    filters.search,
    filters.status,
  );
  async function status(item: Application, next: ApplicationStatus) {
    setActionError("");
    setMessage("");
    try {
      await mutation.mutateAsync({ kind: "status", id: item.id, status: next });
      setMessage("Application status updated.");
    } catch (e) {
      setActionError((e as Error).message);
    }
  }
  async function remove() {
    if (!deleting) return;
    setActionError("");
    setMessage("");
    try {
      await mutation.mutateAsync({ kind: "delete", id: deleting.id });
      setDeleting(null);
      setMessage("Application deleted.");
    } catch (e) {
      setActionError((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR OPPORTUNITIES</span>
          <h1>
            Applications<span className="title-period">.</span>
          </h1>
          <p>Every possibility deserves a place.</p>
        </div>
        <Link className="button primary" to="/app/applications/new">
          <Plus size={18} />
          Add application
        </Link>
      </div>
      <p className="sr-only" role="status">
        {message}
      </p>
      {actionError && !deleting && (
        <p className="error-banner" role="alert">
          {actionError}
        </p>
      )}
      <section className="panel">
        <ApplicationFilters {...filters} />
        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState
            message={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : items.length ? (
          <ApplicationList
            items={items}
            busy={mutation.isPending}
            onDelete={(item) => {
              setActionError("");
              setDeleting(item);
            }}
            onStatus={status}
          />
        ) : (
          <EmptyState
            title={
              hasFilters || query.data?.length
                ? "No matching applications"
                : "No applications yet"
            }
            text={
              hasFilters || query.data?.length
                ? "Try changing your search or status filter."
                : "Start tracking your job search by adding your first application."
            }
          >
            {!query.data?.length && !hasFilters && (
              <Link className="button primary" to="/app/applications/new">
                <Plus size={17} />
                Add application
              </Link>
            )}
          </EmptyState>
        )}
        <div className="list-footer">
          <span>
            {items.length} {items.length === 1 ? "application" : "applications"}
          </span>
          <span>Most recently updated first</span>
        </div>
      </section>
      <p className="list-hint">
        Moving a saved opportunity to another status records today as its
        application date. You can adjust it in Edit.
      </p>
      {deleting && (
        <Modal
          title="Delete application?"
          busy={mutation.isPending}
          onClose={() => setDeleting(null)}
        >
          <p>
            This will permanently remove your application for{" "}
            <strong>
              {deleting.job_title} at {deleting.company}
            </strong>
            .
          </p>
          {actionError && (
            <p className="error-banner" role="alert">
              {actionError}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={mutation.isPending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button
              className="button danger"
              disabled={mutation.isPending}
              onClick={remove}
            >
              {mutation.isPending ? "Deleting…" : "Delete application"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function ApplicationPageHeading({ edit }: { edit: boolean }) {
  return (
    <>
      <Link className="text-link back-link" to="/app/applications">
        <ArrowLeft size={16} />
        Back to applications
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ONE MORE OPPORTUNITY</span>
          <h1>
            {edit ? "Edit application" : "New application"}
            <span className="title-period">.</span>
          </h1>
          <p>
            {edit
              ? "Keep the details up to date."
              : "Save the details. Make room for what’s next."}
          </p>
        </div>
      </div>
    </>
  );
}
