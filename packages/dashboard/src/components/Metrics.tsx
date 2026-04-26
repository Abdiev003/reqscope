import type { ReqScopeTrace } from "../types";

type MetricsProps = {
  traces: ReqScopeTrace[];
};

export function Metrics({ traces }: MetricsProps) {
  const total = traces.length;

  const errors = traces.filter(
    (trace) => trace.status && trace.status >= 500,
  ).length;

  const slow = traces.filter((trace) => trace.isSlow).length;

  const avgDuration =
    traces.length === 0
      ? 0
      : Math.round(
          traces.reduce((sum, trace) => sum + (trace.duration ?? 0), 0) /
            traces.length,
        );

  return (
    <section className="metrics">
      <Metric label="Requests" value={total} />
      <Metric label="Avg duration" value={`${avgDuration}ms`} />
      <Metric label="Slow" value={slow} />
      <Metric label="Errors" value={errors} danger />
    </section>
  );
}

function Metric({
  label,
  value,
  danger,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div className={`metric ${danger ? "danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
