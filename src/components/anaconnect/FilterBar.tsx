"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FILTER_PRESETS, FilterPresetId, ComposerMediaItem } from "@/types/composer";

interface FilterBarProps {
  media: ComposerMediaItem | null;
  applyToAll: boolean;
  onToggleApplyToAll: (next: boolean) => void;
  onFilterSelect: (filter: FilterPresetId) => void;
  onAutoEnhance: () => void;
}

export function FilterBar({
  media,
  applyToAll,
  onToggleApplyToAll,
  onFilterSelect,
  onAutoEnhance,
}: FilterBarProps) {
  if (!media) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Instagram Filters</p>
          <p className="text-xs text-slate-400">Tap a style for live preview.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <Switch checked={applyToAll} onCheckedChange={onToggleApplyToAll} />
            Apply to all
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
            onClick={onAutoEnhance}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto Enhance
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="flex gap-3 overflow-x-auto pb-1"
      >
        {FILTER_PRESETS.map((preset, index) => {
          const selected = media.edits.filter === preset.id;
          return (
            <motion.button
              key={preset.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "group w-20 shrink-0 rounded-xl border p-1.5 transition",
                selected ? "border-cyan-300 bg-cyan-500/20" : "border-slate-700 bg-slate-900/60"
              )}
              onClick={() => onFilterSelect(preset.id)}
            >
              <div
                className="h-12 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56,189,248,.8) 0%, rgba(59,130,246,.45) 44%, rgba(16,185,129,.38) 100%)",
                  filter: preset.css,
                }}
              />
              <p className="mt-1.5 truncate text-[11px] font-medium text-slate-200 group-hover:text-white">
                {preset.name}
              </p>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}
