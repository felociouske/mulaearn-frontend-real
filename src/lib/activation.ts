import { apiFetch } from "@/lib/api";

export type PaymentGateway = {
  id: number;
  method_type: string;
  display_name: string;
  is_automatic: boolean;
  till_number: string;
  paybill_number: string;
  account_reference: string;
  recipient_name: string;
  recipient_phone: string;
  instructions: string;
  order: number;
};

export type ActivationSubmissionStatus = "pending" | "approved" | "rejected";

export type ActivationSubmission = {
  id: number;
  gateway: PaymentGateway | null;
  method_type: string;
  amount: string; // DRF serializes DecimalField as a string
  currency_code: string;
  reference_code: string;
  proof_message: string;
  status: ActivationSubmissionStatus;
  admin_notes: string;
  created_at: string;
  reviewed_at: string | null;
};

/** GET /api/activation/gateways/ — active payment options for the caller's own country. Empty array = not covered yet. */
export function getActivationGateways() {
  return apiFetch<PaymentGateway[]>("/api/activation/gateways/");
}

/** GET /api/activation/submissions/ — the caller's own activation payment history, most recent first. */
export function getActivationSubmissions() {
  return apiFetch<ActivationSubmission[]>("/api/activation/submissions/");
}

/** POST /api/activation/submit/ — submit proof of an activation payment for admin review. */
export function submitActivation(payload: {
  gateway_id: number;
  reference_code: string;
  proof_message?: string;
}) {
  return apiFetch<ActivationSubmission>("/api/activation/submit/", {
    method: "POST",
    body: payload,
  });
}
