const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀", "😂", "😊", "😍", "😘", "😉", "😎", "🤔", "😢", "😮", "🙄", "😴"],
  },
  {
    label: "Gestures",
    emojis: ["👍", "👎", "🙏", "👏", "🤝", "💪", "✌️", "🤞", "👋", "🤗", "🙌", "👌"],
  },
  {
    label: "Hearts",
    emojis: ["❤️", "💚", "💙", "💛", "🧡", "💜", "💕", "💯", "🔥", "✨", "🎉", "⭐"],
  },
];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="w-72 rounded-lg bg-dash-surface p-3 shadow-lg ring-1 ring-dash-border">
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-2 last:mb-0">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-dash-text/40">{group.label}</p>
          <div className="grid grid-cols-6 gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                type="button"
                className="rounded-md p-1.5 text-xl transition-colors hover:bg-dash-overlay"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}