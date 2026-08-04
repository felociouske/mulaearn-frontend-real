import { apiFetch } from "@/lib/api";

// Matches plans/serializers.py exactly (the previous version of this file
// was out of date — it had fields like unlocked_profile_count/unlocks_surveys
// that don't exist on the backend anymore, now that plans are split per
// category with a generic unlocked_item_count).
export type PlanCategory = "chat" | "app_review" | "movie_review";

export type PlanFeature = {
  id: number;
  description: string;
  order: number;
};

export type Plan = {
  id: number;
  category: PlanCategory;
  category_display: string;
  name: string;
  price: string; // canonical KES price — for display, use price_local + currency_code instead
  price_local: string;
  currency_code: string;
  tier_order: number;
  unlocked_item_count: number;
  cashback_percentage: string | null;
  features: PlanFeature[];
};

export type PlanPurchase = {
  id: number;
  plan: Plan;
  price_paid: string;
  is_active: boolean;
  purchased_at: string;
};

// GET /api/plans/me/ returns one active-plan-or-null PER CATEGORY, not a
// single plan — a user can hold an active plan in each category at once.
export type MyActivePlansByCategory = Record<PlanCategory, PlanPurchase | null>;

export function getPlans() {
  return apiFetch<Plan[]>("/api/plans/");
}

export function getPlansByCategory(category: PlanCategory) {
  return apiFetch<Plan[]>(`/api/plans/?category=${category}`);
}

export function getMyActivePlans() {
  return apiFetch<MyActivePlansByCategory>("/api/plans/me/");
}

export function purchasePlan(planId: number) {
  return apiFetch<PlanPurchase>(`/api/plans/${planId}/purchase/`, { method: "POST" });
}