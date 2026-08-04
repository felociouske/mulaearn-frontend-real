import { useEffect, useState } from "react";
import { getAvailableTasks, submitTask, type Task, taskTypeLabels } from "@/lib/tasks";
import { ApiError } from "@/lib/api";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submittingTaskId, setSubmittingTaskId] = useState<number | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(new Set());
  const [lastResult, setLastResult] = useState<{ taskId: number; message: string } | null>(null);

  useEffect(() => {
    getAvailableTasks()
      .then(setTasks)
      .catch(() => setError("Couldn't load tasks — please refresh the page."))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmitNonSurvey(task: Task) {
    setSubmittingTaskId(task.id);
    setError(null);
    try {
      const submission = await submitTask(task.id, {});
      setCompletedTaskIds((prev) => new Set(prev).add(task.id));
      setLastResult({ taskId: task.id, message: `Earned ${submission.amount_credited}!` });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit that task.");
    } finally {
      setSubmittingTaskId(null);
    }
  }

  async function handleSubmitSurvey(task: Task, questionId: number) {
    const answer = selectedAnswers[questionId];
    if (!answer) return;

    setSubmittingTaskId(task.id);
    setError(null);
    try {
      const submission = await submitTask(task.id, { question_id: questionId, answer });
      setCompletedTaskIds((prev) => new Set(prev).add(task.id));
      setLastResult({
        taskId: task.id,
        message: submission.is_correct ? `Correct! Earned ${submission.amount_credited}.` : "Not quite right — no payout for this one.",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit that answer.");
    } finally {
      setSubmittingTaskId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Tasks</h1>
      <p className="mt-1 text-sm text-white/50">Task types unlocked by your current plan.</p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-white/50">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-white/70">
          <p>No task types are unlocked on your current plan yet.</p>
          <a href="/plans" className="mt-2 inline-block font-medium text-dash-accent-500 hover:underline">
            View plans →
          </a>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {tasks.map((task) => {
            const isDone = completedTaskIds.has(task.id);
            const isSubmitting = submittingTaskId === task.id;
            return (
              <div key={task.id} className="rounded-lg bg-dash-surface p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                      {taskTypeLabels[task.task_type]}
                    </span>
                    <p className="mt-2 font-semibold text-white">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm text-white/50">{task.description}</p>}
                  </div>
                </div>

                {lastResult?.taskId === task.id && (
                  <p className="mt-3 text-sm text-dash-accent-500">{lastResult.message}</p>
                )}

                {task.task_type === "survey" ? (
                  <div className="mt-4 space-y-4">
                    {task.survey_questions.map((q) => (
                      <div key={q.id}>
                        <p className="text-sm text-white/80">{q.question_text}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {q.options.split(",").map((option) => {
                            const trimmed = option.trim();
                            const isSelected = selectedAnswers[q.id] === trimmed;
                            return (
                              <button
                                key={trimmed}
                                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: trimmed }))}
                                disabled={isDone}
                                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                                  isSelected ? "bg-dash-accent-500 text-dash-bg" : "bg-white/10 text-white hover:bg-white/20"
                                } disabled:opacity-50`}
                              >
                                {trimmed}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => handleSubmitSurvey(task, q.id)}
                          disabled={isDone || isSubmitting || !selectedAnswers[q.id]}
                          className="mt-3 rounded-md bg-dash-accent-500 px-4 py-1.5 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-50 transition-colors"
                        >
                          {isSubmitting ? "Submitting…" : "Submit answer"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-3">
                    {task.external_url && (
                      <a
                        href={task.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-dash-accent-500 hover:underline"
                      >
                        Open task →
                      </a>
                    )}
                    <button
                      onClick={() => handleSubmitNonSurvey(task)}
                      disabled={isDone || isSubmitting}
                      className="rounded-md bg-dash-accent-500 px-4 py-1.5 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-50 transition-colors"
                    >
                      {isDone ? "Completed" : isSubmitting ? "Submitting…" : "Mark complete"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}