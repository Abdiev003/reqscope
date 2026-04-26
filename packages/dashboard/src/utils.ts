import type { ReqScopeTrace, ReqScopeStep } from "./types";

export function getStatusLabel(status?: number) {
  if (!status) return "UNKNOWN";
  if (status === 304) return "NOT MODIFIED";
  if (status >= 500) return "ERROR";
  if (status >= 400) return "WARN";
  if (status >= 300) return "REDIRECT";
  return "OK";
}

export function getTraceState(trace: ReqScopeTrace) {
  if (trace.status && trace.status >= 500) {
    return "error";
  }

  if (trace.isSlow) {
    return "slow";
  }

  return "ok";
}

export function getTraceStateLabel(trace: ReqScopeTrace) {
  const state = getTraceState(trace);

  if (state === "error") return "Failed";
  if (state === "slow") return "Slow";

  return "OK";
}

export function getStepSymbol(step: ReqScopeStep) {
  if (step.status === "error") return "×";
  if (step.status === "slow") return "!";
  return "✓";
}

export function getTraceDurationBreakdown(trace: ReqScopeTrace) {
  const totalDuration = trace.duration ?? 0;

  const tracedDuration = trace.steps.reduce((sum, step) => {
    return sum + step.duration;
  }, 0);

  const overheadDuration = Math.max(totalDuration - tracedDuration, 0);

  return {
    totalDuration,
    tracedDuration,
    overheadDuration,
    tracedPercentage:
      totalDuration === 0
        ? 0
        : Math.round((tracedDuration / totalDuration) * 100),
    overheadPercentage:
      totalDuration === 0
        ? 0
        : Math.round((overheadDuration / totalDuration) * 100),
  };
}

export function formatTraceTime(timestamp?: number) {
  if (!timestamp) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

export function formatTraceDateTime(timestamp?: number) {
  if (!timestamp) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}
