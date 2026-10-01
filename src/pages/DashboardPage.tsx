import { useEffect, useRef, useState } from "react";
import { useLocalToday } from "../features/dashboard/hooks/useLocalToday";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { DashboardOverview } from "../features/dashboard/components/DashboardOverview";
import { FollowUpReviewDialog } from "../features/dashboard/components/FollowUpReviewDialog";
import {
  useApplications,
  useApplicationMutation,
} from "../features/applications/hooks/useApplications";
import { ApplicationConflictError } from "../features/applications/api/applications";
import { useAuth } from "../features/auth/hooks/useAuth";
import { auth } from "../lib/firebase/client";
import { dueFollowUps } from "../features/dashboard/utils/statistics";
import type {
  Application,
  FollowUpReviewInput,
} from "../features/applications/types";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";
import { formatTimestamp } from "../lib/dates";

export function DashboardPage() {
  const { user } = useAuth();
  return <Dashboard key={user?.uid} ownerId={user?.uid} />;
}

function Dashboard({ ownerId }: { ownerId?: string }) {
  const query = useApplications();
  const mutation = useApplicationMutation();
  const today = useLocalToday();
  const [selection, setSelection] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [conflicted, setConflicted] = useState(false);
  const [receipts, setReceipts] = useState<{ id: string; revision: string }[]>(
    [],
  );
  const [saved, setSaved] = useState("");
  const [moveFocus, setMoveFocus] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const items = query.data ?? [];
  const due = dueFollowUps(items, today);
  const current = selection && due.find((item) => item.id === selection.id);
  const stale = Boolean(
    selection &&
    (conflicted || !current || current.revision !== selection.revision),
  );
  // A receipt covers only the acknowledged old task. A fresh revision may be due again.
  const blocked = (item: Application) =>
    receipts.some(
      (receipt) => receipt.id === item.id && receipt.revision === item.revision,
    );
  const unresolvedReceipt = receipts.some((receipt) =>
    items.some(
      (item) => item.id === receipt.id && item.revision === receipt.revision,
    ),
  );
  const complete =
    query.isSuccess &&
    !query.isFetching &&
    !mutation.isPending &&
    !unresolvedReceipt &&
    due.length === 0;

  useEffect(() => {
    if (!moveFocus || selection || query.isFetching || mutation.isPending)
      return;
    const target =
      root.current?.querySelector<HTMLElement>(
        "[data-review-action]:not(:disabled)",
      ) ??
      root.current?.querySelector<HTMLElement>("[data-review-completion]") ??
      root.current?.querySelector<HTMLElement>("[data-review-heading]");
    target?.focus();
    if (target && query.isSuccess && !unresolvedReceipt) setMoveFocus(false);
  }, [
    moveFocus,
    selection,
    query.isFetching,
    mutation.isPending,
    query.dataUpdatedAt,
    query.isSuccess,
    unresolvedReceipt,
  ]);

  useEffect(() => {
    if (!query.isSuccess || query.isFetching) return;
    setReceipts((previous) => {
      const unresolved = previous.filter((receipt) =>
        query.data.some(
          (item) =>
            item.id === receipt.id && item.revision === receipt.revision,
        ),
      );
      return unresolved.length === previous.length ? previous : unresolved;
    });
  }, [query.data, query.isSuccess, query.isFetching, receipts]);
  function select(application: Application) {
    setError("");
    setConflicted(false);
    setSelection(application);
  }
  function close(refresh = false) {
    setSelection(null);
    setError("");
    setConflicted(false);
    if (refresh) void query.refetch();
  }
  async function save(input: FollowUpReviewInput) {
    if (!selection || stale || blocked(selection)) return;
    const selected = selection;
    setError("");
    try {
      await mutation.mutateAsync({
        kind: "review",
        id: selected.id,
        expectedRevision: selected.revision,
        input,
      });
      if (!mounted.current || auth?.currentUser?.uid !== ownerId) return;
      setReceipts((previous) => [
        ...previous,
        { id: selected.id, revision: selected.revision },
      ]);
      setSaved("Review saved for " + selected.company + ".");
      setSelection(null);
      setMoveFocus(true);
    } catch (failure) {
      if (!mounted.current || auth?.currentUser?.uid !== ownerId) return;
      setError((failure as Error).message);
      setConflicted(failure instanceof ApplicationConflictError);
    }
  }
  return (
    <div ref={root}>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE CLARITY, EVERY DAY</span>
          <h1>
            Your next chapter<span className="title-period">.</span>
          </h1>
          <p>Here's where your job search stands. Let's keep it moving.</p>
        </div>
        <Link className="button primary" to="/app/applications/new">
          <Plus size={18} />
          Add application
        </Link>
      </div>
      {saved && (
        <p className="success-banner" role="status">
          {saved}
        </p>
      )}
      {query.isPending && !query.data ? (
        <LoadingState />
      ) : query.isError && !query.data ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          {query.isError && (
            <div className="error-banner" role="alert">
              {saved
                ? "Your review was saved, but we couldn't refresh your applications."
                : "We couldn't refresh your applications. Showing the last loaded records."}{" "}
              <button
                className="button secondary"
                onClick={() => void query.refetch()}
              >
                Refresh applications
              </button>
            </div>
          )}
          <DashboardOverview
            items={items}
            today={today}
            onReview={select}
            isReviewBlocked={blocked}
            complete={complete}
            refreshing={query.isFetching}
          />
          <section className="panel">
            {items.length ? (
              <div className="recent-list">
                {items.slice(0, 5).map((item) => (
                  <Link
                    className="recent-item"
                    key={item.id}
                    to={"/app/applications/" + item.id + "/edit"}
                  >
                    <div>
                      <strong>{item.company}</strong>
                      <span>{item.job_title}</span>
                    </div>
                    <Badge status={item.status} />
                    <span className="recent-date">
                      {formatTimestamp(item.updated_at)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No applications yet"
                text="Add your first opportunity to bring your workspace to life."
              >
                <Link className="button primary" to="/app/applications/new">
                  Add application
                </Link>
              </EmptyState>
            )}
          </section>
        </>
      )}
      {selection && (
        <FollowUpReviewDialog
          application={selection}
          today={today}
          busy={mutation.isPending}
          stale={stale}
          error={error}
          onClose={close}
          onSubmit={save}
        />
      )}
    </div>
  );
}
