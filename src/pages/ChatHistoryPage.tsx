import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMySessions, type ChatSession } from "@/lib/chats";

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch(() => setError("Couldn't load your chat history — please refresh the page."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Chat History</h1>
      <p className="mt-1 text-sm text-dash-text/50">Every conversation you've started, active or ended.</p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">
          No chats yet.{" "}
          <Link to="/chats" className="font-medium text-dash-accent-500 hover:underline">
            Start one →
          </Link>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-dash-border rounded-lg bg-dash-surface">
          {sessions.map((session) => {
            const lastMessage = session.messages[session.messages.length - 1];
            return (
              <Link
                key={session.id}
                to={`/chats/${session.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-dash-overlay"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dash-overlay-strong text-sm font-semibold text-dash-text">
                    {session.chat_profile.photo ? (
                      <img
                        src={session.chat_profile.photo}
                        alt={session.chat_profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      session.chat_profile.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-dash-text">{session.chat_profile.name}</p>
                    <p className="max-w-xs truncate text-xs text-dash-text/40">
                      {lastMessage ? lastMessage.content : "No messages yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      session.is_active
                        ? "bg-dash-accent-500/15 text-dash-accent-500"
                        : "bg-dash-overlay text-dash-text/40"
                    }`}
                  >
                    {session.is_active ? "Active" : "Ended"}
                  </span>
                  <span className="text-xs text-dash-text/40">
                    {new Date(session.started_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
