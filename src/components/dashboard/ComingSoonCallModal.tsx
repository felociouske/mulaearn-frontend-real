import { PhoneIcon, VideoIcon, XIcon } from "@/components/icons/Icons";

export default function ComingSoonCallModal({
  kind,
  profileName,
  onClose,
}: {
  kind: "audio" | "video";
  profileName: string;
  onClose: () => void;
}) {
  const Icon = kind === "audio" ? PhoneIcon : VideoIcon;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-dash-surface p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="float-right text-dash-text/50 hover:text-dash-text">
          <XIcon size={18} />
        </button>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-dash-accent-500/15 text-dash-accent-500">
          <Icon size={28} />
        </div>
        <p className="mt-4 text-lg font-semibold text-dash-text">
          {kind === "audio" ? "Audio" : "Video"} calls are coming soon
        </p>
        <p className="mt-1 text-sm text-dash-text/50">
          You'll be able to call {profileName} directly once this feature ships. For now, keep the
          conversation going in chat.
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600"
        >
          Got it
        </button>
      </div>
    </div>
  );
}