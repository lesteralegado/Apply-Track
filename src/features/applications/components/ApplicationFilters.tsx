import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { applicationStatuses, statusLabels } from "../../../lib/constants";
import type { ApplicationStatus } from "../types";
export function useApplicationFilters() {
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get("status");
  const status: ApplicationStatus | "all" = applicationStatuses.includes(
    rawStatus as ApplicationStatus,
  )
    ? (rawStatus as ApplicationStatus)
    : "all";
  const search = params.get("search") ?? "";
  function update(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (!value || value === "all") next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }
  function clear() {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("search");
        next.delete("status");
        return next;
      },
      { replace: true },
    );
  }
  return { search, status, update, clear };
}
export function ApplicationFilters({
  search,
  status,
  update,
  clear,
}: ReturnType<typeof useApplicationFilters>) {
  return (
    <div className="list-toolbar">
      <div className="search-field">
        <Search size={18} />
        <label className="sr-only" htmlFor="application-search">
          Search company or role
        </label>
        <input
          id="application-search"
          type="search"
          placeholder="Search company or role…"
          value={search}
          onChange={(e) => update("search", e.target.value)}
        />
      </div>
      <div className="filter-field">
        <SlidersHorizontal size={16} />
        <label className="sr-only" htmlFor="status-filter">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="all">All statuses</option>
          {applicationStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>
      {(search || status !== "all") && (
        <button className="text-button" onClick={clear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
