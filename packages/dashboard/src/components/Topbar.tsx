type TopbarProps = {
  loading: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onClear: () => void;
};

export function Topbar({
  loading,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onRefresh,
  onClear,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <div className="brand-row">
          <span className="brand-mark" />
          <span className="brand-kicker">ReqScope</span>
        </div>

        <h1>API request tracing for local development.</h1>

        <p>
          Inspect request duration, failed flows, and slow internal steps
          without leaving your dev environment.
        </p>
      </div>

      <div className="topbar-actions">
        <button className="btn secondary" onClick={onToggleAutoRefresh}>
          {autoRefreshEnabled ? "Pause auto-refresh" : "Resume auto-refresh"}
        </button>

        <button className="btn secondary" onClick={onClear}>
          Clear
        </button>

        <button className="btn primary" onClick={onRefresh}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </header>
  );
}
