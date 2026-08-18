import { apiFetch } from "@/lib/api";

export type ReferralCommission = {
  id: number;
  referred_username: string;
  source: "plan_purchase" | "activation";
  source_display: string;
  amount: string;
  created_at: string;
};

export type ReferralSummary = {
  referral_code: string;
  total_referred_users: number;
  paying_referrals: number;
  total_commission_earned: string;
};

export function getMyCommissions() {
  return apiFetch<ReferralCommission[]>("/api/referrals/commissions/");
}

export function getMyReferralSummary() {
  return apiFetch<ReferralSummary>("/api/referrals/summary/");
}

export type ReferredUser = {
  id: number;
  email: string;
  phone_number: string;
  date_joined: string;
  is_activated: boolean;
  commission_earned: string;
};

export function getReferredUsers() {
  return apiFetch<ReferredUser[]>("/api/referrals/referred-users/");
}