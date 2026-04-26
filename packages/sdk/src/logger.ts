import type { ReqScopeTrace, ReqScopeStep } from "./types";

function getStatusLabel(status?: number) {
  if (!status) return "UNKNOWN";

  if (status === 304) return "NOT_MODIFIED";
  if (status >= 500) return "ERROR";
  if (status >= 400) return "WARN";
  if (status >= 300) return "REDIRECT";

  return "OK";
}

function getStepIcon(step: ReqScopeStep) {
  if (step.status === "error") return "❌";
  if (step.status === "slow") return "🐢";

  return "✅";
}

function getPerformanceLabel(trace: ReqScopeTrace) {
  if (trace.status && trace.status >= 500) return "FAILED";
  if (trace.isSlow) return "SLOW";

  return "NORMAL";
}

export function printTrace(trace: ReqScopeTrace) {
  const statusLabel = getStatusLabel(trace.status);
  const performanceLabel = getPerformanceLabel(trace);

  console.log("");
  console.log("┌────────────────────────────────────────────");
  console.log(`│ ReqScope ${statusLabel}`);
  console.log(`│ ${trace.method} ${trace.path}`);
  console.log(
    `│ Status: ${trace.status ?? "unknown"} | Duration: ${trace.duration ?? 0}ms`,
  );
  console.log(`│ Performance: ${performanceLabel}`);
  console.log("├────────────────────────────────────────────");

  if (trace.steps.length === 0) {
    console.log("│ No traced steps");
  }

  for (const step of trace.steps) {
    console.log(`│ ${getStepIcon(step)} ${step.name} — ${step.duration}ms`);

    if (step.error) {
      console.log(`│    Error: ${step.error}`);
    }
  }

  console.log("└────────────────────────────────────────────");
  console.log("");
}
