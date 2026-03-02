"use client";

import { motion } from "framer-motion";
import { CalendarClock, ImageIcon, Loader2, MapPin, Smile, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomActionBarProps {
  characterCount: number;
  maxCharacters: number;
  disabled: boolean;
  loading: boolean;
  scheduled: boolean;
  onPrimaryAction: () => void;
  onOpenImageUpload: () => void;
  onOpenVideoUpload: () => void;
  onEmoji: () => void;
  onLocation: () => void;
  onSchedule: () => void;
}

export function BottomActionBar({
  characterCount,
  maxCharacters,
  disabled,
  loading,
  scheduled,
  onPrimaryAction,
  onOpenImageUpload,
  onOpenVideoUpload,
  onEmoji,
  onLocation,
  onSchedule,
}: BottomActionBarProps) {
  return (
    <>
      <div className="hidden items-center justify-between rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-950/45 px-4 py-3 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onOpenImageUpload}>
            <ImageIcon className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onOpenVideoUpload}>
            <Video className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onEmoji}>
            <Smile className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onLocation}>
            <MapPin className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onSchedule}>
            <CalendarClock className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <span className={cn("text-xs", characterCount > maxCharacters ? "text-rose-500 dark:text-rose-300" : "text-slate-600 dark:text-slate-400")}>
            {characterCount}/{maxCharacters}
          </span>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onPrimaryAction}
            disabled={disabled || loading}
            className={cn(
              "group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold transition",
              disabled || loading
                ? "cursor-not-allowed bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                : "bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 text-white shadow-lg dark:shadow-[0_10px_26px_-12px_rgba(34,211,238,0.9)]"
            )}
          >
            {!disabled && !loading ? (
              <span className="pointer-events-none absolute inset-y-0 -left-10 w-8 rotate-12 bg-white/60 opacity-0 transition duration-500 group-hover:translate-x-64 group-hover:opacity-100" />
            ) : null}
            <span className="relative inline-flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {scheduled ? "Schedule" : "Post"}
            </span>
          </motion.button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-slate-950/92 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-1">
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onOpenImageUpload}>
            <ImageIcon className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onOpenVideoUpload}>
            <Video className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onEmoji}>
            <Smile className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onLocation}>
            <MapPin className="h-4.5 w-4.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-600 dark:text-slate-200" onClick={onSchedule}>
            <CalendarClock className="h-4.5 w-4.5" />
          </Button>
          <span className="ml-2 text-xs text-slate-600 dark:text-slate-400">{characterCount}/{maxCharacters}</span>
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={disabled || loading}
            onClick={onPrimaryAction}
            className={cn(
              "ml-auto rounded-full px-4 py-2 text-sm font-semibold transition",
              disabled || loading
                ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                : "bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 text-white dark:text-slate-950 shadow-lg dark:shadow-[0_10px_24px_-12px_rgba(34,211,238,0.8)]"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduled ? "Schedule" : "Post"}
          </motion.button>
        </div>
      </div>
    </>
  );
}
