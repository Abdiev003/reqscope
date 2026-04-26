import type { Request, Response, NextFunction } from "express";
import type { ReqScopeOptions, ReqScopeTrace } from "./types";
import { printTrace } from "./logger";
import { addTrace, clearTraces, getTraces } from "./store";
import { sanitizeValue } from "./sanitize";
import { createPreview } from "./preview";
import { runWithTrace } from "./context";

const DEFAULT_OPTIONS: Required<ReqScopeOptions> = {
  enabled: process.env.NODE_ENV !== "production",
  slowRequestThreshold: 300,
  slowStepThreshold: 100,
  endpointPrefix: "/__reqscope",
  maxPreviewSize: 5000,
  maxTraces: 100,
  sensitiveFields: [
    "password",
    "pass",
    "token",
    "secret",
    "authorization",
    "cookie",
    "set-cookie",
    "apikey",
    "api_key",
    "access_token",
    "refresh_token",
  ],
};

function createTraceId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePrefix(prefix: string) {
  if (!prefix.startsWith("/")) {
    return `/${prefix}`;
  }

  return prefix.replace(/\/$/, "");
}

export function reqscope(options: ReqScopeOptions = {}) {
  const resolvedOptions: Required<ReqScopeOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    sensitiveFields: [
      ...DEFAULT_OPTIONS.sensitiveFields,
      ...(options.sensitiveFields ?? []),
    ],
  };

  resolvedOptions.endpointPrefix = normalizePrefix(
    resolvedOptions.endpointPrefix,
  );

  const tracesPath = `${resolvedOptions.endpointPrefix}/traces`;
  const clearPath = `${resolvedOptions.endpointPrefix}/clear`;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!resolvedOptions.enabled) {
      next();
      return;
    }

    if (req.path === tracesPath) {
      res.json(getTraces());
      return;
    }

    if (req.path === clearPath) {
      clearTraces();
      res.json({ ok: true });
      return;
    }

    const startTime = Date.now();

    const trace: ReqScopeTrace = {
      id: createTraceId(),
      method: req.method,
      path: req.originalUrl || req.url,
      startTime,
      steps: [],
      options: resolvedOptions,
      request: {
        query: sanitizeValue(req.query, resolvedOptions.sensitiveFields),
        body: sanitizeValue(req.body, resolvedOptions.sensitiveFields),
        headers: sanitizeValue(req.headers, resolvedOptions.sensitiveFields),
      },
      response: {},
    };

    (req as any).__reqscopeTrace = trace;

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = ((body: unknown) => {
      const sanitizedBody = sanitizeValue(
        body,
        resolvedOptions.sensitiveFields,
      );

      trace.response = {
        body: createPreview(sanitizedBody, resolvedOptions.maxPreviewSize),
      };

      return originalJson(body);
    }) as Response["json"];

    res.send = ((body: unknown) => {
      const sanitizedBody = sanitizeValue(
        body,
        resolvedOptions.sensitiveFields,
      );

      trace.response = {
        body: createPreview(sanitizedBody, resolvedOptions.maxPreviewSize),
      };

      return originalSend(body);
    }) as Response["send"];

    res.on("finish", () => {
      const endTime = Date.now();

      trace.endTime = endTime;
      trace.duration = endTime - startTime;
      trace.status = res.statusCode;
      trace.isSlow = trace.duration >= resolvedOptions.slowRequestThreshold;

      trace.response = {
        ...trace.response,
        headers: sanitizeValue(
          res.getHeaders(),
          resolvedOptions.sensitiveFields,
        ),
      };

      addTrace(trace, resolvedOptions.maxTraces);
      printTrace(trace);
    });

    runWithTrace(trace, () => {
      next();
    });
  };
}

export function reqscopeErrorHandler() {
  return (error: unknown, req: Request, _res: Response, next: NextFunction) => {
    const trace = (req as any).__reqscopeTrace as ReqScopeTrace | undefined;

    if (trace) {
      trace.steps.push({
        name: "unhandledError",
        duration: 0,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    next(error);
  };
}
