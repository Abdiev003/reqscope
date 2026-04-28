import type { ReqScopeTrace } from "./types";

const DEFAULT_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "";

export const API_BASE_URL =
  import.meta.env.VITE_REQSCOPE_API_URL ?? DEFAULT_BASE_URL;

export const IS_DEMO_MODE =
  !import.meta.env.DEV && !import.meta.env.VITE_REQSCOPE_API_URL;

export async function fetchTraces(): Promise<ReqScopeTrace[]> {
  const response = await fetch(`${API_BASE_URL}/__reqscope/traces`);

  if (!response.ok) {
    throw new Error("Failed to fetch traces");
  }

  return response.json();
}

export async function clearTraces(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/__reqscope/clear`);

  if (!response.ok) {
    throw new Error("Failed to clear traces");
  }
}
