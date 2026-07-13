"use client";

import { Crop, RotateCw, ZoomIn } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ASPECT_RATIO_OPTIONS, ComposerMediaItem } from "@/types/composer";

interface CropPanelProps {
  media: ComposerMediaItem | null;
  onAspectChange: (aspect: "square" | "portrait" | "landscape" | "original") => void;
  onCropChange: (patch: Partial<ComposerMediaItem["edits"]["crop"]>) => void;
}

export function CropPanel({ media, onAspectChange, onCropChange }: CropPanelProps) {
  if (!media) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Crop className="h-4 w-4 text-cyan-300" />
        Aspect Ratio + Crop
      </div>

      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIO_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
              media.edits.crop.aspect === option.id
                ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-100"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
            )}
            onClick={() => onAspectChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ZoomIn className="h-3.5 w-3.5" />
              Zoom
            </span>
            <span>{media.edits.crop.zoom.toFixed(2)}x</span>
          </div>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={[media.edits.crop.zoom]}
            onValueChange={(value) => onCropChange({ zoom: value[0] ?? 1 })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <RotateCw className="h-3.5 w-3.5" />
              Rotate
            </span>
            <span>{Math.round(media.edits.crop.rotation)} deg</span>
          </div>
          <Slider
            min={-30}
            max={30}
            step={1}
            value={[media.edits.crop.rotation]}
            onValueChange={(value) => onCropChange({ rotation: value[0] ?? 0 })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onCropChange({ offsetX: 0, offsetY: 0, zoom: 1, rotation: 0 })}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
        >
          Reset crop
        </button>
      </div>
    </section>
  );
}
