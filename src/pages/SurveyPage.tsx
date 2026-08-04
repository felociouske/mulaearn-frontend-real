import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { StarIcon, TrendingUpIcon, ClipboardIcon } from "@/components/icons/Icons";
import {
  getTodaysSurvey,
  submitSurvey,
  type SurveyQuestion,
  type SurveyAttemptResult,
} from "@/lib/surveys";

type ViewState =
  | { kind: "loading" }
  | { kind: "unavailable"; reason: string; result?: SurveyAttemptResult }
  | { kind: "in_progress"; attemptId: number; questions: SurveyQuestion[] }
  | { kind: "result"; result: SurveyAttemptResult };

export default function SurveyPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getTodaysSurvey()
      .then((res) => {
        if (res.available) {
          setState({ kind: "in_progress", attemptId: res.attempt_id, questions: res.questions });
        } else {
          setState({ kind: "unavailable", reason: res.reason, result: res.result });
        }
      })
      .catch(() => setError("Couldn't load today's survey — please refresh the page."));
  }, []);

  async function handleSubmit() {
    if (state.kind !== "in_progress") return;
    const orderedAnswers = state.questions.map((q) => answers[q.id] ?? -1);

    if (orderedAnswers.some((a) => a === -1)) {
      setError("Please answer every question before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitSurvey(state.attemptId, orderedAnswers);
      setState({ kind: "result", result });
      if (Number(result.credited_amount) > 0) {
        toast.success(`You scored ${result.score}/10 and earned ${user?.country?.currency_symbol ?? ""} ${result.credited_amount}!`);
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Survey Questions</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        10 questions, live every Monday, Wednesday and Friday. Score all 10 to earn the top payout.
      </p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {state.kind === "loading" && <p className="mt-8 text-dash-text/50">Loading…</p>}

      {state.kind === "unavailable" && (
        <div className="mt-8 rounded-lg bg-dash-surface p-6">
          <p className="text-dash-text/70">{state.reason}</p>
          {state.result && (
            <div className="mt-4 rounded-md bg-dash-accent-500/10 p-4">
              <p className="text-sm text-dash-text/70">
                You scored <span className="font-semibold text-dash-text">{state.result.score}/10</span> and earned{" "}
                <span className="font-semibold text-dash-accent-500">
                  {currencySymbol} {state.result.credited_amount}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {state.kind === "result" && (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-center">
          <div className="flex justify-center text-dash-accent-500">
            {state.result.score === 10 ? (
              <StarIcon size={40} filled />
            ) : state.result.score >= 4 ? (
              <TrendingUpIcon size={40} />
            ) : (
              <ClipboardIcon size={40} className="text-dash-text/40" />
            )}
          </div>
          <p className="mt-3 text-lg font-semibold text-dash-text">
            You scored {state.result.score}/10
          </p>
          <p className="mt-1 text-2xl font-bold text-dash-accent-500">
            {currencySymbol} {state.result.credited_amount} credited
          </p>
          <p className="mt-2 text-sm text-dash-text/50">Come back Monday, Wednesday, or Friday for the next one.</p>
        </div>
      )}

      {state.kind === "in_progress" && (
        <div className="mt-6 space-y-5">
          {state.questions.map((q, i) => (
            <div key={q.id} className="rounded-lg bg-dash-surface p-5">
              <p className="text-sm font-medium text-dash-text">
                {i + 1}. {q.text}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                      answers[q.id] === optionIndex
                        ? "border-dash-accent-500 bg-dash-accent-500/10 text-dash-text"
                        : "border-dash-border text-dash-text/70 hover:bg-dash-overlay"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      className="sr-only"
                      checked={answers[q.id] === optionIndex}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-md bg-dash-accent-500 px-4 py-3 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting…" : "Submit answers"}
          </button>
        </div>
      )}
    </div>
  );
}