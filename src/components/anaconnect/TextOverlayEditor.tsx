"use client";

import { AlignCenter, AlignLeft, AlignRight, Type, Trash2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ComposerMediaItem } from "@/types/composer";

interface TextOverlayEditorProps {
  media: ComposerMediaItem | null;
  onAddLayer: () => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (
    layerId: string,
    patch: Partial<{
      text: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      color: string;
      opacity: number;
      font: "Classic" | "Modern" | "Bold" | "Script";
      background: boolean;
      align: "left" | "center" | "right";
    }>
  ) => void;
  onDeleteLayer: (layerId: string) => void;
}

const fontOptions = ["Classic", "Modern", "Bold", "Script"] as const;

export function TextOverlayEditor({
  media,
  onAddLayer,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
}: TextOverlayEditorProps) {
  if (!media) {
    return null;
  }

  const selectedLayer = media.edits.textLayers.find(
    (layer) => layer.id === media.edits.selectedTextLayerId
  );

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Text Over Image</p>
          <p className="text-xs text-slate-400">Add layers, drag on preview, edit inline.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
          onClick={onAddLayer}
        >
          Add Text
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {media.edits.textLayers.length ? (
          media.edits.textLayers.map((layer, idx) => {
            const active = layer.id === selectedLayer?.id;
            return (
              <button
                key={layer.id}
                type="button"
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs transition",
                  active
                    ? "border-cyan-300 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
                )}
                onClick={() => onSelectLayer(layer.id)}
              >
                Layer {idx + 1}
              </button>
            );
          })
        ) : (
          <p className="text-xs text-slate-400">No text layers yet.</p>
        )}
      </div>

      {selectedLayer ? (
        <div className="space-y-4 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
          <div className="space-y-2">
            <label className="text-xs text-slate-300">Text Content</label>
            <textarea
              value={selectedLayer.text}
              onChange={(event) => onUpdateLayer(selectedLayer.id, { text: event.target.value })}
              className="h-16 w-full resize-none rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-slate-300">Font</label>
              <Select
                value={selectedLayer.font}
                onValueChange={(value) =>
                  onUpdateLayer(selectedLayer.id, {
                    font: value as "Classic" | "Modern" | "Bold" | "Script",
                  })
                }
              >
                <SelectTrigger className="h-9 border-slate-700 bg-slate-900/70 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-300">Color</label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-2">
                <Type className="h-4 w-4 text-slate-400" />
                <input
                  type="color"
                  value={selectedLayer.color}
                  onChange={(event) => onUpdateLayer(selectedLayer.id, { color: event.target.value })}
                  className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs text-slate-300">{selectedLayer.color.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Size</span>
              <span>{selectedLayer.scale.toFixed(2)}x</span>
            </div>
            <Slider
              min={0.5}
              max={3}
              step={0.01}
              value={[selectedLayer.scale]}
              onValueChange={(value) => onUpdateLayer(selectedLayer.id, { scale: value[0] ?? 1 })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Rotation</span>
              <span>{Math.round(selectedLayer.rotation)} deg</span>
            </div>
            <Slider
              min={-45}
              max={45}
              step={1}
              value={[selectedLayer.rotation]}
              onValueChange={(value) => onUpdateLayer(selectedLayer.id, { rotation: value[0] ?? 0 })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Opacity</span>
              <span>{Math.round(selectedLayer.opacity * 100)}%</span>
            </div>
            <Slider
              min={0.1}
              max={1}
              step={0.01}
              value={[selectedLayer.opacity]}
              onValueChange={(value) => onUpdateLayer(selectedLayer.id, { opacity: value[0] ?? 1 })}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-md border p-1.5",
                  selectedLayer.align === "left"
                    ? "border-cyan-300 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-700 text-slate-300"
                )}
                onClick={() => onUpdateLayer(selectedLayer.id, { align: "left" })}
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md border p-1.5",
                  selectedLayer.align === "center"
                    ? "border-cyan-300 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-700 text-slate-300"
                )}
                onClick={() => onUpdateLayer(selectedLayer.id, { align: "center" })}
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md border p-1.5",
                  selectedLayer.align === "right"
                    ? "border-cyan-300 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-700 text-slate-300"
                )}
                onClick={() => onUpdateLayer(selectedLayer.id, { align: "right" })}
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-300">
              <Switch
                checked={selectedLayer.background}
                onCheckedChange={(checked) => onUpdateLayer(selectedLayer.id, { background: checked })}
              />
              Background highlight
            </label>

            <button
              type="button"
              onClick={() => onDeleteLayer(selectedLayer.id)}
              className="inline-flex items-center gap-1 rounded-md border border-rose-400/35 bg-rose-500/10 px-2 py-1 text-xs text-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
