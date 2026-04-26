import type { ReqScopeTrace } from "../types";
import { getTraceDurationBreakdown } from "../utils";

type ProblemHintsProps = {
  trace: ReqScopeTrace;
};

type Hint = {
  type: "error" | "slow" | "info";
  title: string;
  description: string;
};

export function ProblemHints({ trace }: ProblemHintsProps) {
  const hints = createProblemHints(trace);

  if (hints.length === 0) {
    return null;
  }

  return (
    <section className="problem-hints">
      <div className="problem-hints-header">
        <span>Problem hints</span>
        <small>{hints.length} detected</small>
      </div>

      <div className="problem-hints-list">
        {hints.map((hint, index) => (
          <article
            key={`${hint.type}-${hint.title}-${index}`}
            className={`hint ${hint.type}`}
          >
            <div className="hint-icon">{getHintIcon(hint.type)}</div>

            <div>
              <strong>{hint.title}</strong>
              <p>{hint.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function createProblemHints(trace: ReqScopeTrace): Hint[] {
  const hints: Hint[] = [];

  if (trace.status && trace.status >= 500) {
    hints.push({
      type: "error",
      title: "Request failed",
      description: `This request returned HTTP ${trace.status}. Check the failed step or response body for more context.`,
    });
  }

  const failedSteps = trace.steps.filter((step) => step.status === "error");

  const seenErrorMessages = new Set<string>();

  for (const step of failedSteps) {
    const errorMessage =
      step.error ??
      "This step threw an error, but no error message was captured.";

    const normalizedErrorMessage = errorMessage.trim().toLowerCase();

    const isUnhandledDuplicate =
      step.name === "unhandledError" &&
      normalizedErrorMessage.length > 0 &&
      seenErrorMessages.has(normalizedErrorMessage);

    if (isUnhandledDuplicate) {
      continue;
    }

    seenErrorMessages.add(normalizedErrorMessage);

    hints.push({
      type: "error",
      title:
        step.name === "unhandledError"
          ? "Unhandled request error"
          : `Step failed: ${step.name}`,
      description: errorMessage,
    });
  }

  if (trace.isSlow) {
    hints.push({
      type: "slow",
      title: "Slow request",
      description: `This request took ${trace.duration ?? 0}ms. Check the slowest step below.`,
    });
  }

  const slowestStep = findSlowestStep(trace);

  if (slowestStep && trace.duration) {
    const percentage = Math.round(
      (slowestStep.duration / trace.duration) * 100,
    );

    if (percentage >= 50) {
      hints.push({
        type: slowestStep.status === "error" ? "error" : "slow",
        title: `Most time spent in ${slowestStep.name}`,
        description: `${slowestStep.name} took ${slowestStep.duration}ms, about ${percentage}% of the request duration.`,
      });
    }
  }

  const breakdown = getTraceDurationBreakdown(trace);

  if (breakdown.overheadPercentage >= 30 && breakdown.overheadDuration >= 50) {
    hints.push({
      type: "info",
      title: "Untraced overhead detected",
      description: `${breakdown.overheadDuration}ms was spent outside traced steps. Consider wrapping more operations with traceStep().`,
    });
  }

  return hints;
}

function findSlowestStep(trace: ReqScopeTrace) {
  if (trace.steps.length === 0) {
    return null;
  }

  return trace.steps.reduce((slowest, current) => {
    return current.duration > slowest.duration ? current : slowest;
  }, trace.steps[0]);
}

function getHintIcon(type: Hint["type"]) {
  if (type === "error") return "×";
  if (type === "slow") return "!";
  return "i";
}
