import React from "react";
import { API_BASE_URL } from "../api";

type SampleRequest = {
  label: string;
  method: "GET" | "POST";
  path: string;
  body?: unknown;
};

const SAMPLE_REQUESTS: SampleRequest[] = [
  { label: "GET /slow", method: "GET", path: "/slow" },
  { label: "GET /error", method: "GET", path: "/error" },
  {
    label: "POST /login",
    method: "POST",
    path: "/login",
    body: { email: "ali@example.com", password: "secret123" },
  },
];

export function DemoControls() {
  const [busyLabel, setBusyLabel] = React.useState<string | null>(null);

  async function send(sample: SampleRequest) {
    setBusyLabel(sample.label);

    try {
      await fetch(`${API_BASE_URL}${sample.path}`, {
        method: sample.method,
        headers: sample.body ? { "Content-Type": "application/json" } : {},
        body: sample.body ? JSON.stringify(sample.body) : undefined,
      });
    } catch {
      // Errors from /error endpoint are expected; ignore network failures too.
    } finally {
      setBusyLabel(null);
    }
  }

  return (
    <section className="demo-controls">
      <div>
        <strong>Try it</strong>
        <span>Send a sample request, then watch the trace appear below.</span>
      </div>

      <div className="demo-controls-actions">
        {SAMPLE_REQUESTS.map((sample) => (
          <button
            key={sample.label}
            className="btn secondary"
            onClick={() => send(sample)}
            disabled={busyLabel !== null}
          >
            {busyLabel === sample.label ? "Sending..." : sample.label}
          </button>
        ))}
      </div>
    </section>
  );
}
