// No backend notifications model exists yet — this returns realistic mock
// data so the UI can be built and reviewed now. Swapping to a real API
// later is a one-line change: replace the body of getNotifications() with
// `return apiFetch<Notification[]>("/api/notifications/");` — the shape
// below is deliberately what that endpoint should return.

export type NotificationType = "credit" | "chat" | "review" | "system";

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "credit",
    title: "Account credited",
    body: "You've been credited KES 30 for a chat session.",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
  },
  {
    id: 2,
    type: "review",
    title: "App review approved",
    body: "Your review for 'PesaTrack' was approved and credited.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
  },
  {
    id: 3,
    type: "system",
    title: "Survey available",
    body: "Today's survey is live — 10 questions, all correct earns KES 20.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    read: true,
  },
];

export function getNotifications() {
  return Promise.resolve(MOCK_NOTIFICATIONS);
}

export function getUnreadCount() {
  return Promise.resolve(MOCK_NOTIFICATIONS.filter((n) => !n.read).length);
}
