import type { Request } from "express";
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
  req: Request,
  name: string,
  fn: () => T | Promise<T>,
  options: TraceStepOptions = {},
): T | Promise<T> {
  const startTime = Date.now();

  const traceReq = req as TraceableRequest;
  const trace = traceReq.__reqscopeTrace;

  const slowThreshold = getSlowThreshold(trace?.options, options);

  function addStep(
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

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result
        .then((value) => {
          const duration = Date.now() - startTime;
          const status = duration >= slowThreshold ? "slow" : "ok";

          addStep(duration, status);

          return value;
        })
        .catch((error) => {
          const duration = Date.now() - startTime;

          addStep(duration, "error", error);

          throw error;
        });
    }

    const duration = Date.now() - startTime;
    const status = duration >= slowThreshold ? "slow" : "ok";

    addStep(duration, status);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    addStep(duration, "error", error);

    throw error;
  }
}
