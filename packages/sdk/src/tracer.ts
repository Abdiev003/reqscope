import type { Request } from "express";
import { getCurrentTrace } from "./context";
import type { ReqScopeOptions, ReqScopeStep, ReqScopeTrace } from "./types";

type TraceableRequest = Request & {
  __reqscopeTrace?: ReqScopeTrace;
};

type TraceStepOptions = {
  slowThreshold?: number;
};

function getSlowThreshold(
  traceOptions?: Required<ReqScopeOptions>,
  stepOptions?: TraceStepOptions,
) {
  return stepOptions?.slowThreshold ?? traceOptions?.slowStepThreshold ?? 100;
}

function getTraceFromRequest(req: Request) {
  return (req as TraceableRequest).__reqscopeTrace;
}

function addStepToTrace(
  trace: ReqScopeTrace | undefined,
  name: string,
  duration: number,
  status: ReqScopeStep["status"],
  error?: unknown,
) {
  trace?.steps.push({
    name,
    duration,
    status,
    ...(error
      ? {
          error: error instanceof Error ? error.message : String(error),
        }
      : {}),
  } satisfies ReqScopeStep);
}

function runTraceStep<T>(
  trace: ReqScopeTrace | undefined,
  name: string,
  fn: () => T | Promise<T>,
  options: TraceStepOptions = {},
): T | Promise<T> {
  const startTime = Date.now();
  const slowThreshold = getSlowThreshold(trace?.options, options);

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result
        .then((value) => {
          const duration = Date.now() - startTime;
          const status = duration >= slowThreshold ? "slow" : "ok";

          addStepToTrace(trace, name, duration, status);

          return value;
        })
        .catch((error) => {
          const duration = Date.now() - startTime;

          addStepToTrace(trace, name, duration, "error", error);

          throw error;
        });
    }

    const duration = Date.now() - startTime;
    const status = duration >= slowThreshold ? "slow" : "ok";

    addStepToTrace(trace, name, duration, status);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    addStepToTrace(trace, name, duration, "error", error);

    throw error;
  }
}

/**
 * New API:
 * traceStep("stepName", fn)
 */
export function traceStep<T>(
  name: string,
  fn: () => T,
  options?: TraceStepOptions,
): T;

export function traceStep<T>(
  name: string,
  fn: () => Promise<T>,
  options?: TraceStepOptions,
): Promise<T>;

/**
 * Legacy API:
 * traceStep(req, "stepName", fn)
 */
export function traceStep<T>(
  req: Request,
  name: string,
  fn: () => T,
  options?: TraceStepOptions,
): T;

export function traceStep<T>(
  req: Request,
  name: string,
  fn: () => Promise<T>,
  options?: TraceStepOptions,
): Promise<T>;

export function traceStep<T>(
  reqOrName: Request | string,
  nameOrFn: string | (() => T | Promise<T>),
  fnOrOptions?: (() => T | Promise<T>) | TraceStepOptions,
  maybeOptions: TraceStepOptions = {},
): T | Promise<T> {
  if (typeof reqOrName === "string") {
    const name = reqOrName;
    const fn = nameOrFn as () => T | Promise<T>;
    const options = (fnOrOptions as TraceStepOptions | undefined) ?? {};

    return runTraceStep(getCurrentTrace(), name, fn, options);
  }

  const req = reqOrName;
  const name = nameOrFn as string;
  const fn = fnOrOptions as () => T | Promise<T>;

  return runTraceStep(getTraceFromRequest(req), name, fn, maybeOptions);
}
