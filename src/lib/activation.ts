import { apiFetch } from "@/lib/api";

export type GatewayGroup = "kenya" | "uganda_tanzania" | "ghana_nigeria" | "other";

type BaseGateway = {
  id: number;
  group: GatewayGroup;
  display_name: string;
  // The one guide shown on BOTH the activation page and the deposit page —
  // edited in one place (admin), rendered identically in both.
  description: string;
  order: number;
};

export type KenyaGateway = BaseGateway & {
  group: "kenya";
  is_automatic: boolean;
  till_number: string;
  paybill_number: string;
  account_reference: string;
};

export type UgandaTanzaniaGateway = BaseGateway & {
  group: "uganda_tanzania";
  recipient_name: string;
  recipient_phone: string;
};

export type GhanaNigeriaGateway = BaseGateway & {
  group: "ghana_nigeria";
  eversend_link: string;
  recipient_name: string;
};

export type OtherGateway = BaseGateway & {
  group: "other";
  recipient_name: string;
  recipient_phone: string;
};

// Discriminated union on `group` — narrow with `if (gateway.group === "kenya")`
// etc. and TypeScript gives you the right fields automatically.
export type PaymentGateway = KenyaGateway | UgandaTanzaniaGateway | GhanaNigeriaGateway | OtherGateway;

export type ActivationSubmissionStatus = "pending" | "approved" | "rejected";

export type ActivationSubmission = {
  id: number;
  // Snapshots taken at submission time — survive the gateway row later
  // being edited/deleted, so history always shows what was true then.
  gateway_group: GatewayGroup | "";
  gateway_display_name: string;
  amount: string; // DRF serializes DecimalField as a string
  currency_code: string;
  reference_code: string;
  proof_message: string;
  status: ActivationSubmissionStatus;
  admin_notes: string;
  created_at: string;
  reviewed_at: string | null;
};

/** GET /api/activation/gateways/ — active payment options for the caller's own country. Empty array = not covered yet ("Coming soon"). */
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