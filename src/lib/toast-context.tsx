import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  showToast: (kind: ToastKind, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 5000;

import { XIcon } from "@/components/icons/Icons";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Sticky at the very top of the viewport, stacking downward — not
          tied to any one page's layout, so it works the same on every
          screen (forms, chat, wheel, wherever a toast fires from). */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4">
        {toasts.map((t) => (
          <ToastBanner key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const kindStyles: Record<ToastKind, string> = {
    success: "bg-dash-accent-500 text-dash-bg",
    error: "bg-red-500 text-white",
    info: "bg-dash-surface text-dash-text ring-1 ring-dash-border",
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-full max-w-md animate-toast-in items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${kindStyles[toast.kind]}`}
    >
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <XIcon size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return {
    success: (message: string) => ctx.showToast("success", message),
    error: (message: string) => ctx.showToast("error", message),
    info: (message: string) => ctx.showToast("info", message),
  };
}