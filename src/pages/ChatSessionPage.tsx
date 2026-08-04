import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMySessions, getSession, sendMessage, formatLastSeen, type ChatSession } from "@/lib/chats";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { getSavedChatBackground, saveChatBackground, CHAT_BACKGROUNDS, type ChatBackgroundId } from "@/lib/chat-background";
import ComingSoonCallModal from "@/components/dashboard/ComingSoonCallModal";
import EmojiPicker from "@/components/dashboard/EmojiPicker";
import StickerPicker from "@/components/dashboard/StickerPicker";
import ChatBackgroundPicker from "@/components/dashboard/ChatBackgroundPicker";
import { PhoneIcon, VideoIcon, PaperclipIcon, SmileIcon, PaletteIcon, StickerIcon } from "@/components/icons/Icons";

const POLL_INTERVAL_MS = 4000;

type Popover = "emoji" | "sticker" | "background" | null;

export default function ChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const sessionId = Number(params.sessionId);
  const { user } = useAuth();
  const toast = useToast();
  const currencySymbol = user?.country?.currency_symbol ?? "";

  const [session, setSession] = useState<ChatSession | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [callModal, setCallModal] = useState<"audio" | "video" | null>(null);
  const [openPopover, setOpenPopover] = useState<Popover>(null);
  const [background, setBackground] = useState<ChatBackgroundId>(getSavedChatBackground());
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const knownMessageIds = useRef<Set<number>>(new Set());

  const backgroundClassName = CHAT_BACKGROUNDS.find((b) => b.id === background)?.className ?? "bg-dash-surface";

  // Initial load — needs the full sessions list once, to confirm this
  // session belongs to the user (getSession() alone would 404 either way,
  // but this keeps the "not found" messaging consistent with before).
  useEffect(() => {
    getMySessions()
      .then((sessions) => {
        const match = sessions.find((s) => s.id === sessionId);
        if (!match) {
          setError("Chat session not found.");
          return;
        }
        setSession(match);
        knownMessageIds.current = new Set(match.messages.map((m) => m.id));
      })
      .catch(() => setError("Couldn't load this chat — please refresh the page."));
  }, [sessionId]);

  // Poll for staff replies (and online-status changes) every few seconds —
  // there's no WebSocket/live-push infra yet, so this is the "live like
  // WhatsApp" mechanism for now. Good enough for a chat where replies come
  // in on the order of minutes, not milliseconds; upgrading to WebSockets
  // later is a drop-in swap of this one effect.
  useEffect(() => {
    const interval = setInterval(() => {
      getSession(sessionId)
        .then((updated) => {
          const newOnes = updated.messages.filter((m) => !knownMessageIds.current.has(m.id));
          const newCredit = newOnes.find((m) => Number(m.amount_credited) > 0);
          if (newCredit) {
            toast.success(`You've been credited ${currencySymbol} ${newCredit.amount_credited}!`);
          }
          knownMessageIds.current = new Set(updated.messages.map((m) => m.id));
          setSession(updated);
        })
        .catch(() => {
          /* a missed poll tick isn't worth surfacing as an error */
        });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length]);

  async function sendText(text: string) {
    if (!text.trim() || !session) return;
    setIsSending(true);
    try {
      const message = await sendMessage(sessionId, text);
      knownMessageIds.current.add(message.id);
      setSession((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
      if (Number(message.amount_credited) > 0) {
        toast.success(`You've been credited ${currencySymbol} ${message.amount_credited}!`);
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft;
    setDraft("");
    await sendText(text);
  }

  function handleSelectBackground(id: ChatBackgroundId) {
    setBackground(id);
    saveChatBackground(id);
    setOpenPopover(null);
  }

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  function handleFileChosen() {
    // Sending real media isn't wired up yet — there's no backend endpoint
    // to actually deliver a file to the other person. Rather than showing
    // it as if it were sent (which it wouldn't be), this is upfront about
    // it not being available yet.
    toast.info("Oops! Media sharing isn't available yet — coming soon.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (error && !session) {
    return (
      <div>
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        <button onClick={() => navigate("/chats")} className="mt-4 text-dash-accent-500 hover:underline">
          ← Back to chats
        </button>
      </div>
    );
  }

  if (!session) {
    return <p className="text-dash-text/50">Loading chat…</p>;
  }

  return (
    <div className="relative flex h-[calc(100vh-3rem)] flex-col rounded-lg bg-dash-surface md:h-[calc(100vh-5rem)]">
      {callModal && (
        <ComingSoonCallModal kind={callModal} profileName={session.chat_profile.name} onClose={() => setCallModal(null)} />
      )}

      <div className="flex items-center gap-3 border-b border-dash-border p-4">
        <button onClick={() => navigate("/chats")} className="text-dash-text/50 hover:text-dash-text">
          ←
        </button>
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-dash-overlay-strong text-sm font-semibold text-dash-text">
            {session.chat_profile.photo ? (
              <img src={session.chat_profile.photo} alt={session.chat_profile.name} className="h-full w-full object-cover" />
            ) : (
              session.chat_profile.name.charAt(0)
            )}
          </div>
          {session.chat_profile.is_online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dash-surface bg-dash-accent-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-dash-text">{session.chat_profile.name}</p>
          <p className="text-xs text-dash-text/40">
            {session.chat_profile.is_online ? (
              <span className="text-dash-accent-500">online</span>
            ) : (
              formatLastSeen(session.chat_profile.last_seen_at)
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setCallModal("audio")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-dash-text/60 transition-colors hover:bg-dash-overlay hover:text-dash-text"
            title="Audio call"
          >
            <PhoneIcon size={17} />
          </button>
          <button
            onClick={() => setCallModal("video")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-dash-text/60 transition-colors hover:bg-dash-overlay hover:text-dash-text"
            title="Video call"
          >
            <VideoIcon size={18} />
          </button>
          <div className="relative">
            <button
              onClick={() => setOpenPopover((p) => (p === "background" ? null : "background"))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-dash-text/60 transition-colors hover:bg-dash-overlay hover:text-dash-text"
              title="Chat background"
            >
              <PaletteIcon size={18} />
            </button>
            {openPopover === "background" && (
              <div className="absolute right-0 top-11 z-20">
                <ChatBackgroundPicker current={background} onSelect={handleSelectBackground} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 space-y-3 overflow-y-auto p-4 transition-colors ${backgroundClassName}`}>
        {session.messages.map((message) => {
          const isUser = message.sender === "user";
          return (
            <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isUser ? "bg-dash-accent-500 text-dash-bg" : "bg-dash-overlay-strong text-dash-text"}`}>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p className={`mt-1 text-[10px] ${isUser ? "text-dash-bg/60" : "text-dash-text/40"}`}>
                  {new Date(message.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {Number(message.amount_credited) > 0 && ` · +${message.amount_credited}`}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-1 border-t border-dash-border p-3">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} accept="image/*" />

        <button
          type="button"
          onClick={handleAttachmentClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dash-text/50 transition-colors hover:bg-dash-overlay hover:text-dash-text"
          title="Attach media"
        >
          <PaperclipIcon size={18} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover((p) => (p === "emoji" ? null : "emoji"))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dash-text/50 transition-colors hover:bg-dash-overlay hover:text-dash-text"
            title="Emoji"
          >
            <SmileIcon size={18} />
          </button>
          {openPopover === "emoji" && (
            <div className="absolute bottom-11 left-0 z-20">
              <EmojiPicker onSelect={(emoji) => setDraft((d) => d + emoji)} />
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover((p) => (p === "sticker" ? null : "sticker"))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dash-text/50 transition-colors hover:bg-dash-overlay hover:text-dash-text"
            title="Stickers"
          >
            <StickerIcon size={18} />
          </button>
          {openPopover === "sticker" && (
            <div className="absolute bottom-11 left-0 z-20">
              <StickerPicker
                onSend={(sticker) => {
                  setOpenPopover(null);
                  sendText(sticker);
                }}
              />
            </div>
          )}
        </div>

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setOpenPopover(null)}
          placeholder="Type a message…"
          className="flex-1 rounded-full bg-dash-overlay-strong px-4 py-2 text-sm text-dash-text placeholder:text-dash-text/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-full bg-dash-accent-500 px-5 py-2 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}