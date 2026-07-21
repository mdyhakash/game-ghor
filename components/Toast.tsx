"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ToastKind = "error" | "success" | "info";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
  confirmToast: (
    message: string,
    options?: { confirmLabel?: string; cancelLabel?: string },
  ) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  // Plain message toast — auto-dismisses. Use for errors/success/info.
  const showToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, kind }]);
      timers.current[id] = setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  // Confirmation toast — stays until the user picks Confirm or Cancel.
  // Replaces window.confirm(); resolves true/false like a promise-based confirm.
  const confirmToast = useCallback(
    (
      message: string,
      options?: { confirmLabel?: string; cancelLabel?: string },
    ) => {
      return new Promise<boolean>((resolve) => {
        const id = nextId++;
        setToasts((prev) => [
          ...prev,
          {
            id,
            message,
            kind: "error",
            confirmLabel: options?.confirmLabel ?? "Confirm",
            cancelLabel: options?.cancelLabel ?? "Cancel",
            onConfirm: () => {
              removeToast(id);
              resolve(true);
            },
            onCancel: () => {
              removeToast(id);
              resolve(false);
            },
          },
        ]);
      });
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, confirmToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`relative rounded-xl border px-4 py-3 text-[13px] shadow-lg bg-card ${
              t.kind === "error"
                ? "border-pink"
                : t.kind === "success"
                  ? "border-lime"
                  : "border-line"
            }`}
          >
            <div className="font-medium text-text">{t.message}</div>
            {t.onConfirm ? (
              <div className="flex justify-end gap-2 mt-2.5">
                <button
                  onClick={t.onCancel}
                  className="text-[12px] font-semibold text-text-dim bg-bg-soft border border-line px-3 py-1 rounded-full"
                >
                  {t.cancelLabel}
                </button>
                <button
                  onClick={t.onConfirm}
                  className="text-[12px] font-semibold text-white px-3 py-1 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--pink), var(--purple))",
                  }}
                >
                  {t.confirmLabel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => removeToast(t.id)}
                className="absolute top-2 right-3 text-text-dim text-sm leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
