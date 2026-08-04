import { CHAT_BACKGROUNDS, type ChatBackgroundId } from "@/lib/chat-background";

export default function ChatBackgroundPicker({
  current,
  onSelect,
}: {
  current: ChatBackgroundId;
  onSelect: (id: ChatBackgroundId) => void;
}) {
  return (
    <div className="w-56 rounded-lg bg-dash-surface p-3 shadow-lg ring-1 ring-dash-border">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-dash-text/40">Chat background</p>
      <div className="grid grid-cols-3 gap-2">
        {CHAT_BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onSelect(bg.id)}
            className={`h-12 rounded-md ${bg.className} ${
              current === bg.id ? "ring-2 ring-dash-accent-500" : "ring-1 ring-dash-border"
            }`}
            title={bg.label}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-dash-text/40">
        {CHAT_BACKGROUNDS.find((b) => b.id === current)?.label}
      </p>
    </div>
  );
}