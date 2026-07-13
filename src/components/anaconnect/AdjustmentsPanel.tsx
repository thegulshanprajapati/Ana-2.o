"use client";

import { SlidersHorizontal } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { ComposerMediaItem } from "@/types/composer";

const adjustmentConfig = [
  { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  { key: "warmth", label: "Warmth", min: -100, max: 100, step: 1 },
  { key: "sharpness", label: "Sharpness", min: -100, max: 100, step: 1 },
  { key: "blur", label: "Blur", min: 0, max: 12, step: 0.1 },
  { key: "vignette", label: "Vignette", min: 0, max: 100, step: 1 },
] as const;

interface AdjustmentsPanelProps {
  media: ComposerMediaItem | null;
  onAdjustmentChange: (
    key:
      | "brightness"
      | "contrast"
      | "saturation"
      | "warmth"
      | "sharpness"
      | "blur"
      | "vignette",
    value: number
  ) => void;
  onReset: () => void;
}

export function AdjustmentsPanel({ media, onAdjustmentChange, onReset }: AdjustmentsPanelProps) {
  if (!media) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <Accordion type="single" collapsible defaultValue="adjustments" className="border-none">
        <AccordionItem value="adjustments" className="border-none">
          <AccordionTrigger className="py-1 text-sm font-semibold text-slate-100 hover:no-underline">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
              Manual Adjustments
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-3">
            {adjustmentConfig.map((config) => {
              const value = media.edits.adjustments[config.key];
              return (
                <div key={config.key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{config.label}</span>
                    <span>{typeof value === "number" ? value.toFixed(config.step < 1 ? 1 : 0) : value}</span>
                  </div>
                  <Slider
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={[value]}
                    onValueChange={(current) => onAdjustmentChange(config.key, current[0] ?? value)}
                  />
                </div>
              );
            })}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Reset adjustments
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
