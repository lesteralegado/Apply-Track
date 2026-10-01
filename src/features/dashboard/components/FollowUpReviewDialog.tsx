import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../../components/ui/Modal";
import { followUpReviewSchema } from "../../applications/schemas/followUpReviewSchema";
import type {
  Application,
  FollowUpReviewInput,
} from "../../applications/types";
import { addDays, formatDate } from "../../../lib/dates";

export function FollowUpReviewDialog({
  application,
  today,
  busy,
  stale,
  error,
  onClose,
  onSubmit,
}: {
  application: Application;
  today: string;
  busy: boolean;
  stale: boolean;
  error: string;
  onClose: (refresh?: boolean) => void;
  onSubmit: (input: FollowUpReviewInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<FollowUpReviewInput>({
    // Read local today when validating, including submission after sleeping overnight.
    resolver: (values, context, options) =>
      zodResolver(followUpReviewSchema())(values, context, options),
    defaultValues: { outcome: "reviewed", nextFollowUpDate: "" },
  });
  useEffect(() => setFocus("outcome"), [setFocus]);
  const stopped = watch("outcome") === "stopped";
  const outcome = register("outcome");
  return (
    <Modal
      title={"Review follow-up: " + application.company}
      busy={busy}
      onClose={() => onClose()}
    >
      <p className="detail-role">{application.job_title}</p>
      <p>
        Scheduled for {formatDate(application.follow_up_date)}. Record your
        decision without changing the hiring stage.
      </p>
      <form
        className="review-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {stale ? (
          <div className="error-banner" role="alert">
            This application changed or is no longer due. Your draft is still
            here. Discard it and refresh to review the current task.
          </div>
        ) : error ? (
          <p className="error-banner" role="alert">
            {error}
          </p>
        ) : null}
        <fieldset disabled={busy || stale}>
          <legend className="sr-only">Follow-up review decision</legend>
          <div className="form-field">
            <label htmlFor="review-outcome">Review outcome</label>
            <select
              {...outcome}
              id="review-outcome"
              autoFocus
              onChange={(event) => {
                void outcome.onChange(event);
                if (event.target.value === "stopped")
                  setValue("nextFollowUpDate", "", { shouldValidate: true });
              }}
            >
              <option value="reviewed">Reviewed</option>
              <option value="waiting">Waiting</option>
              <option value="stopped">Stop following up</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="review-next-date">
              Next follow-up date <span className="optional">Optional</span>
            </label>
            <input
              {...register("nextFollowUpDate")}
              id="review-next-date"
              type="date"
              min={addDays(today, 1)}
              disabled={stopped || busy || stale}
              aria-invalid={Boolean(errors.nextFollowUpDate)}
              aria-describedby={
                errors.nextFollowUpDate
                  ? "review-date-help review-date-error"
                  : "review-date-help"
              }
            />
            <p className="field-help" id="review-date-help">
              {stopped
                ? "The scheduled date will be cleared. You can schedule another follow-up later in the application editor."
                : "Leave blank to finish this task, or choose a date after today for another check."}
            </p>
            {errors.nextFollowUpDate && (
              <span className="field-error" id="review-date-error" role="alert">
                {errors.nextFollowUpDate.message}
              </span>
            )}
          </div>
          <p className="form-hint">
            A review does not mean a message was sent. Your application status
            and notes stay unchanged.
          </p>
        </fieldset>
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => onClose()}
          >
            Cancel
          </button>
          {stale ? (
            <button
              type="button"
              className="button primary"
              onClick={() => onClose(true)}
            >
              Discard draft and refresh
            </button>
          ) : (
            <button className="button primary" disabled={busy} type="submit">
              {busy ? "Saving review…" : "Save review"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
