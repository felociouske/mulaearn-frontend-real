import { apiFetch } from "@/lib/api";

export type SurveyQuestion = {
  id: number;
  question_text: string;
  options: string;
};

export type Task = {
  id: number;
  task_type: "survey" | "video" | "review" | "ebook" | "ad";
  title: string;
  description: string;
  external_url: string;
  survey_questions: SurveyQuestion[];
};

export type TaskSubmission = {
  id: number;
  task: number;
  is_correct: boolean | null;
  amount_credited: string;
  submitted_at: string;
};

export function getAvailableTasks() {
  return apiFetch<Task[]>("/api/tasks/");
}

export function submitTask(taskId: number, payload: { question_id?: number; answer?: string }) {
  return apiFetch<TaskSubmission>(`/api/tasks/${taskId}/submit/`, {
    method: "POST",
    body: payload,
  });
}

export const taskTypeLabels: Record<Task["task_type"], string> = {
  survey: "Survey",
  video: "Video",
  review: "Review",
  ebook: "Ebook",
  ad: "Ad",
};