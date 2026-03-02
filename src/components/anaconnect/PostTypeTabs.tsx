"use client";

import { motion } from "framer-motion";
import { Camera, Clapperboard, FileText, GalleryHorizontal, BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { POST_TYPE_OPTIONS, PostTypeValue } from "@/types/composer";

const iconMap = {
  photo: Camera,
  text: FileText,
  story: GalleryHorizontal,
  reel: Clapperboard,
  poll: BarChart3,
} as const;

interface PostTypeTabsProps {
  value: PostTypeValue;
  onChange: (next: PostTypeValue) => void;
}

export function PostTypeTabs({ value, onChange }: PostTypeTabsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-1.5 shadow-[0_10px_35px_-24px_rgba(59,130,246,0.7)] backdrop-blur-xl">
      <div className="relative flex flex-wrap items-center gap-1">
        {POST_TYPE_OPTIONS.map((option) => {
          const Icon = iconMap[option.id];
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                "relative z-10 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition md:px-4",
                active ? "text-white" : "text-slate-300 hover:text-white"
              )}
              onClick={() => onChange(option.id)}
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
              {active ? (
                <motion.span
                  layoutId="anaconnect-tab-underline"
                  className="absolute inset-0 -z-10 rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-emerald-400/15"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
