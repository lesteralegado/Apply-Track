import { LoaderCircle, Inbox, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
export function LoadingState({
  text = "Loading your applications…",
}: {
  text?: string;
}) {
  return (
    <div className="state loading-state" role="status">
      <LoaderCircle className="spin" size={24} />
      <p>{text}</p>
      <div className="skeleton" />
    </div>
  );
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state" role="alert">
      <TriangleAlert size={28} />
      <h2>Let's try that again</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="button secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="state">
      <Inbox size={30} />
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
