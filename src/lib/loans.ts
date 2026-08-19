import { apiFetch } from "@/lib/api";

// Matches loans/serializers.py exactly.

export type LoanPlan = {
  id: number;
  name: string;
  price: string; // canonical KES price — for display, use price_local + currency_code instead
  price_local: string;
  currency_code: string;
  min_amount: string;
  max_amount: string;
  order: number;
  repayment_period_days: number;
};

export type LoanPlanPurchase = {
  id: number;
  loan_plan: LoanPlan;
  price_paid: string;
  purchased_at: string;
};

// has_plan=false means every other field is absent — always check that
// first (matches loans.serializers.LoanEligibilitySerializer exactly:
// min_amount/max_amount are only present when has_plan is true).
export type LoanEligibility =
  | { has_plan: false }
  | { has_plan: true; loan_plan: LoanPlan; min_amount: string; max_amount: string };

export type RepaymentStatus = "owing" | "paid" | "written_off";

export type LoanApplication = {
  id: number;
  loan_plan: LoanPlan;
  email: string;
  phone_number: string;
  country_name: string;
  full_name: string;
  age: number;
  source_of_income: string;
  repayment_method: string;
  security: string;
  amount: string;
  amount_owed: string;
  due_date: string; // "YYYY-MM-DD"
  repayment_status: RepaymentStatus;
  created_at: string;
};

/** Fields the applicant actually types — email/phone_number/country_name are auto-filled server-side, never sent from the client. */
export type LoanApplicationInput = {
  full_name: string;
  age: number;
  source_of_income: string;
  repayment_method: string;
  security?: string;
  amount: number | string;
};

export function getLoanPlans() {
  return apiFetch<LoanPlan[]>("/api/loans/plans/");
}

export function purchaseLoanPlan(planId: number) {
  return apiFetch<LoanPlanPurchase>(`/api/loans/plans/${planId}/purchase/`, { method: "POST" });
}

/** GET /api/loans/eligibility/ — call this before rendering the apply form; has_plan=false means show "plan needed, view plans" instead. */
export function getLoanEligibility() {
  return apiFetch<LoanEligibility>("/api/loans/eligibility/");
}

/** POST /api/loans/apply/ — credits account_balance immediately on success. No limit on repeat calls, even with an existing owing loan. */
export function applyForLoan(payload: LoanApplicationInput) {
  return apiFetch<LoanApplication>("/api/loans/apply/", { method: "POST", body: payload });
}

export function getMyLoanApplications() {
  return apiFetch<LoanApplication[]>("/api/loans/applications/");
}