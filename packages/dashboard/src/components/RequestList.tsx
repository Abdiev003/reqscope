import React from "react";
import type { ReqScopeTrace } from "../types";
import { formatTraceTime, getTraceState, getTraceStateLabel } from "../utils";
import { EmptyState } from "./EmptyState";

type RequestListProps = {
  traces: ReqScopeTrace[];
  selectedTraceId: string | null;
  onSelectTrace: (id: string) => void;
};

type FilterValue = "all" | "ok" | "slow" | "error";
type SortValue = "newest" | "slowest" | "errors";

export function RequestList({
  traces,
  selectedTraceId,
  onSelectTrace,
}: RequestListProps) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<FilterValue>("all");
  const [sort, setSort] = React.useState<SortValue>("newest");

  const filteredTraces = traces
    .filter((trace) => {
      const state = getTraceState(trace);

      const matchesFilter = filter === "all" || state === filter;

      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        trace.path.toLowerCase().includes(normalizedSearch) ||
        trace.method.toLowerCase().includes(normalizedSearch) ||
        String(trace.status ?? "").includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "slowest") {
        return (b.duration ?? 0) - (a.duration ?? 0);
      }

      if (sort === "errors") {
        const aIsError = a.status && a.status >= 500 ? 1 : 0;
        const bIsError = b.status && b.status >= 500 ? 1 : 0;

        if (aIsError !== bIsError) {
          return bIsError - aIsError;
        }

        return (b.duration ?? 0) - (a.duration ?? 0);
      }

      return 0;
    });

  const selectedTraceIsHidden =
    selectedTraceId !== null &&
    filteredTraces.length > 0 &&
    !filteredTraces.some((trace) => trace.id === selectedTraceId);

  return (
    <aside className="request-list-panel">
      <div className="panel-title">
        <span>Requests</span>
        <small>{traces.length} captured</small>
      </div>

      <div className="request-controls">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search requests..."
        />

        <div className="filter-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={filter === "ok" ? "active" : ""}
            onClick={() => setFilter("ok")}
          >
            OK
          </button>

          <button
            className={filter === "slow" ? "active" : ""}
            onClick={() => setFilter("slow")}
          >
            Slow
          </button>

          <button
            className={filter === "error" ? "active" : ""}
            onClick={() => setFilter("error")}
          >
            Error
          </button>
        </div>

        <div className="sort-row">
          <span>Sort</span>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortValue)}
          >
            <option value="newest">Newest</option>
            <option value="slowest">Slowest</option>
            <option value="errors">Errors first</option>
          </select>
        </div>
      </div>

      {selectedTraceIsHidden ? (
        <div className="selection-hidden-note">
          Selected request is hidden by current filters.
        </div>
      ) : null}

      {traces.length === 0 ? (
        <EmptyState message="Send a request to your API." />
      ) : filteredTraces.length === 0 ? (
        <EmptyState message="No requests match your filters." />
      ) : (
        <div className="request-list">
          {filteredTraces.map((trace) => {
            const state = getTraceState(trace);

            return (
              <button
                key={trace.id}
                className={`request-item ${
                  selectedTraceId === trace.id ? "active" : ""
                }`}
                onClick={() => onSelectTrace(trace.id)}
              >
                <div className="request-left">
                  <span className={`state-dot ${state}`} />

                  <div>
                    <strong>
                      {trace.method} {trace.path}
                    </strong>

                    <small>
                      {getTraceStateLabel(trace)} ·{" "}
                      {formatTraceTime(trace.startTime)}
                    </small>
                  </div>
                </div>

                <div className="request-right">
                  <span>{trace.status ?? "—"}</span>
                  <strong>{trace.duration ?? 0}ms</strong>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
