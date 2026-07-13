"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";

import { ComposerToast } from "@/types/composer";

interface ToastsProps {
  toasts: ComposerToast[];
  onDismiss: (id: string) => void;
}

const toneMap = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  },
  error: {
    icon: XCircle,
    className: "border-rose-400/35 bg-rose-500/10 text-rose-100",
  },
  info: {
    icon: Info,
    className: "border-cyan-300/35 bg-cyan-500/10 text-cyan-100",
  },
} as const;

export function Toasts({ toasts, onDismiss }: ToastsProps) {
  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        onDismiss(toast.id);
      }, 2600)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onDismiss, toasts]);

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const tone = toast.tone ?? "info";
          const config = toneMap[tone];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-lg backdrop-blur ${config.className}`}
            >
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? (
                    <p className="text-xs opacity-90">{toast.description}</p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
