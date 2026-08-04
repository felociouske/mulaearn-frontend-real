export type ChatBackgroundId = "default" | "midnight" | "forest" | "sunset" | "ocean" | "plain";

export const CHAT_BACKGROUNDS: { id: ChatBackgroundId; label: string; className: string }[] = [
  { id: "default", label: "Default", className: "bg-dash-surface" },
  { id: "midnight", label: "Midnight", className: "bg-gradient-to-b from-slate-900 to-slate-800" },
  { id: "forest", label: "Forest", className: "bg-gradient-to-b from-emerald-950 to-dash-surface" },
  { id: "sunset", label: "Sunset", className: "bg-gradient-to-b from-amber-950 to-dash-surface" },
  { id: "ocean", label: "Ocean", className: "bg-gradient-to-b from-indigo-950 to-dash-surface" },
  { id: "plain", label: "Plain dark", className: "bg-dash-bg" },
];

const STORAGE_KEY = "easyearn_chat_background";

export function getSavedChatBackground(): ChatBackgroundId {
  if (typeof window === "undefined") return "default";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return (CHAT_BACKGROUNDS.find((b) => b.id === saved)?.id ?? "default");
}

export function saveChatBackground(id: ChatBackgroundId) {
  window.localStorage.setItem(STORAGE_KEY, id);
}