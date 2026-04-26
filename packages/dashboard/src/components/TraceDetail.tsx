import React from "react";
import { createCurlCommand } from "../curl";
import type { ReqScopeTrace } from "../types";
import {
  formatTraceDateTime,
  getStatusLabel,
  getStepSymbol,
  getTraceDurationBreakdown,
  getTraceState,
  getTraceStateLabel,
} from "../utils";
import { EmptyState } from "./EmptyState";
import { ProblemHints } from "./ProblemHints";

type TraceDetailProps = {
  trace: ReqScopeTrace | null;
};

export function TraceDetail({ trace }: TraceDetailProps) {
  const [view, setView] = React.useState<"overview" | "raw">("overview");
  const [copiedCurl, setCopiedCurl] = React.useState(false);

  React.useEffect(() => {
    setView("overview");
    setCopiedCurl(false);
  }, [trace?.id]);

  async function handleCopyCurl() {
    await navigator.clipboard.writeText(createCurlCommand(trace!));

    setCopiedCurl(true);

    window.setTimeout(() => {
      setCopiedCurl(false);
    }, 1200);
  }

  if (!trace) {
    return (
      <section className="trace-detail-panel">
        <EmptyState message="Select a request to inspect its trace." />
      </section>
    );
  }

  const state = getTraceState(trace);

  return (
    <section className="trace-detail-panel">
      <header className="trace-detail-header">
        <div>
          <div className="route-title">
            <span>{trace.method}</span>
            <h2>{trace.path}</h2>
          </div>

          <div className="trace-meta">
            <span>{getStatusLabel(trace.status)}</span>
            <span>Status {trace.status ?? "unknown"}</span>
            <span>{trace.duration ?? 0}ms</span>
            <span>{formatTraceDateTime(trace.startTime)}</span>
          </div>
        </div>

        <div className="detail-actions">
          <div className={`status-pill ${state}`}>
            {getTraceStateLabel(trace)}
          </div>

          <button className="copy-curl-button" onClick={handleCopyCurl}>
            {copiedCurl ? "Copied cURL" : "Copy as cURL"}
          </button>

          <div className="view-switch">
            <button
              className={view === "overview" ? "active" : ""}
              onClick={() => setView("overview")}
            >
              Overview
            </button>
            <button
              className={view === "raw" ? "active" : ""}
              onClick={() => setView("raw")}
            >
              Raw
            </button>
          </div>
        </div>
      </header>

      {view === "raw" ? (
        <RawTrace trace={trace} />
      ) : (
        <>
          <ProblemHints trace={trace} />

          <PayloadPreview trace={trace} />

          <DurationBreakdown trace={trace} />

          <div className="steps-table">
            <div className="steps-head">
              <span>Step</span>
              <span>Status</span>
              <span>Duration</span>
            </div>

            {trace.steps.length === 0 ? (
              <EmptyState message="No traced steps for this request." />
            ) : (
              trace.steps.map((step, index) => (
                <div
                  key={`${trace.id}-${step.name}-${index}`}
                  className={`step-row ${step.status}`}
                >
                  <div className="step-name">
                    <span className="step-symbol">{getStepSymbol(step)}</span>

                    <div>
                      <strong>{step.name}</strong>
                      {step.error ? <small>{step.error}</small> : null}
                    </div>
                  </div>

                  <span className={`step-status ${step.status}`}>
                    {step.status}
                  </span>

                  <strong className="step-duration">{step.duration}ms</strong>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

function PayloadPreview({ trace }: { trace: ReqScopeTrace }) {
  const requestHeaders = trace.request?.headers;
  const query = trace.request?.query;
  const requestBody = trace.request?.body;

  const responseHeaders = trace.response?.headers;
  const responseBody = trace.response?.body;

  const hasRequestHeaders = hasObjectValue(requestHeaders);
  const hasQuery = hasObjectValue(query);
  const hasRequestBody = hasObjectValue(requestBody);

  const hasResponseHeaders = hasObjectValue(responseHeaders);
  const hasResponseBody = responseBody !== undefined;

  if (
    !hasRequestHeaders &&
    !hasQuery &&
    !hasRequestBody &&
    !hasResponseHeaders &&
    !hasResponseBody
  ) {
    return null;
  }

  return (
    <section className="request-preview">
      {hasRequestHeaders ? (
        <PreviewBlock title="Request Headers" value={requestHeaders} />
      ) : null}

      {hasQuery ? <PreviewBlock title="Query" value={query} /> : null}

      {hasRequestBody ? (
        <PreviewBlock title="Request Body" value={requestBody} />
      ) : null}

      {hasResponseHeaders ? (
        <PreviewBlock title="Response Headers" value={responseHeaders} />
      ) : null}

      {hasResponseBody ? (
        <PreviewBlock title="Response Body" value={responseBody} />
      ) : null}
    </section>
  );
}

function PreviewBlock({
  title,
  value,
  style,
}: {
  title: string;
  value: unknown;
  style?: React.CSSProperties;
}) {
  return (
    <div className="preview-block" style={style}>
      <div className="preview-title">{title}</div>
      <pre>{formatPreviewValue(value)}</pre>
    </div>
  );
}

function RawTrace({ trace }: { trace: ReqScopeTrace }) {
  const [copied, setCopied] = React.useState(false);

  const rawJson = React.useMemo(() => {
    return JSON.stringify(trace, null, 2);
  }, [trace]);

  async function handleCopy() {
    await navigator.clipboard.writeText(rawJson);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1200);
  }

  return (
    <div className="raw-trace">
      <div className="raw-trace-header">
        <div>
          <span>Raw trace payload</span>
          <small>{trace.id}</small>
        </div>

        <button className="copy-button" onClick={handleCopy}>
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>

      <pre>{rawJson}</pre>
    </div>
  );
}

function DurationBreakdown({ trace }: { trace: ReqScopeTrace }) {
  const breakdown = getTraceDurationBreakdown(trace);

  if (trace.steps.length === 0 || breakdown.totalDuration === 0) {
    return null;
  }

  return (
    <section className="duration-breakdown">
      <div className="duration-breakdown-header">
        <span>Duration breakdown</span>
        <small>
          {breakdown.tracedDuration}ms traced · {breakdown.overheadDuration}ms
          overhead
        </small>
      </div>

      <div className="duration-stack">
        {trace.steps.map((step, index) => {
          const percentage =
            breakdown.totalDuration === 0
              ? 0
              : Math.max(2, (step.duration / breakdown.totalDuration) * 100);

          return (
            <div
              key={`${trace.id}-duration-${step.name}-${index}`}
              className={`duration-segment ${step.status}`}
              style={{ width: `${percentage}%` }}
              title={`${step.name}: ${step.duration}ms`}
            />
          );
        })}

        {breakdown.overheadDuration > 0 ? (
          <div
            className="duration-segment overhead"
            style={{
              width: `${Math.max(2, breakdown.overheadPercentage)}%`,
            }}
            title={`Overhead: ${breakdown.overheadDuration}ms`}
          />
        ) : null}
      </div>

      <div className="duration-legend">
        {trace.steps.map((step, index) => (
          <div key={`${trace.id}-legend-${step.name}-${index}`}>
            <span className={`legend-dot ${step.status}`} />
            <span>{step.name}</span>
            <strong>{step.duration}ms</strong>
          </div>
        ))}

        {breakdown.overheadDuration > 0 ? (
          <div>
            <span className="legend-dot overhead" />
            <span>Untraced overhead</span>
            <strong>{breakdown.overheadDuration}ms</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function hasObjectValue(value: unknown) {
  return (
    value &&
    typeof value === "object" &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}

function formatPreviewValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}
