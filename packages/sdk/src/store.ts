import type { ReqScopeTrace } from "./types";

const traces: ReqScopeTrace[] = [];

export function addTrace(trace: ReqScopeTrace, maxTraces: number) {
  traces.unshift(trace);

  if (traces.length > maxTraces) {
    traces.length = maxTraces;
  }
}

export function getTraces() {
  return traces;
}

export function clearTraces() {
  traces.length = 0;
}
