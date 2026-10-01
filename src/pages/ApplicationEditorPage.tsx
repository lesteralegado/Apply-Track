import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  useApplication,
  useApplicationMutation,
} from "../features/applications/hooks/useApplications";
import { useAuth } from "../features/auth/hooks/useAuth";
import { auth } from "../lib/firebase/client";
import { ApplicationForm } from "../features/applications/components/ApplicationForm";
import { ApplicationConflictError } from "../features/applications/api/applications";
import { ApplicationPageHeading } from "./ApplicationsPage";
import { formatTimestamp } from "../lib/dates";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import type {
  Application,
  ApplicationInput,
} from "../features/applications/types";

export function ApplicationEditorPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  return (
    <ApplicationEditor key={user?.uid + ":" + id} id={id} ownerId={user?.uid} />
  );
}

function ApplicationEditor({ id, ownerId }: { id: string; ownerId?: string }) {
  const query = useApplication(id);
  const mutation = useApplicationMutation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [conflicted, setConflicted] = useState(false);
  const [draftApplication, setDraftApplication] = useState<Application>();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // The loaded revision belongs to these form defaults. Refetching cannot upgrade
  // the revision while leaving the old date/notes in an unsaved draft.
  if (!draftApplication && query.data) setDraftApplication(query.data);
  async function submit(input: ApplicationInput) {
    setError("");
    try {
      await mutation.mutateAsync(
        id
          ? {
              kind: "update",
              id,
              expectedRevision: draftApplication!.revision,
              input,
            }
          : { kind: "create", input },
      );
      if (mounted.current && auth?.currentUser?.uid === ownerId) {
        navigate("/app/applications");
      }
    } catch (e) {
      if (!mounted.current || auth?.currentUser?.uid !== ownerId) return;
      setError((e as Error).message);
      setConflicted(e instanceof ApplicationConflictError);
    }
  }
  return (
    <div className="editor-page">
      <ApplicationPageHeading edit={Boolean(id)} />
      <section className="panel form-panel">
        {id && !draftApplication && query.isPending ? (
          <LoadingState text="Loading application…" />
        ) : id && !draftApplication && query.isError ? (
          <ErrorState
            message={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : id && !draftApplication ? (
          <EmptyState
            title="Application unavailable"
            text="This record may have been deleted, or it does not belong to your account."
          >
            <Link className="button secondary" to="/app/applications">
              Back to applications
            </Link>
          </EmptyState>
        ) : (
          <>
            {query.data?.follow_up_review && (
              <p className="last-review">
                Last review:{" "}
                {
                  {
                    reviewed: "Reviewed",
                    waiting: "Waiting",
                    stopped: "Stopped following up",
                  }[query.data.follow_up_review.outcome]
                }
                {" · "}
                {formatTimestamp(query.data.follow_up_review.reviewed_at)}. This
                describes the last review. The follow-up date determines the
                next check.
              </p>
            )}
            <ApplicationForm
              application={draftApplication}
              onSubmit={submit}
              busy={mutation.isPending}
              error={error}
            />
            {conflicted && (
              <button
                className="button secondary"
                onClick={() => window.location.reload()}
              >
                Discard draft and reload application
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
