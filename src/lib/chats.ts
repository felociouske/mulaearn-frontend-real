import { apiFetch } from "@/lib/api";

export type ChatProfile = {
  id: number;
  name: string;
  photo: string | null;
  bio: string;
  payout_amount_usd: string;
  is_active: boolean;
  is_online: boolean;
  last_seen_at: string | null;
};

export type ChatMessage = {
  id: number;
  sender: "user" | "profile";
  content: string;
  amount_credited: string;
  sent_at: string;
};

export type ChatSession = {
  id: number;
  chat_profile: ChatProfile;
  is_active: boolean;
  started_at: string;
  messages: ChatMessage[];
};

export function formatLastSeen(iso: string | null) {
  if (!iso) return "offline";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "last seen just now";
  if (mins < 60) return `last seen ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `last seen ${hours}h ago`;
  return `last seen ${Math.floor(hours / 24)}d ago`;
}

export function getUnlockedProfiles() {
  return apiFetch<ChatProfile[]>("/api/chat-profiles/unlocked/");
}

export function getMySessions() {
  return apiFetch<ChatSession[]>("/api/chats/sessions/");
}

export function getSession(sessionId: number) {
  return apiFetch<ChatSession>(`/api/chats/sessions/${sessionId}/`);
}

export function startSession(profileId: number) {
  return apiFetch<ChatSession>(`/api/chats/profiles/${profileId}/start/`, { method: "POST" });
}

export function sendMessage(sessionId: number, content: string) {
  return apiFetch<ChatMessage>(`/api/chats/sessions/${sessionId}/messages/`, {
    method: "POST",
    body: { content },
  });
}