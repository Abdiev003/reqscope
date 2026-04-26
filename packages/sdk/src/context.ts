import { AsyncLocalStorage } from "node:async_hooks";
import type { ReqScopeTrace } from "./types";

const traceStorage = new AsyncLocalStorage<ReqScopeTrace>();

export function runWithTrace<T>(trace: ReqScopeTrace, fn: () => T): T {
  return traceStorage.run(trace, fn);
}

export function getCurrentTrace() {
  return traceStorage.getStore();
}
