import type { ReqScopeTrace } from "../types";
import { getTraceState } from "../utils";

type EndpointSummaryProps = {
  traces: ReqScopeTrace[];
};

type EndpointStats = {
  key: string;
  method: string;
  path: string;
  count: number;
  avgDuration: number;
  slowCount: number;
  errorCount: number;
};

export function EndpointSummary({ traces }: EndpointSummaryProps) {
  const endpointStats = createEndpointStats(traces);

  return (
    <section className="endpoint-summary">
      <div className="endpoint-summary-header">
        <span>Endpoint summary</span>
        <small>{endpointStats.length} routes</small>
      </div>

      {endpointStats.length === 0 ? (
        <div className="endpoint-empty">No endpoint data yet.</div>
      ) : (
        <div className="endpoint-table">
          <div className="endpoint-head">
            <span>Endpoint</span>
            <span>Requests</span>
            <span>Avg</span>
            <span>Slow</span>
            <span>Errors</span>
          </div>

          {endpointStats.map((item) => (
            <div key={item.key} className="endpoint-row">
              <div className="endpoint-route">
                <span>{item.method}</span>
                <strong>{item.path}</strong>
              </div>

              <span>{item.count}</span>
              <span>{item.avgDuration}ms</span>
              <span>{item.slowCount}</span>
              <span>{item.errorCount}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function createEndpointStats(traces: ReqScopeTrace[]): EndpointStats[] {
  const map = new Map<string, ReqScopeTrace[]>();

  for (const trace of traces) {
    const key = `${trace.method} ${trace.path.split("?")[0]}`;

    const current = map.get(key) ?? [];
    current.push(trace);

    map.set(key, current);
  }

  return Array.from(map.entries())
    .map(([key, items]) => {
      const first = items[0];
      const totalDuration = items.reduce(
        (sum, trace) => sum + (trace.duration ?? 0),
        0,
      );

      return {
        key,
        method: first.method,
        path: first.path.split("?")[0],
        count: items.length,
        avgDuration:
          items.length === 0 ? 0 : Math.round(totalDuration / items.length),
        slowCount: items.filter((trace) => getTraceState(trace) === "slow")
          .length,
        errorCount: items.filter((trace) => getTraceState(trace) === "error")
          .length,
      };
    })
    .sort((a, b) => b.count - a.count);
}
