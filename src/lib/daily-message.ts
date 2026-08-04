const dailyMessages = [
  "Tip: complete your profile's country details to unlock the right local payment methods.",
  "Reminder: the minimum withdrawal is Ksh 200 (or your local equivalent) — no withdrawal fee applies.",
  "Did you know? You earn 70% commission whenever someone you referred purchases a plan.",
  "Tip: higher plan tiers unlock more chat profiles, apps, and movies to review each day.",
  "Reminder: survey questions go live every Monday, Wednesday, and Friday — score all 10 for the top payout.",
  "Tip: you get 3 wheel spins a day, resetting at midnight.",
  "Welcome! Explore Chats, Survey & Wheel, and App/Movie Reviews to see what's available to you today.",
];

export function getDailyMessage(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dailyMessages[dayOfYear % dailyMessages.length];
}
