import { apiFetch } from "@/lib/api";

export type Wallet = {
  deposit_balance: string;
  account_balance: string;
  yield_balance: string;
  total_yield_earned: string;
  total_withdrawn: string;
  updated_at: string;
};

export type Transaction = {
  id: number;
  wallet_type: "deposit" | "account" | "yield";
  transaction_type: string;
  transaction_type_display: string;
  amount: string;
  balance_after: string;
  description: string;
  created_at: string;
};

export type TransactionFilter = "all" | "deposits" | "withdrawals" | "tasks";

const DEPOSIT_TYPES = new Set(["deposit_manual", "deposit_automatic"]);
const WITHDRAWAL_TYPES = new Set(["withdrawal"]);

// "Tasks" groups every earning activity — chat, survey, wheel, app/movie
// review, referral commission — plus anything else that isn't a deposit
// or withdrawal (plan purchases, refunds, admin adjustments). One bucket
// keeps the filter simple (all/deposits/withdrawals/tasks) rather than
// exposing every internal transaction_type as its own filter option.
export function matchesTransactionFilter(tx: Transaction, filter: TransactionFilter): boolean {
  if (filter === "all") return true;
  if (filter === "deposits") return DEPOSIT_TYPES.has(tx.transaction_type);
  if (filter === "withdrawals") return WITHDRAWAL_TYPES.has(tx.transaction_type);
  return !DEPOSIT_TYPES.has(tx.transaction_type) && !WITHDRAWAL_TYPES.has(tx.transaction_type);
}

export function getMyWallet() {
  return apiFetch<Wallet>("/api/wallets/me/");
}

export function getMyTransactions() {
  return apiFetch<Transaction[]>("/api/wallets/transactions/");
}

export function formatAmount(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}