import { apiFetch } from "@/lib/api";

export type DepositRequest = {
  id: number;
  method: string;
  amount: string;
  currency_code: string;
  proof_message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type WithdrawalRequest = {
  id: number;
  wallet_type: "account" | "yield";
  amount: string;
  currency_code: string;
  destination_details: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export function getMyDeposits() {
  return apiFetch<DepositRequest[]>("/api/payments/deposits/");
}

export function createDeposit(payload: { amount: string; currency_code: string; proof_message: string }) {
  return apiFetch<DepositRequest>("/api/payments/deposits/create/", { method: "POST", body: payload });
}

export type STKPushResponse = {
  deposit_id: number;
  checkout_request_id: string;
  message: string;
};

export function initiateSTKPush(amount: number) {
  return apiFetch<STKPushResponse>("/api/payments/deposits/stkpush/", {
    method: "POST",
    body: { amount },
  });
}

export function getDepositStatus(depositId: number) {
  return apiFetch<DepositRequest>(`/api/payments/deposits/${depositId}/status/`);
}

export function getMyWithdrawals() {
  return apiFetch<WithdrawalRequest[]>("/api/payments/withdrawals/");
}

export function createWithdrawal(payload: {
  wallet_type: "account" | "yield";
  amount: string;
  currency_code: string;
}) {
  return apiFetch<WithdrawalRequest>("/api/payments/withdrawals/create/", { method: "POST", body: payload });
}