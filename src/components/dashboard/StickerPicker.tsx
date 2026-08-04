// "Stickers" here are just larger, expressive emoji sent as an actual
// message the moment you tap one — they go through the same real
// sendMessage() call as typed text, so the other person genuinely
// receives them (unlike the call buttons/media upload, which have no
// backend to actually deliver anything to).
const STICKERS = ["👍", "😂", "❤️", "🎉", "🔥", "👏", "😢", "😮", "🙏", "💯", "🥳", "😴"];

export default function StickerPicker({ onSend }: { onSend: (sticker: string) => void }) {
  return (
    <div className="w-64 rounded-lg bg-dash-surface p-3 shadow-lg ring-1 ring-dash-border">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-dash-text/40">Stickers</p>
      <div className="grid grid-cols-4 gap-2">
        {STICKERS.map((sticker) => (
          <button
            key={sticker}
            type="button"
            onClick={() => onSend(sticker)}
            className="rounded-lg p-2 text-3xl transition-transform hover:scale-110 hover:bg-dash-overlay"
          >
            {sticker}
          </button>
        ))}
      </div>
    </div>
  );
}