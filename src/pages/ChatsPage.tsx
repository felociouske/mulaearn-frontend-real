import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUnlockedProfiles, startSession, formatLastSeen, type ChatProfile } from "@/lib/chats";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";

export default function ChatsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingId, setStartingId] = useState<number | null>(null);

  useEffect(() => {
    getUnlockedProfiles()
      .then(setProfiles)
      .catch(() => toast.error("Oops! Couldn't load chat profiles — please refresh the page."))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleStart(profileId: number) {
    setStartingId(profileId);
    try {
      const session = await startSession(profileId);
      navigate(`/chats/${session.id}`);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
      setStartingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Chats</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        Profiles unlocked by your current plan. Higher plan tiers unlock more.
      </p>

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">
          <p>No chat profiles are unlocked on your current plan yet.</p>
          <a href="/plans/chat" className="mt-2 inline-block font-medium text-dash-accent-500 hover:underline">
            View plans →
          </a>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleStart(profile.id)}
              disabled={startingId === profile.id}
              className="group flex flex-col overflow-hidden rounded-xl bg-dash-surface text-left transition-transform hover:-translate-y-1 disabled:opacity-60"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-dash-overlay-strong">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-dash-text/50">
                    {profile.name.charAt(0)}
                  </div>
                )}

                {profile.is_online && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-dash-bg/80 px-2 py-0.5 text-[10px] font-medium text-dash-accent-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-dash-accent-500" /> Online
                  </span>
                )}

                <span className="absolute bottom-2 left-2 rounded-full bg-dash-bg/80 px-2 py-0.5 text-[10px] font-semibold text-dash-accent-500">
                  ${profile.payout_amount_usd}
                </span>
              </div>

              <div className="p-3">
                <p className="truncate font-semibold text-dash-text">{profile.name}</p>
                <p className="truncate text-xs text-dash-text/40">
                  {profile.is_online ? (
                    <span className="text-dash-accent-500">online</span>
                  ) : (
                    formatLastSeen(profile.last_seen_at)
                  )}
                </p>
                {profile.bio && <p className="mt-1 truncate text-xs text-dash-text/50">{profile.bio}</p>}
              </div>

              {startingId === profile.id && (
                <p className="border-t border-dash-border px-3 py-2 text-center text-xs text-dash-text/40">Opening…</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}