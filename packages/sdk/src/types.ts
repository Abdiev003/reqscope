export type ReqScopeStepStatus = "ok" | "error" | "slow";

export type ReqScopeStep = {
  name: string;
  duration: number;
  status: ReqScopeStepStatus;
  error?: string;
};

export type ReqScopeOptions = {
  enabled?: boolean;
  slowRequestThreshold?: number;
  slowStepThreshold?: number;
  endpointPrefix?: string;
  sensitiveFields?: string[];
  maxPreviewSize?: number;
  maxTraces?: number;
};

export type ReqScopeRequestPreview = {
  query?: unknown;
  body?: unknown;
  headers?: unknown;
};

export type ReqScopeResponsePreview = {
  body?: unknown;
  headers?: unknown;
};

export type ReqScopeTrace = {
  id: string;
  method: string;
  path: string;
  status?: number;
  duration?: number;
  startTime: number;
  endTime?: number;
  steps: ReqScopeStep[];
  isSlow?: boolean;
  options: Required<ReqScopeOptions>;
  request?: ReqScopeRequestPreview;
  response?: ReqScopeResponsePreview;
};
