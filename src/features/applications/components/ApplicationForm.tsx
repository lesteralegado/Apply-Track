import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { applicationSchema } from "../schemas/applicationSchema";
import { applicationStatuses, statusLabels } from "../../../lib/constants";
import type { Application, ApplicationInput } from "../types";
type Props = {
  application?: Application;
  onSubmit: (values: ApplicationInput) => Promise<void>;
  error?: string;
  busy: boolean;
};
export function ApplicationForm({ application, onSubmit, error, busy }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      company: application?.company ?? "",
      jobTitle: application?.job_title ?? "",
      jobUrl: application?.job_url ?? "",
      status: application?.status ?? "saved",
      applicationDate: application?.application_date ?? "",
      followUpDate: application?.follow_up_date ?? "",
      notes: application?.notes ?? "",
    },
  });
  const status = watch("status");
  const inputProps = (name: keyof ApplicationInput) => ({
    ...register(name),
    id: name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? name + "-error" : undefined,
  });
  const fieldError = (name: keyof ApplicationInput) =>
    errors[name] && (
      <span id={name + "-error"} className="field-error">
        {errors[name]?.message}
      </span>
    );
  return (
    <form
      className="application-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <fieldset disabled={busy}>
        <legend className="sr-only">Application information</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="company">
              Company <span>*</span>
            </label>
            <input
              {...inputProps("company")}
              placeholder="e.g. Northstar Labs"
              autoComplete="organization"
              autoFocus
            />
            {fieldError("company")}
          </div>
          <div className="form-field">
            <label htmlFor="jobTitle">
              Job title <span>*</span>
            </label>
            <input
              {...inputProps("jobTitle")}
              placeholder="e.g. Full-stack Developer"
            />
            {fieldError("jobTitle")}
          </div>
          <div className="form-field full-width">
            <label htmlFor="jobUrl">
              Job URL <span className="optional">Optional</span>
            </label>
            <input
              {...inputProps("jobUrl")}
              type="url"
              placeholder="https://company.com/careers/role"
            />
            {fieldError("jobUrl")}
          </div>
          <div className="form-field full-width">
            <label htmlFor="status">
              Status <span>*</span>
            </label>
            <select {...inputProps("status")}>
              {applicationStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            {fieldError("status")}
          </div>
          <div className="form-field">
            <label htmlFor="applicationDate">
              Application date{" "}
              {status !== "saved" ? (
                <span>*</span>
              ) : (
                <span className="optional">Optional</span>
              )}
            </label>
            <input {...inputProps("applicationDate")} type="date" />
            {fieldError("applicationDate")}
          </div>
          <div className="form-field">
            <label htmlFor="followUpDate">
              Follow-up date <span className="optional">Optional</span>
            </label>
            <input {...inputProps("followUpDate")} type="date" />
            {fieldError("followUpDate")}
          </div>
          <div className="form-field full-width">
            <label htmlFor="notes">
              Notes <span className="optional">Optional</span>
            </label>
            <textarea
              {...inputProps("notes")}
              rows={5}
              placeholder="People to contact, interview prep, or anything worth remembering…"
            />
            {fieldError("notes")}
          </div>
        </div>
      </fieldset>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <p className="form-hint">
        Follow-ups appear in your dashboard. Dates use your local calendar.
      </p>
      <div className="form-footer">
        {busy ? (
          <button className="button secondary" disabled>
            Cancel
          </button>
        ) : (
          <Link className="button secondary" to="/app/applications">
            Cancel
          </Link>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : application ? "Save changes" : "Save application"}
        </button>
      </div>
    </form>
  );
}
