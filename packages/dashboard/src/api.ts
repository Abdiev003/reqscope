import type { ReqScopeTrace } from "./types";

export const API_BASE_URL =
  import.meta.env.VITE_REQSCOPE_API_URL ?? "http://localhost:3000";

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
