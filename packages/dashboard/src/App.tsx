import React from "react";
import { clearTraces, fetchTraces } from "./api";
import { Metrics } from "./components/Metrics";
import { RequestList } from "./components/RequestList";
import { Topbar } from "./components/Topbar";
import { TraceDetail } from "./components/TraceDetail";
import { EndpointSummary } from "./components/EndpointSummary";
import type { ReqScopeTrace } from "./types";

export function App() {
  const [traces, setTraces] = React.useState<ReqScopeTrace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = React.useState<string | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | null>(
    null,
  );
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(true);

  async function loadTraces() {
    try {
      setLoading(true);

      const data = await fetchTraces();

      setConnectionError(null);
      setTraces(data);

      setSelectedTraceId((currentSelectedTraceId) => {
        if (data.length === 0) {
          return null;
        }

        const selectedTraceStillExists = data.some(
          (trace) => trace.id === currentSelectedTraceId,
        );

        if (selectedTraceStillExists) {
          return currentSelectedTraceId;
        }

        return data[0].id;
      });
    } catch (error) {
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Failed to connect to ReqScope API",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    try {
      await clearTraces();
      setSelectedTraceId(null);
      await loadTraces();
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : "Failed to clear traces",
      );
    }
  }

  React.useEffect(() => {
    loadTraces();
  }, []);

  React.useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }

    const interval = setInterval(loadTraces, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  const selectedTrace =
    traces.find((trace) => trace.id === selectedTraceId) ?? traces[0] ?? null;

  return (
    <main className="app-shell">
      <Topbar
        loading={loading}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() =>
          setAutoRefreshEnabled((currentValue) => !currentValue)
        }
        onRefresh={loadTraces}
        onClear={handleClear}
      />

      {connectionError ? (
        <div className="connection-error">
          <strong>Cannot connect to ReqScope API</strong>
          <span>{connectionError}</span>
          <small>
            Make sure your backend is running and VITE_REQSCOPE_API_URL points
            to the correct server.
          </small>
        </div>
      ) : null}

      <Metrics traces={traces} />

      <EndpointSummary traces={traces} />

      <section className="workspace">
        <RequestList
          traces={traces}
          selectedTraceId={selectedTrace?.id ?? null}
          onSelectTrace={setSelectedTraceId}
        />

        <TraceDetail trace={selectedTrace} />
      </section>
    </main>
  );
}
