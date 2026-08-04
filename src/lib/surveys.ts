import { apiFetch } from "@/lib/api";

export type SurveyQuestion = {
  id: number;
  text: string;
  options: string[];
};

export type SurveyAttemptResult = {
  id: number;
  date: string;
  score: number;
  credited_amount: string;
  currency_code: string;
  submitted_at: string;
};

export type TodaysSurveyResponse =
  | { available: false; reason: string; result?: SurveyAttemptResult }
  | { available: true; attempt_id: number; questions: SurveyQuestion[] };

export function getTodaysSurvey() {
  return apiFetch<TodaysSurveyResponse>("/api/surveys/today/");
}

export function submitSurvey(attemptId: number, answers: number[]) {
  return apiFetch<SurveyAttemptResult>("/api/surveys/submit/", {
    method: "POST",
    body: { attempt_id: attemptId, answers },
  });
}

export function getSurveyHistory() {
  return apiFetch<SurveyAttemptResult[]>("/api/surveys/history/");
}
