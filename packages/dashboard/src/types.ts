export type ReqScopeStep = {
  name: string;
  duration: number;
  status: "ok" | "slow" | "error";
  error?: string;
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
  startTime?: number;
  endTime?: number;
  isSlow?: boolean;
  steps: ReqScopeStep[];
  request?: ReqScopeRequestPreview;
  response?: ReqScopeResponsePreview;
};
