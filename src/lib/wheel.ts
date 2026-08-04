import { apiFetch } from "@/lib/api";

export type WheelStatus = {
  spins_used_today: number;
  spins_remaining_today: number;
  max_spins_per_day: number;
};

export type WheelSpinResult = {
  id: number;
  date: string;
  credited_amount: string;
  currency_code: string;
  created_at: string;
  spins_remaining_today: number;
};

export function getWheelStatus() {
  return apiFetch<WheelStatus>("/api/wheel/status/");
}

export function spinWheel() {
  return apiFetch<WheelSpinResult>("/api/wheel/spin/", { method: "POST" });
}

export function getWheelHistory() {
  return apiFetch<WheelSpinResult[]>("/api/wheel/history/");
}
